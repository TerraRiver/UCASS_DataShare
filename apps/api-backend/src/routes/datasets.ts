import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/config/database';
import { ENV } from '@/config/env';
import { requireAdmin, type AuthenticatedRequest } from '@/middleware/auth';

const router = Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = ENV.UPLOAD_DIR;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: ENV.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = [
      '.csv', '.xlsx', '.xls', '.json', '.txt', '.pdf', '.doc', '.docx', 
      '.sav', '.spss', '.dta', '.stata', '.R', '.py'
    ];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
});

// 上传数据集
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上传文件' });
    }

    const { name, catalog, description } = req.body;

    if (!name || !catalog || !description) {
      return res.status(400).json({ error: '数据集名称、分类和描述不能为空' });
    }

    // 创建数据集记录
    const dataset = await prisma.dataset.create({
      data: {
        name,
        catalog,
        description,
        filePath: req.file.path,
        fileSize: req.file.size,
        fileType: path.extname(req.file.originalname),
        uploadedBy: req.body.uploadedBy || 'anonymous', // 暂时使用匿名用户
      },
    });

    res.json({
      message: '数据集上传成功，等待管理员审核',
      dataset: {
        id: dataset.id,
        name: dataset.name,
        catalog: dataset.catalog,
        uploadTime: dataset.uploadTime,
      },
    });
  } catch (error) {
    console.error('上传数据集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取公开数据集列表
router.get('/public', async (req, res) => {
  try {
    const { page = '1', limit = '10', search, catalog } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      isReviewed: true,
      isVisible: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (catalog) {
      where.catalog = catalog;
    }

    const [datasets, total] = await Promise.all([
      prisma.dataset.findMany({
        where,
        select: {
          id: true,
          name: true,
          catalog: true,
          description: true,
          fileType: true,
          fileSize: true,
          uploadTime: true,
          downloadCount: true,
          enableVisualization: true,
          enableAnalysis: true,
        },
        orderBy: { uploadTime: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.dataset.count({ where }),
    ]);

    res.json({
      datasets,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('获取数据集列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取数据集详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const dataset = await prisma.dataset.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        catalog: true,
        description: true,
        fileType: true,
        fileSize: true,
        uploadTime: true,
        downloadCount: true,
        enableVisualization: true,
        enableAnalysis: true,
        isReviewed: true,
        isVisible: true,
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    if (!dataset.isReviewed || !dataset.isVisible) {
      return res.status(403).json({ error: '数据集不可访问' });
    }

    res.json({ dataset });
  } catch (error) {
    console.error('获取数据集详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 下载数据集
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const dataset = await prisma.dataset.findUnique({
      where: { id },
    });

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    if (!dataset.isReviewed || !dataset.isVisible) {
      return res.status(403).json({ error: '数据集不可访问' });
    }

    if (!fs.existsSync(dataset.filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 增加下载次数
    await prisma.dataset.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    res.download(dataset.filePath, `${dataset.name}${dataset.fileType}`);
  } catch (error) {
    console.error('下载数据集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 搜索数据集
router.get('/search', async (req, res) => {
  // 重定向到公开数据集列表，带搜索参数
  const queryString = new URLSearchParams(req.query as any).toString();
  res.redirect(`/api/datasets/public?${queryString}`);
});

// 获取数据集分类列表
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.dataset.findMany({
      where: {
        isReviewed: true,
        isVisible: true,
      },
      select: {
        catalog: true,
      },
      distinct: ['catalog'],
    });

    const categoryList = categories.map((c: { catalog: string }) => c.catalog);
    res.json({ categories: categoryList });
  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取平台统计信息
router.get('/stats', async (req, res) => {
  try {
    const [totalDatasets, totalDownloads] = await Promise.all([
      prisma.dataset.count({
        where: {
          isReviewed: true,
          isVisible: true,
        },
      }),
      prisma.dataset.aggregate({
        where: {
          isReviewed: true,
          isVisible: true,
        },
        _sum: {
          downloadCount: true,
        },
      }),
    ]);

    res.json({
      totalDatasets,
      totalDownloads: totalDownloads._sum.downloadCount || 0,
    });
  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router; 