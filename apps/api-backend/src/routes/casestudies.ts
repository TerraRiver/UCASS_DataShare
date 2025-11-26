import { Router } from 'express';
import { prisma } from '@/config/database';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { ENV } from '@/config/env';
import multer from 'multer';
import { z } from 'zod';
import { optionalAdmin, type AuthenticatedRequest } from '@/middleware/auth';

// Multer setup for file uploads
const upload = multer({ dest: ENV.UPLOAD_DIR });

const router = Router();

// Zod schema for validation
const caseStudyUploadSchema = z.object({
  title: z.string({ required_error: '标题不能为空' }).min(1, { message: '标题不能为空' }),
  author: z.string({ required_error: '作者不能为空' }).min(1, { message: '作者不能为空' }),
  discipline: z.string({ required_error: '请选择学科分类' }).min(1, { message: '请选择学科分类' }),
  summary: z.string().optional(),
  publication: z.string({ required_error: '发表期刊/来源不能为空' }).min(1, { message: '发表期刊/来源不能为空' }),
  publicationYear: z.coerce
    .number({ invalid_type_error: '发表年份必须是数字' })
    .min(1900, { message: '发表年份不能早于1900年' })
    .max(new Date().getFullYear(), { message: `发表年份不能晚于${new Date().getFullYear()}年` }),
  publicationUrl: z.union([z.literal(''), z.string().url({ message: '请输入有效的URL地址' })]).optional(),
});

// Upload a new case study
router.post('/upload', upload.array('files', 50), async (req, res) => {
  try {
    const validation = caseStudyUploadSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: '表单数据无效', details: validation.error.errors });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: '至少需要上传一个文件' });
    }

    // 修复 multer 导致的文件名中文乱码问题
    files.forEach(file => {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    });

    const { title, author, discipline, summary, publication, publicationYear, publicationUrl } = validation.data;

    const newCaseStudy = await prisma.caseStudy.create({
      data: {
        title,
        author,
        discipline,
        summary: summary || null,
        publication,
        publicationYear,
        publicationUrl,
        files: {
          create: files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            fileType: path.extname(file.originalname).toLowerCase(),
            mimeType: file.mimetype,
          })),
        },
      },
      include: {
        files: true,
      },
    });

    res.status(201).json({ message: '案例集上传成功，等待审核', caseStudy: newCaseStudy });
  } catch (error) {
    console.error('上传案例集错误:', error);
    // Clean up uploaded files on error
    if (req.files) {
      (req.files as Express.Multer.File[]).forEach(file => {
        fs.unlink(file.path, err => {
          if (err) console.error(`清理文件失败: ${file.path}`, err);
        });
      });
    }
    res.status(500).json({ error: '服务器内部错误' });
  }
});


// 获取已发布的案例集列表 (分页)
router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '10', search, discipline } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      isReviewed: true,
      isVisible: true,
    };

    if (discipline) {
      where.discipline = discipline as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { author: { contains: search as string, mode: 'insensitive' } },
        { discipline: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [caseStudies, total] = await Promise.all([
      prisma.caseStudy.findMany({
        where,
        select: {
          id: true,
          title: true,
          author: true,
          discipline: true,
          summary: true,
          publication: true,
          publicationYear: true,
          uploadTime: true,
          practiceUrl: true,
          enablePractice: true,
          _count: {
            select: { files: true },
          },
        },
        orderBy: { uploadTime: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.caseStudy.count({ where }),
    ]);

    res.json({
      caseStudies,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('获取案例集列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取单个案例集详情
router.get('/:id', optionalAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const isAdmin = !!req.adminUser; // 判断是否是管理员

    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id },
      include: {
        files: {
          select: {
            id: true,
            originalName: true,
            fileSize: true,
            fileType: true,
            uploadTime: true,
          }
        }
      },
    });

    if (!caseStudy) {
      return res.status(404).json({ error: '案例集不存在' });
    }

    // 如果不是管理员，并且案例集未审核或不可见，则拒绝访问
    if (!isAdmin && (!caseStudy.isReviewed || !caseStudy.isVisible)) {
      return res.status(403).json({ error: '案例集当前不可访问' });
    }

    res.json(caseStudy);
  } catch (error) {
    console.error('获取案例集详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取案例集中的特定文件内容（用于读取README.md）
router.get('/:id/files/:fileId', optionalAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id, fileId } = req.params;
    const isAdmin = !!req.adminUser;

    // 验证案例集是否存在
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id },
    });

    if (!caseStudy) {
      return res.status(404).json({ error: '案例集不存在' });
    }

    // 如果不是管理员，检查案例集是否可访问
    if (!isAdmin && (!caseStudy.isReviewed || !caseStudy.isVisible)) {
      return res.status(403).json({ error: '案例集当前不可访问' });
    }

    // 查找文件
    const file = await prisma.caseStudyFile.findFirst({
      where: {
        id: fileId,
        caseStudyId: id,
      }
    });

    if (!file) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const filePath = path.join(ENV.UPLOAD_DIR, file.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件在服务器上不存在' });
    }

    // 如果是文本文件（如README.md），直接返回文本内容
    if (file.fileType === '.md' || file.fileType === '.txt') {
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
    }
    // 视频文件支持流式传输和范围请求（用于在线播放）
    else if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'].includes(file.fileType.toLowerCase())) {
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        // 支持范围请求，用于视频拖动
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file_stream = fs.createReadStream(filePath, { start, end });

        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file_stream.pipe(res);
      } else {
        // 完整文件传输
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };

        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    }
    else {
      // 其他文件类型返回下载，修复中文文件名乱码问题
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
      res.download(filePath, file.originalName);
    }
  } catch (error) {
    console.error('获取文件错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 下载整个案例集 (打包为zip)
router.get('/:id/download', optionalAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const isAdmin = !!req.adminUser;

    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!caseStudy) {
      return res.status(404).json({ error: '案例集不存在' });
    }

    // 如果不是管理员，检查案例集是否可下载
    if (!isAdmin && (!caseStudy.isReviewed || !caseStudy.isVisible)) {
      return res.status(403).json({ error: '案例集当前不可下载' });
    }

    // 更新下载计数
    await prisma.caseStudy.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    const zipFileName = `${caseStudy.title.replace(/\s/g, '_')}_${caseStudy.id}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(zipFileName)}`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const file of caseStudy.files) {
      const filePath = path.join(ENV.UPLOAD_DIR, file.filename);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file.originalName });
      }
    }

    archive.finalize();

  } catch (error) {
    console.error('下载案例集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});


export default router;
