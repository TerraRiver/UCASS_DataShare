import OpenAI from 'openai';
import { prisma } from '@/config/database';
import fs from 'fs';
import path from 'path';
import { ENV } from '@/config/env';

interface Dataset {
  id: string;
  name: string;
  catalog: string;
  summary: string | null;
  source: string;
  sourceUrl: string | null;
  recommendedCitations: string[];
}

interface CaseStudy {
  id: string;
  title: string;
  author: string;
  discipline: string;
  summary: string | null;
  publication: string;
  publicationYear: number | null;
  publicationUrl: string | null;
  practiceUrl: string | null;
}

interface MethodModule {
  id: string;
  code: string;
  name: string;
  englishName: string;
  summary: string | null;
  category: {
    code: string;
    name: string;
    englishName: string;
  };
  practiceUrl: string | null;
  enablePractice: boolean;
}

export class EmbeddingService {
  private client: OpenAI;
  private apiKey: string;

  constructor(apiKey?: string) {
    // 阿里云百炼 Qwen API 配置（兼容 OpenAI SDK）
    this.apiKey = apiKey || process.env.QWEN_EMBEDDING_API_KEY || '';
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    });
  }

  static async create(): Promise<EmbeddingService> {
    const apiKey = await EmbeddingService.fetchApiKey();

    if (!apiKey) {
      throw new Error('尚未配置 QWEN_EMBEDDING_API_KEY，请先在后台设置。');
    }

    return new EmbeddingService(apiKey);
  }

  private static async fetchApiKey(): Promise<string> {
    if (process.env.QWEN_EMBEDDING_API_KEY) {
      return process.env.QWEN_EMBEDDING_API_KEY;
    }

    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'QWEN_EMBEDDING_API_KEY' }
      });

      return setting?.value || '';
    } catch (error) {
      console.error('Failed to fetch Embedding API key from database:', error);
      return '';
    }
  }

  /**
   * 生成文本的向量表示
   * 使用 Qwen text-embedding-v4 模型
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.apiKey) {
        throw new Error('QWEN_EMBEDDING_API_KEY 未配置，请先在后台设置。');
      }

      const response = await this.client.embeddings.create({
        model: 'text-embedding-v4', // Qwen 的 embedding 模型
        input: text,
        encoding_format: 'float'  // 指定返回浮点数格式
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw new Error('Embedding generation failed');
    }
  }

  /**
   * 计算余弦相似度
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * 读取 README.md 或任意 .md 文件内容
   * 优先级：1. readme.md/README.md  2. 任意 .md 文件  3. 无
   */
  private async readReadmeContent(files: any[]): Promise<string> {
    // 优先查找 readme.md（不区分大小写，支持路径）
    let readmeFile = files.find((f: any) => {
      const fileName = f.originalName.toLowerCase();
      const baseName = fileName.split('/').pop()?.split('\\').pop() || '';
      return baseName === 'readme.md';
    });

    // 如果没有找到 readme.md，查找任意 .md 文件
    if (!readmeFile) {
      readmeFile = files.find((f: any) => {
        const ext = f.originalName.toLowerCase().split('.').pop();
        return ext === 'md';
      });
    }

    if (!readmeFile) {
      return '';
    }

    try {
      const filePath = path.join(ENV.UPLOAD_DIR, readmeFile.filename);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');

        // 移除 NULL 字节，PostgreSQL TEXT 类型不支持 NULL 字节
        content = content.replace(/\0/g, '');

        // 限制长度，避免 token 过多
        return content.slice(0, 2000);
      }
    } catch (error) {
      console.error('Failed to read README:', error);
    }

    return '';
  }

  /**
   * 向量化数据集
   */
  async embedDataset(dataset: any): Promise<void> {
    try {
      // 读取 README 内容
      const readmeContent = await this.readReadmeContent(dataset.files || []);

      // 构建要向量化的文本
      const text = `
标题: ${dataset.name}
分类: ${dataset.catalog}
简述: ${dataset.summary || '无'}
来源: ${dataset.source}
来源链接: ${dataset.sourceUrl || '无'}
推荐引用: ${dataset.recommendedCitations.join('; ') || '无'}

README 内容:
${readmeContent}
      `.trim();

      // 生成向量
      const embedding = await this.generateEmbedding(text);

      // 检查是否已存在
      const existing = await prisma.embeddedContent.findFirst({
        where: {
          contentType: 'dataset',
          contentId: dataset.id
        }
      });

      if (existing) {
        // 更新
        await prisma.embeddedContent.update({
          where: { id: existing.id },
          data: {
            title: dataset.name,
            content: text,
            embedding: JSON.stringify(embedding),
            metadata: {
              catalog: dataset.catalog,
              isFeatured: dataset.isFeatured,
              downloadCount: dataset.downloadCount,
            }
          }
        });
      } else {
        // 创建新记录
        await prisma.embeddedContent.create({
          data: {
            contentType: 'dataset',
            contentId: dataset.id,
            title: dataset.name,
            content: text,
            embedding: JSON.stringify(embedding),
            metadata: {
              catalog: dataset.catalog,
              isFeatured: dataset.isFeatured,
              downloadCount: dataset.downloadCount,
            }
          }
        });
      }

      console.log(`✓ Embedded dataset: ${dataset.name}`);
    } catch (error) {
      console.error(`Failed to embed dataset ${dataset.id}:`, error);
      throw error;
    }
  }

  /**
   * 向量化案例集
   */
  async embedCaseStudy(caseStudy: any): Promise<void> {
    try {
      // 读取 README 内容
      const readmeContent = await this.readReadmeContent(caseStudy.files || []);

      // 构建要向量化的文本
      const text = `
标题: ${caseStudy.title}
作者: ${caseStudy.author}
学科: ${caseStudy.discipline}
简述: ${caseStudy.summary || '无'}
发表: ${caseStudy.publication}
年份: ${caseStudy.publicationYear || '未知'}
发表链接: ${caseStudy.publicationUrl || '无'}
实践链接: ${caseStudy.practiceUrl || '无'}

README 内容:
${readmeContent}
      `.trim();

      // 生成向量
      const embedding = await this.generateEmbedding(text);

      // 检查是否已存在
      const existing = await prisma.embeddedContent.findFirst({
        where: {
          contentType: 'casestudy',
          contentId: caseStudy.id
        }
      });

      if (existing) {
        // 更新
        await prisma.embeddedContent.update({
          where: { id: existing.id },
          data: {
            title: caseStudy.title,
            content: text,
            embedding: JSON.stringify(embedding),
            metadata: {
              discipline: caseStudy.discipline,
              author: caseStudy.author,
              isFeatured: caseStudy.isFeatured,
              downloadCount: caseStudy.downloadCount,
            }
          }
        });
      } else {
        // 创建新记录
        await prisma.embeddedContent.create({
          data: {
            contentType: 'casestudy',
            contentId: caseStudy.id,
            title: caseStudy.title,
            content: text,
            embedding: JSON.stringify(embedding),
            metadata: {
              discipline: caseStudy.discipline,
              author: caseStudy.author,
              isFeatured: caseStudy.isFeatured,
              downloadCount: caseStudy.downloadCount,
            }
          }
        });
      }

      console.log(`✓ Embedded case study: ${caseStudy.title}`);
    } catch (error) {
      console.error(`Failed to embed case study ${caseStudy.id}:`, error);
      throw error;
    }
  }

  /**
   * 向量化方法模块
   */
  async embedMethodModule(methodModule: any): Promise<void> {
    try {
      // 读取 README 内容
      const readmeContent = await this.readReadmeContent(methodModule.files || []);

      // 构建要向量化的文本
      const text = `
标题: ${methodModule.name}
英文名: ${methodModule.englishName}
代码: ${methodModule.code}
分类: [${methodModule.category.code}] ${methodModule.category.name} (${methodModule.category.englishName})
简述: ${methodModule.summary || '无'}
实操链接: ${methodModule.enablePractice ? (methodModule.practiceUrl || '无') : '不支持实操'}

README 内容:
${readmeContent}
      `.trim();

      // 生成向量
      const embedding = await this.generateEmbedding(text);

      // 检查是否已存在
      const existing = await prisma.embeddedContent.findFirst({
        where: {
          contentType: 'methodmodule',
          contentId: methodModule.id
        }
      });

      if (existing) {
        // 更新
        await prisma.embeddedContent.update({
          where: { id: existing.id },
          data: {
            title: methodModule.name,
            content: text,
            embedding: JSON.stringify(embedding),
            metadata: {
              code: methodModule.code,
              categoryCode: methodModule.category.code,
              categoryName: methodModule.category.name,
              enablePractice: methodModule.enablePractice,
              downloadCount: methodModule.downloadCount,
            }
          }
        });
      } else {
        // 创建新记录
        await prisma.embeddedContent.create({
          data: {
            contentType: 'methodmodule',
            contentId: methodModule.id,
            title: methodModule.name,
            content: text,
            embedding: JSON.stringify(embedding),
            metadata: {
              code: methodModule.code,
              categoryCode: methodModule.category.code,
              categoryName: methodModule.category.name,
              enablePractice: methodModule.enablePractice,
              downloadCount: methodModule.downloadCount,
            }
          }
        });
      }

      console.log(`✓ Embedded method module: ${methodModule.name}`);
    } catch (error) {
      console.error(`Failed to embed method module ${methodModule.id}:`, error);
      throw error;
    }
  }

  /**
   * 批量向量化所有已审核的数据集
   */
  async embedAllDatasets(): Promise<number> {
    const datasets = await prisma.dataset.findMany({
      where: {
        isReviewed: true,
        isVisible: true
      },
      include: {
        files: true
      }
    });

    let count = 0;
    for (const dataset of datasets) {
      try {
        await this.embedDataset(dataset);
        count++;
        // 避免 API 限流，稍微延迟
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to embed dataset ${dataset.id}:`, error);
      }
    }

    return count;
  }

  /**
   * 批量向量化所有已审核的案例集
   */
  async embedAllCaseStudies(): Promise<number> {
    const caseStudies = await prisma.caseStudy.findMany({
      where: {
        isReviewed: true,
        isVisible: true
      },
      include: {
        files: true
      }
    });

    let count = 0;
    for (const caseStudy of caseStudies) {
      try {
        await this.embedCaseStudy(caseStudy);
        count++;
        // 避免 API 限流，稍微延迟
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to embed case study ${caseStudy.id}:`, error);
      }
    }

    return count;
  }

  /**
   * 批量向量化所有可见的方法模块
   */
  async embedAllMethodModules(): Promise<number> {
    const methodModules = await prisma.methodModule.findMany({
      where: {
        isVisible: true
      },
      include: {
        files: true,
        category: true
      }
    });

    let count = 0;
    for (const methodModule of methodModules) {
      try {
        await this.embedMethodModule(methodModule);
        count++;
        // 避免 API 限流，稍微延迟
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to embed method module ${methodModule.id}:`, error);
      }
    }

    return count;
  }

  /**
   * 删除向量化内容
   */
  async deleteEmbedding(contentType: string, contentId: string): Promise<void> {
    await prisma.embeddedContent.deleteMany({
      where: {
        contentType,
        contentId
      }
    });
  }
}
