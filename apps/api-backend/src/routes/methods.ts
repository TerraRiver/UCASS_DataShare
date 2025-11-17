import { Router } from 'express';
import prisma from '../config/database';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

// 获取所有分类及其模块（用于树形展示）
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.methodCategory.findMany({
      include: {
        modules: {
          where: { isVisible: true },
          orderBy: { code: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
            englishName: true,
            summary: true,
            downloadCount: true,
            previewCount: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    console.error('Failed to fetch method categories:', error);
    res.status(500).json({ error: 'Failed to fetch method categories' });
  }
});

// 获取单个分类详情
router.get('/categories/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const category = await prisma.methodCategory.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        modules: {
          where: { isVisible: true },
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Failed to fetch category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// 获取所有模块列表
router.get('/modules', async (req, res) => {
  try {
    const { category } = req.query;

    const where: any = { isVisible: true };
    if (category) {
      const cat = await prisma.methodCategory.findUnique({
        where: { code: category as string },
      });
      if (cat) {
        where.categoryId = cat.id;
      }
    }

    const modules = await prisma.methodModule.findMany({
      where,
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

// 获取单个模块详情
router.get('/modules/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const module = await prisma.methodModule.findUnique({
      where: { id },
      include: {
        category: true,
        files: true,
      },
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    if (!module.isVisible) {
      return res.status(403).json({ error: 'Module is not visible' });
    }

    // 增加预览次数
    await prisma.methodModule.update({
      where: { id },
      data: { previewCount: { increment: 1 } },
    });

    res.json(module);
  } catch (error) {
    console.error('Failed to fetch module:', error);
    res.status(500).json({ error: 'Failed to fetch module' });
  }
});

// 下载单个文件
router.get('/modules/:id/files/:fileId', async (req, res) => {
  try {
    const { id, fileId } = req.params;

    const module = await prisma.methodModule.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const file = module.files.find((f: any) => f.id === fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.resolve(file.filePath);

    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // 设置响应头
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.originalName)}"`
    );

    // 发送文件
    res.sendFile(filePath);

    // 异步增加下载次数
    prisma.methodModule
      .update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      })
      .catch(console.error);
  } catch (error) {
    console.error('Failed to download file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// 批量下载（ZIP）
router.get('/modules/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const module = await prisma.methodModule.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    if (module.files.length === 0) {
      return res.status(404).json({ error: 'No files to download' });
    }

    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(module.name)}.zip"`
    );

    archive.pipe(res);

    // 添加所有文件到压缩包
    for (const file of module.files) {
      const filePath = path.resolve(file.filePath);
      try {
        await fs.access(filePath);
        // 使用 relativePath 保持文件夹结构，如果没有则使用 originalName
        const archiveName = file.relativePath || file.originalName;
        archive.file(filePath, { name: archiveName });
      } catch (err) {
        console.error(`File not found: ${filePath}`);
      }
    }

    await archive.finalize();

    // 异步增加下载次数
    prisma.methodModule
      .update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      })
      .catch(console.error);
  } catch (error) {
    console.error('Failed to download module:', error);
    res.status(500).json({ error: 'Failed to download module' });
  }
});

export default router;
