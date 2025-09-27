import { Router } from 'express';
import { prisma } from '@/config/database';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { ENV } from '@/config/env';
import multer from 'multer';
import { z } from 'zod';

// Multer setup for file uploads
const upload = multer({ dest: ENV.UPLOAD_DIR });

const router = Router();

// Zod schema for validation
const caseStudyUploadSchema = z.object({
  title: z.string(),
  author: z.string(),
  discipline: z.string(),
  publication: z.string(),
  publicationYear: z.coerce.number(),
  publicationUrl: z.string().url().optional(),
  description: z.string(),
});

// Upload a new case study
router.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    const validation = caseStudyUploadSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: '表单数据无效', details: validation.error.errors });
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: '至少需要上传一个文件' });
    }

    const { title, author, discipline, publication, publicationYear, publicationUrl, description } = validation.data;

    const newCaseStudy = await prisma.caseStudy.create({
      data: {
        title,
        author,
        discipline,
        publication,
        publicationYear,
        publicationUrl,
        description,
        files: {
          create: (req.files as Express.Multer.File[]).map(file => ({
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
        { description: { contains: search as string, mode: 'insensitive' } },
        { author: { contains: search as string, mode: 'insensitive' } },
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
          publication: true,
          publicationYear: true,
          description: true,
          uploadTime: true,
          updateTime: true,
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
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const caseStudy = await prisma.caseStudy.findFirst({
      where: { 
        id,
        isReviewed: true,
        isVisible: true,
      },
      include: {
        files: {
          select: {
            id: true,
            originalName: true,
            fileSize: true,
            fileType: true,
          }
        }
      },
    });

    if (!caseStudy) {
      return res.status(404).json({ error: '案例集不存在或未发布' });
    }

    res.json(caseStudy);
  } catch (error) {
    console.error('获取案例集详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 下载整个案例集 (打包为zip)
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!caseStudy || !caseStudy.isReviewed || !caseStudy.isVisible) {
      return res.status(404).json({ error: '案例集不存在或无法下载' });
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