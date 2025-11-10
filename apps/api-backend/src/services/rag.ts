import OpenAI from 'openai';
import { prisma } from '@/config/database';
import { EmbeddingService } from './embedding';

interface SearchResult {
  id: string;
  contentType: string;
  contentId: string;
  title: string;
  content: string;
  similarity: number;
  metadata: any;
}

interface ChatResponse {
  answer: string;
  sources: Array<{
    type: string;
    id: string;
    title: string;
    similarity: number;
  }>;
}

export class RAGService {
  private llm: OpenAI;
  private embeddingService: EmbeddingService;

  constructor() {
    // DeepSeek API 配置 - 从环境变量或运行时配置获取
    this.llm = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseURL: 'https://api.deepseek.com/v1'
    });

    this.embeddingService = new EmbeddingService();
  }

  /**
   * 获取API key（从数据库或环境变量）
   */
  private static async getApiKey(): Promise<string> {
    // 优先从运行时环境变量获取
    if (process.env.DEEPSEEK_API_KEY) {
      return process.env.DEEPSEEK_API_KEY;
    }

    // 从数据库获取
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'DEEPSEEK_API_KEY' }
      });
      return setting?.value || '';
    } catch (error) {
      console.error('Failed to fetch API key from database:', error);
      return '';
    }
  }

  /**
   * 创建RAG服务实例（异步）
   */
  static async create(): Promise<RAGService> {
    const apiKey = await RAGService.getApiKey();
    const instance = new RAGService();

    // 更新API key
    if (apiKey) {
      instance.llm = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.deepseek.com/v1'
      });
      instance.embeddingService = new EmbeddingService(apiKey);
    }

    return instance;
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
   * 向量相似度搜索
   */
  async search(query: string, limit = 10): Promise<SearchResult[]> {
    try {
      // 1. 将查询向量化
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // 2. 获取所有向量化的内容
      const allEmbeddings = await prisma.embeddedContent.findMany();

      // 3. 计算相似度并排序
      const results = allEmbeddings
        .map(item => {
          const itemEmbedding = JSON.parse(item.embedding);
          const similarity = this.cosineSimilarity(queryEmbedding, itemEmbedding);

          return {
            id: item.id,
            contentType: item.contentType,
            contentId: item.contentId,
            title: item.title,
            content: item.content,
            similarity,
            metadata: item.metadata
          };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw new Error('Vector search failed');
    }
  }

  /**
   * 智能问答
   */
  async chat(userQuery: string, conversationHistory: any[] = []): Promise<ChatResponse> {
    try {
      // 1. 检索相关内容
      const relevantDocs = await this.search(userQuery, 5);

      // 2. 构建上下文
      const context = relevantDocs
        .map(doc => {
          const type = doc.contentType === 'dataset' ? '数据集' : '案例集';
          return `【${type}: ${doc.title}】\n${doc.content}`;
        })
        .join('\n\n---\n\n');

      // 3. 构建系统提示词
      const systemPrompt = `你是 UCASS DataShare 平台的智能助手，专门帮助用户查找和理解人文社会科学领域的数据集和案例集。

## 你的职责
1. 基于检索到的相关内容回答用户问题
2. 推荐合适的数据集或案例集
3. 解释数据集的用途和特点
4. 提供研究方法建议

## 回答要求
- 只基于提供的内容回答，不要编造信息
- 如果内容不足以回答问题，请诚实说明
- 用友好、专业、简洁的语气
- 可以推荐相关的数据集或案例集（列出标题即可）
- 如果有多个相关结果，列出最相关的 3-5 个
- 使用 Markdown 格式组织回答

## 检索到的相关内容

${context}

---

请基于以上内容回答用户问题。`;

      // 4. 构建消息历史
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userQuery }
      ];

      // 5. 调用 LLM
      const response = await this.llm.chat.completions.create({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const answer = response.choices[0].message.content || '抱歉，我无法回答这个问题。';

      // 6. 返回结果
      return {
        answer,
        sources: relevantDocs.map(doc => ({
          type: doc.contentType,
          id: doc.contentId,
          title: doc.title,
          similarity: doc.similarity
        }))
      };
    } catch (error) {
      console.error('Chat failed:', error);
      throw new Error('智能问答失败，请稍后重试');
    }
  }

  /**
   * 推荐相关内容
   */
  async recommend(contentType: string, contentId: string, limit = 5): Promise<SearchResult[]> {
    try {
      // 1. 获取当前内容的向量
      const currentContent = await prisma.embeddedContent.findFirst({
        where: {
          contentType,
          contentId
        }
      });

      if (!currentContent) {
        throw new Error('Content not found');
      }

      // 2. 获取所有其他内容
      const allEmbeddings = await prisma.embeddedContent.findMany({
        where: {
          NOT: {
            id: currentContent.id
          }
        }
      });

      // 3. 计算相似度
      const currentEmbedding = JSON.parse(currentContent.embedding);
      const results = allEmbeddings
        .map(item => {
          const itemEmbedding = JSON.parse(item.embedding);
          const similarity = this.cosineSimilarity(currentEmbedding, itemEmbedding);

          return {
            id: item.id,
            contentType: item.contentType,
            contentId: item.contentId,
            title: item.title,
            content: item.content,
            similarity,
            metadata: item.metadata
          };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Recommendation failed:', error);
      throw new Error('Recommendation failed');
    }
  }

  /**
   * 生成内容摘要
   */
  async summarize(content: string): Promise<string> {
    try {
      const response = await this.llm.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的内容摘要助手。请用简洁的语言总结以下内容，不超过 100 字。'
          },
          {
            role: 'user',
            content
          }
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Summarization failed:', error);
      throw new Error('Summarization failed');
    }
  }
}
