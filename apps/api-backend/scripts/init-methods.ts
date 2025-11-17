import fs from 'fs/promises';
import path from 'path';
import prisma from '../src/config/database';

interface ParsedModule {
  code: string;
  name: string;
  englishName: string;
  description: string;
}

interface ParsedCategory {
  code: string;
  name: string;
  englishName: string;
  sortOrder: number;
  modules: ParsedModule[];
}

// 解析方法模块汇总.md文件
async function parseMethodsFile(filePath: string): Promise<ParsedCategory[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  const categories: ParsedCategory[] = [];
  let currentCategory: ParsedCategory | null = null;

  const categoryMap: Record<string, { name: string; englishName: string }> = {
    DA: { name: '数据获取', englishName: 'Data Acquisition' },
    DP: { name: '数据预处理与清洗', englishName: 'Data Preprocessing' },
    QS: { name: '基础定量与统计', englishName: 'Quantitative Statistics' },
    NLP: { name: '文本挖掘与NLP', englishName: 'Natural Language Processing' },
    SNA: { name: '网络分析', englishName: 'Social Network Analysis' },
    GIS: { name: '空间分析与GIS', englishName: 'Geographic Information System' },
    ML: { name: '机器学习', englishName: 'Machine Learning' },
    SM: { name: '仿真与建模', englishName: 'Simulation & Modeling' },
    DV: { name: '数据可视化', englishName: 'Data Visualization' },
    CI: { name: '因果推断与高级方法', englishName: 'Causal Inference & Advanced' },
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 匹配分类标题（例如：1. 数据获取 (DA: Data Acquisition)）
    const categoryMatch = trimmedLine.match(/^\d+\.\s+(.+?)\s+\(([A-Z]+):\s+(.+?)\)/);
    if (categoryMatch) {
      const [, nameCN, code, nameEN] = categoryMatch;
      currentCategory = {
        code,
        name: nameCN,
        englishName: nameEN,
        sortOrder: categories.length + 1,
        modules: [],
      };
      categories.push(currentCategory);
      continue;
    }

    // 匹配模块（例如：[ ] [DA01] 静态网页抓取 (Static Scraping): 使用 requests 和 BeautifulSoup4 抓取静态HTML页面并解析所需信息。）
    const moduleMatch = trimmedLine.match(/\[\s*\]\s+\[([A-Z0-9]+)\]\s+(.+?)\s+\((.+?)\):\s+(.+)/);
    if (moduleMatch && currentCategory) {
      const [, code, nameCN, nameEN, description] = moduleMatch;
      currentCategory.modules.push({
        code,
        name: nameCN,
        englishName: nameEN,
        description,
      });
    }
  }

  return categories;
}

async function initializeMethodModules() {
  console.log('开始初始化方法模块数据...');

  try {
    const filePath = path.join(process.cwd(), '../../方法模块汇总.md');

    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch {
      console.error(`文件不存在: ${filePath}`);
      console.log('请确保"方法模块汇总.md"文件在项目根目录下');
      return;
    }

    const parsedData = await parseMethodsFile(filePath);

    console.log(`解析到 ${parsedData.length} 个分类`);

    let categoriesCreated = 0;
    let modulesCreated = 0;
    let categoriesSkipped = 0;
    let modulesSkipped = 0;

    for (const categoryData of parsedData) {
      // 检查分类是否已存在
      let category = await prisma.methodCategory.findUnique({
        where: { code: categoryData.code },
      });

      if (!category) {
        category = await prisma.methodCategory.create({
          data: {
            code: categoryData.code,
            name: categoryData.name,
            englishName: categoryData.englishName,
            sortOrder: categoryData.sortOrder,
          },
        });
        categoriesCreated++;
        console.log(`✓ 创建分类: [${category.code}] ${category.name}`);
      } else {
        categoriesSkipped++;
        console.log(`- 跳过已存在的分类: [${category.code}] ${category.name}`);
      }

      // 创建模块
      for (const moduleData of categoryData.modules) {
        const existingModule = await prisma.methodModule.findUnique({
          where: { code: moduleData.code },
        });

        if (!existingModule) {
          await prisma.methodModule.create({
            data: {
              code: moduleData.code,
              name: moduleData.name,
              englishName: moduleData.englishName,
              description: moduleData.description,
              categoryId: category.id,
              isVisible: true,
            },
          });
          modulesCreated++;
          console.log(`  ✓ 创建模块: [${moduleData.code}] ${moduleData.name}`);
        } else {
          modulesSkipped++;
        }
      }
    }

    console.log('\n初始化完成！');
    console.log(`分类: ${categoriesCreated} 个已创建, ${categoriesSkipped} 个已跳过`);
    console.log(`模块: ${modulesCreated} 个已创建, ${modulesSkipped} 个已跳过`);
  } catch (error) {
    console.error('初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行初始化
initializeMethodModules()
  .then(() => {
    console.log('\n✓ 数据初始化成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ 数据初始化失败:', error);
    process.exit(1);
  });
