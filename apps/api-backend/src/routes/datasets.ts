import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/config/database';
import { ENV } from '@/config/env';
import { requireAdmin, optionalAdmin, type AuthenticatedRequest } from '@/middleware/auth';

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

// 获取公开数据集列表 (重构为按分类分组)
router.get('/public', async (req, res) => {
  try {
    const { search, catalog } = req.query;

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

    const datasets = await prisma.dataset.findMany({
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
    });

    // 按分类分组
    const groupedDatasets = datasets.reduce((acc, dataset) => {
      const { catalog } = dataset;
      if (!acc[catalog]) {
        acc[catalog] = [];
      }
      acc[catalog].push(dataset);
      return acc;
    }, {} as Record<string, typeof datasets>);

    res.json({ groupedDatasets });
  } catch (error) {
    console.error('获取数据集列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取数据集详情
router.get('/:id', optionalAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const isAdmin = !!req.adminUser; // 判断是否是管理员

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
        uploadedBy: true, // 增加返回上传者信息
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    // 如果不是管理员，并且数据集未审核或不可见，则拒绝访问
    if (!isAdmin && (!dataset.isReviewed || !dataset.isVisible)) {
      return res.status(403).json({ error: '数据集当前不可访问' });
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

// 获取数据预览
router.get('/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;

    const dataset = await prisma.dataset.findUnique({
      where: { id },
      select: { 
        filePath: true, 
        fileType: true,
        isReviewed: true,
        isVisible: true
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    if (!dataset.isReviewed || !dataset.isVisible) {
      return res.status(403).json({ error: '数据集不可访问' });
    }

    const filePath = path.resolve(dataset.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    if (dataset.fileType.toLowerCase() !== '.csv') {
      return res.status(400).json({ error: '当前仅支持 CSV 文件预览' });
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').slice(0, 51); // Header + 50 rows
    
    // Simple CSV to JSON conversion
    const header = lines[0].split(',');
    const data = lines.slice(1).filter(line => line).map(line => {
      const values = line.split(',');
      return header.reduce((obj, key, index) => {
        obj[key.trim()] = values[index] ? values[index].trim() : '';
        return obj;
      }, {} as Record<string, string>);
    });

    res.json({
      preview: {
        headers: header,
        rows: data
      }
    });

  } catch (error) {
    console.error('获取数据预览错误:', error);
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