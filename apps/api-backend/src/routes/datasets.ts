import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import * as XLSX from 'xlsx';
import pdf from 'pdf-parse';
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
});

// 上传数据集 (支持多文件)
router.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: '未上传文件' });
    }

    // 修复 multer 导致的文件名中文乱码问题
    files.forEach(file => {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    });

    const { name, catalog, summary, description, source, sourceUrl, sourceDate, recommendedCitations } = req.body;

    if (!name || !catalog || !description || !source) {
      return res.status(400).json({ error: '数据集名称、分类、描述和来源不能为空' });
    }

    // 验证简述长度
    if (summary && summary.length > 30) {
      return res.status(400).json({ error: '数据集简述不能超过30个字符' });
    }

    // 解析推荐引用文献
    let citationsArray: string[] = [];
    if (recommendedCitations) {
      try {
        citationsArray = JSON.parse(recommendedCitations);
        if (!Array.isArray(citationsArray)) {
          citationsArray = [];
        }
      } catch (e) {
        console.warn('解析recommendedCitations失败:', e);
        citationsArray = [];
      }
    }

    // 计算总文件大小
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    // 创建数据集记录
    const dataset = await prisma.dataset.create({
      data: {
        name,
        catalog,
        summary: summary || null,
        description,
        source,
        sourceUrl: sourceUrl || null,
        sourceDate: sourceDate ? new Date(sourceDate) : null,
        recommendedCitations: citationsArray,
        uploadedBy: req.body.uploadedBy || 'anonymous', // 暂时使用匿名用户
        files: {
          create: files.map(file => {
            const fileExt = path.extname(file.originalname).toLowerCase();
            // 设置可预览的文件类型
            const isPreviewable = ['.csv', '.txt', '.md', '.pdf', '.dta', '.xls', '.xlsx'].includes(fileExt);

            return {
              filename: file.filename,
              originalName: file.originalname,
              filePath: file.path,
              fileSize: file.size,
              fileType: fileExt,
              mimeType: file.mimetype,
              isPreviewable,
            };
          })
        }
      },
      include: {
        files: true
      }
    });

    res.json({
      message: '数据集上传成功，等待管理员审核',
      dataset: {
        id: dataset.id,
        name: dataset.name,
        catalog: dataset.catalog,
        uploadTime: dataset.uploadTime,
        fileCount: files.length,
        totalSize: totalSize,
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
        summary: true,
        description: true,
        source: true,
        sourceUrl: true,
        uploadTime: true,
        downloadCount: true,
        enableDataAnalysis: true,
        enablePreview: true,
        isFeatured: true,
        files: {
          select: {
            fileType: true,
            fileSize: true,
          },
          take: 1, // 只获取第一个文件作为代表
        }
      },
      orderBy: [
        { isFeatured: 'desc' }, // 精选数据集优先
        { uploadTime: 'desc' },  // 然后按上传时间排序
      ],
    });

    // 按分类分组
    const groupedDatasets = datasets.reduce((acc, dataset) => {
      const { catalog } = dataset;
      if (!acc[catalog]) {
        acc[catalog] = [];
      }
      // 将文件信息扁平化到数据集对象上
      const simplifiedDataset = {
        ...dataset,
        fileType: dataset.files[0]?.fileType || '',
        fileSize: dataset.files[0]?.fileSize || 0,
      };
      delete (simplifiedDataset as any).files;

      acc[catalog].push(simplifiedDataset);
      return acc;
    }, {} as Record<string, any[]>);

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
      include: {
        files: true
      }
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

// 下载单个文件
router.get('/:id/download/:fileId', optionalAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id, fileId } = req.params;
    const isAdmin = !!req.adminUser;

    const file = await prisma.datasetFile.findUnique({
      where: { id: fileId, datasetId: id },
      include: { dataset: true }
    });

    if (!file) {
      return res.status(404).json({ error: '文件不存在或不属于该数据集' });
    }

    if (!file.dataset.isReviewed || !file.dataset.isVisible) {
      if (!isAdmin) {
        return res.status(403).json({ error: '数据集不可访问' });
      }
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ error: '文件在服务器上不存在' });
    }

    // 增加下载次数
    await prisma.dataset.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    res.download(file.filePath, file.originalName);
  } catch (error) {
    console.error('下载文件错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 打包下载多个文件
router.post('/:id/download/zip', optionalAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { fileIds } = req.body; // 要下载的文件ID数组

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: '请选择要下载的文件' });
    }

    const dataset = await prisma.dataset.findUnique({
      where: { id },
      include: {
        files: true
      }
    });

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    if (!dataset.isReviewed || !dataset.isVisible) {
      if (!req.adminUser) {
        return res.status(403).json({ error: '数据集不可访问' });
      }
    }

    // 过滤出要下载的文件
    const selectedFiles = dataset.files.filter(f => fileIds.includes(f.id));
    if (selectedFiles.length === 0) {
      return res.status(404).json({ error: '未找到指定的文件' });
    }

    // 增加下载次数
    await prisma.dataset.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    if (selectedFiles.length === 1) {
      // 只有一个文件，直接下载
      const file = selectedFiles[0];
      if (!fs.existsSync(file.filePath)) {
        return res.status(404).json({ error: '文件不存在' });
      }
      res.download(file.filePath, file.originalName);
    } else {
      // 多个文件，创建zip包下载
      const archive = archiver('zip', { zlib: { level: 9 } });

      res.attachment(`${dataset.name}.zip`);
      archive.pipe(res);

      // 添加选中的文件到zip
      for (const file of selectedFiles) {
        if (fs.existsSync(file.filePath)) {
          archive.file(file.filePath, { name: file.originalName });
        }
      }

      archive.finalize();
    }
  } catch (error) {
    console.error('打包下载错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取数据预览 (更新为预览指定文件)
router.get('/:id/preview/:fileId', async (req: AuthenticatedRequest, res) => {
  try {
    const { id, fileId } = req.params;

    const file = await prisma.datasetFile.findUnique({
      where: { id: fileId }
    });

    if (!file || file.datasetId !== id || !file.isPreviewable) {
      return res.status(404).json({ error: '文件不存在或未启用预览' });
    }

    const filePath = path.resolve(file.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件在服务器上不存在' });
    }

    const fileExt = file.fileType.toLowerCase();

    // 处理 CSV 文件
    if (fileExt === '.csv') {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').slice(0, 51); // Header + 50 rows

      const header = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',');
        return header.reduce((obj, key, index) => {
          obj[key] = values[index] ? values[index].trim() : '';
          return obj;
        }, {} as Record<string, string>);
      });

      return res.json({
        preview: {
          headers: header,
          rows: data
        }
      });
    }

    // 处理 Excel 文件 (.xlsx, .xls)
    if (fileExt === '.xlsx' || fileExt === '.xls') {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // 读取第一个工作表
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length === 0) {
        return res.status(400).json({ error: '文件为空' });
      }

      const headers = jsonData[0].map((h: any) => String(h || ''));
      const rows = jsonData.slice(1, 51).map(row => { // 最多50行
        return headers.reduce((obj, key, index) => {
          obj[key] = row[index] !== undefined ? String(row[index]) : '';
          return obj;
        }, {} as Record<string, string>);
      });

      return res.json({
        preview: {
          headers,
          rows
        }
      });
    }

    // 处理 Stata 文件 (.dta)
    if (fileExt === '.dta') {
      // Stata文件需要专门的库来解析,这里暂时返回不支持的提示
      // 可以考虑使用 stata-js 或者其他库来实现
      return res.status(400).json({ error: 'Stata .dta 文件预览功能正在开发中,请下载后使用专业软件查看' });
    }

    return res.status(400).json({ error: '不支持的文件类型' });

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