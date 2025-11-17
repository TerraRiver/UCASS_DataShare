import { Router } from 'express';
import prisma from '../config/database';
import { requireAdmin } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 所有路由都需要管理员权限
router.use(requireAdmin);

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'method-modules');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB
});

// 获取所有分类（包括隐藏的模块）
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.methodCategory.findMany({
      include: {
        modules: {
          orderBy: { code: 'asc' },
          include: {
            files: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// 创建分类
router.post('/categories', async (req, res) => {
  try {
    const { code, name, englishName, sortOrder } = req.body;

    const category = await prisma.methodCategory.create({
      data: {
        code: code.toUpperCase(),
        name,
        englishName,
        sortOrder: sortOrder || 0,
      },
    });

    res.json(category);
  } catch (error) {
    console.error('Failed to create category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// 更新分类
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, englishName, sortOrder } = req.body;

    const category = await prisma.methodCategory.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(name && { name }),
        ...(englishName && { englishName }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    res.json(category);
  } catch (error) {
    console.error('Failed to update category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// 删除分类
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查分类下是否有模块
    const category = await prisma.methodCategory.findUnique({
      where: { id },
      include: { modules: true },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.modules.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with modules' });
    }

    await prisma.methodCategory.delete({
      where: { id },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Failed to delete category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// 获取所有模块
router.get('/modules', async (req, res) => {
  try {
    const modules = await prisma.methodModule.findMany({
      include: {
        category: true,
        files: true,
      },
      orderBy: { code: 'asc' },
    });

    res.json(modules);
  } catch (error) {
    console.error('Failed to fetch modules:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

// 上传方法模块
router.post('/modules/upload', upload.array('files', 50), async (req, res) => {
  try {
    const {
      code,
      name,
      englishName,
      summary,
      categoryCode,
      practiceUrl,
      enablePractice,
      isVisible,
    } = req.body;

    // 查找分类
    const category = await prisma.methodCategory.findUnique({
      where: { code: categoryCode },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // 创建模块
    const module = await prisma.methodModule.create({
      data: {
        code: code.toUpperCase(),
        name,
        englishName,
        summary: summary || null,
        categoryId: category.id,
        practiceUrl: practiceUrl || null,
        enablePractice: enablePractice === 'true' || enablePractice === true,
        isVisible: isVisible === 'true' || isVisible === true || isVisible === undefined,
      },
    });

    // 处理上传的文件
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      // 解析文件路径数组
      const filePathsStr = req.body.filePaths;
      let filePaths: string[] = [];
      if (filePathsStr) {
        try {
          filePaths = JSON.parse(filePathsStr);
        } catch (err) {
          console.error('Failed to parse filePaths:', err);
        }
      }

      const fileRecords = files.map((file, index) => {
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const relativePath = filePaths[index] || originalName;

        return {
          filename: file.filename,
          originalName,
          relativePath, // 保存相对路径
          filePath: file.path,
          fileSize: file.size,
          fileType: path.extname(file.originalname),
          mimeType: file.mimetype,
          methodModuleId: module.id,
        };
      });

      await prisma.methodModuleFile.createMany({
        data: fileRecords,
      });
    }

    // 返回完整的模块信息
    const createdModule = await prisma.methodModule.findUnique({
      where: { id: module.id },
      include: {
        category: true,
        files: true,
      },
    });

    res.json(createdModule);
  } catch (error) {
    console.error('Failed to upload module:', error);
    res.status(500).json({ error: 'Failed to upload module' });
  }
});

// 更新模块信息
router.put('/modules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      englishName,
      summary,
      categoryCode,
      practiceUrl,
      enablePractice,
      isVisible,
    } = req.body;

    const updateData: any = {};

    if (code) updateData.code = code.toUpperCase();
    if (name) updateData.name = name;
    if (englishName) updateData.englishName = englishName;
    if (summary !== undefined) updateData.summary = summary || null;
    if (practiceUrl !== undefined) updateData.practiceUrl = practiceUrl || null;
    if (enablePractice !== undefined) updateData.enablePractice = enablePractice === 'true' || enablePractice === true;
    if (isVisible !== undefined) updateData.isVisible = isVisible === 'true' || isVisible === true;

    // 如果提供了分类代码，查找并更新分类ID
    if (categoryCode) {
      const category = await prisma.methodCategory.findUnique({
        where: { code: categoryCode },
      });
      if (category) {
        updateData.categoryId = category.id;
      }
    }

    const module = await prisma.methodModule.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        files: true,
      },
    });

    res.json(module);
  } catch (error) {
    console.error('Failed to update module:', error);
    res.status(500).json({ error: 'Failed to update module' });
  }
});

// 删除模块
router.delete('/modules/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const module = await prisma.methodModule.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // 删除文件
    for (const file of module.files) {
      try {
        await fs.unlink(file.filePath);
      } catch (err) {
        console.error(`Failed to delete file: ${file.filePath}`, err);
      }
    }

    // 删除数据库记录（会级联删除文件记录）
    await prisma.methodModule.delete({
      where: { id },
    });

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Failed to delete module:', error);
    res.status(500).json({ error: 'Failed to delete module' });
  }
});

// 批量初始化分类和模块（从汇总文件）
router.post('/init', async (req, res) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const results = {
      categoriesCreated: 0,
      modulesCreated: 0,
      errors: [] as string[],
    };

    for (const catData of categories) {
      try {
        // 创建或更新分类
        let category = await prisma.methodCategory.findUnique({
          where: { code: catData.code },
        });

        if (!category) {
          category = await prisma.methodCategory.create({
            data: {
              code: catData.code,
              name: catData.name,
              englishName: catData.englishName,
              sortOrder: catData.sortOrder || 0,
            },
          });
          results.categoriesCreated++;
        }

        // 创建模块
        if (catData.modules && Array.isArray(catData.modules)) {
          for (const modData of catData.modules) {
            try {
              const existingModule = await prisma.methodModule.findUnique({
                where: { code: modData.code },
              });

              if (!existingModule) {
                await prisma.methodModule.create({
                  data: {
                    code: modData.code,
                    name: modData.name,
                    englishName: modData.englishName,
                    summary: modData.summary || null,
                    categoryId: category.id,
                    isVisible: true,
                  },
                });
                results.modulesCreated++;
              }
            } catch (err: any) {
              results.errors.push(`Failed to create module ${modData.code}: ${err.message}`);
            }
          }
        }
      } catch (err: any) {
        results.errors.push(`Failed to process category ${catData.code}: ${err.message}`);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Failed to initialize data:', error);
    res.status(500).json({ error: 'Failed to initialize data' });
  }
});

export default router;
