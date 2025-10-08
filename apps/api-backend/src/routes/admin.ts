import { Router } from 'express';
import { prisma } from '@/config/database';
import { requireAdmin, type AuthenticatedRequest } from '@/middleware/auth';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import path from 'path';
import { ENV } from '@/config/env';

const router = Router();

// 所有管理员路由都需要身份验证
router.use(requireAdmin);

// 获取仪表盘统计数据
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    // 数据集统计
    const totalDatasets = await prisma.dataset.count();
    const pendingDatasets = await prisma.dataset.count({ where: { isReviewed: false } });
    const approvedDatasets = await prisma.dataset.count({ where: { isReviewed: true } });

    const totalDownloads = await prisma.dataset.aggregate({
      _sum: {
        downloadCount: true,
      },
    });

    const datasetsByCategory = await prisma.dataset.groupBy({
      by: ['catalog'],
      _count: {
        catalog: true,
      },
      where: { isReviewed: true },
    });

    const categoryCounts = datasetsByCategory.map(item => ({
      name: item.catalog,
      value: item._count.catalog
    }));

    // 案例集统计
    const totalCaseStudies = await prisma.caseStudy.count();
    const pendingCaseStudies = await prisma.caseStudy.count({ where: { isReviewed: false } });
    const approvedCaseStudies = await prisma.caseStudy.count({ where: { isReviewed: true } });

    const totalCaseStudyDownloads = await prisma.caseStudy.aggregate({
      _sum: {
        downloadCount: true,
      },
    });

    const caseStudiesByDiscipline = await prisma.caseStudy.groupBy({
      by: ['discipline'],
      _count: {
        discipline: true,
      },
      where: { isReviewed: true },
    });

    const disciplineCounts = caseStudiesByDiscipline.map(item => ({
      name: item.discipline,
      value: item._count.discipline
    }));

    res.json({
      totalDatasets,
      pendingDatasets,
      approvedDatasets,
      totalDownloads: totalDownloads._sum.downloadCount || 0,
      datasetsByCategory: categoryCounts,
      totalCaseStudies,
      pendingCaseStudies,
      approvedCaseStudies,
      totalCaseStudyDownloads: totalCaseStudyDownloads._sum.downloadCount || 0,
      caseStudiesByDiscipline: disciplineCounts,
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取待审核数据集列表
router.get('/datasets/pending', async (req: AuthenticatedRequest, res) => {
  try {
    const datasets = await prisma.dataset.findMany({
      where: { isReviewed: false },
      select: {
        id: true,
        name: true,
        catalog: true,
        summary: true,
        uploadTime: true,
        uploadedBy: true,
        enablePreview: true,
        _count: {
          select: { files: true },
        },
      },
      orderBy: { uploadTime: 'asc' },
    });

    res.json(datasets);
  } catch (error) {
    console.error('获取待审核数据集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取所有数据集（包括未审核的）
router.get('/datasets', async (req: AuthenticatedRequest, res) => {
  try {
    const { page = '1', limit = '20', status, search } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};

    if (status === 'pending') {
      where.isReviewed = false;
    } else if (status === 'approved') {
      where.isReviewed = true;
      where.isVisible = true;
    } else if (status === 'hidden') {
      where.isReviewed = true;
      where.isVisible = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { catalog: { contains: search as string, mode: 'insensitive' } },
        { summary: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [datasets, total] = await Promise.all([
      prisma.dataset.findMany({
        where,
        select: {
          id: true,
          name: true,
          catalog: true,
          summary: true,
          source: true,
          sourceUrl: true,
          sourceDate: true,
          uploadTime: true,
          uploadedBy: true,
          isReviewed: true,
          isVisible: true,
          isFeatured: true,
          enableDataAnalysis: true,
          enablePreview: true,
          downloadCount: true,
          _count: {
            select: { files: true },
          },
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

// [新增] 管理员获取单个数据集详情
router.get('/datasets/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const dataset = await prisma.dataset.findUnique({
      where: { id },
      include: {
        files: true, // 包含所有文件信息
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    res.json({ dataset });
  } catch (error) {
    console.error('管理员获取数据集详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// [新增] 管理员下载数据集文件
router.get('/datasets/:id/download/:fileId', async (req: AuthenticatedRequest, res) => {
  try {
    const { id, fileId } = req.params;

    const file = await prisma.datasetFile.findUnique({
      where: { id: fileId, datasetId: id }
    });

    if (!file) {
      return res.status(404).json({ error: '文件不存在或不属于该数据集' });
    }

    const filePath = path.join(ENV.UPLOAD_DIR, file.filename);

    if (fs.existsSync(filePath)) {
      // 修复中文文件名在下载时乱码的问题
      const encodedFilename = encodeURIComponent(file.originalName);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
      res.download(filePath, file.originalName);
    } else {
      res.status(404).json({ error: '文件在服务器上不存在，可能已被清理' });
    }
  } catch (error) {
    console.error('管理员下载文件错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// [新增] 更新单个文件的状态
router.put('/datasets/:datasetId/files/:fileId', async (req: AuthenticatedRequest, res) => {
  try {
    const { datasetId, fileId } = req.params;
    const { isPreviewable } = req.body;

    if (typeof isPreviewable !== 'boolean') {
      return res.status(400).json({ error: 'isPreviewable 参数必须是布尔值' });
    }

    // 验证文件确实属于该数据集，增加安全性
    const fileExists = await prisma.datasetFile.findFirst({
      where: {
        id: fileId,
        datasetId: datasetId
      }
    });

    if (!fileExists) {
      return res.status(404).json({ error: '文件不存在或不属于该数据集' });
    }

    const updatedFile = await prisma.datasetFile.update({
      where: { id: fileId },
      data: { isPreviewable },
    });

    res.json({ message: '文件预览状态更新成功', file: updatedFile });
  } catch (error) {
    console.error('更新文件状态错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新数据集状态 (更通用的接口)
router.put('/datasets/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { isReviewed, isVisible, isFeatured, enableDataAnalysis, enablePreview } = req.body;

    // 构建要更新的数据对象，只包含请求中提供的字段
    const dataToUpdate: Record<string, boolean> = {};
    if (isReviewed !== undefined) dataToUpdate.isReviewed = isReviewed;
    if (isVisible !== undefined) dataToUpdate.isVisible = isVisible;
    if (isFeatured !== undefined) dataToUpdate.isFeatured = isFeatured;
    if (enableDataAnalysis !== undefined) dataToUpdate.enableDataAnalysis = enableDataAnalysis;
    if (enablePreview !== undefined) dataToUpdate.enablePreview = enablePreview;

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: '没有提供要更新的状态' });
    }

    const updatedDataset = await prisma.dataset.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({ message: '数据集状态更新成功', dataset: updatedDataset });
  } catch (error) {
    console.error('更新数据集状态错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 审核数据集
router.put('/datasets/:id/review', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: '无效的审核操作' });
    }

    const dataToUpdate: any = {
      isReviewed: true,
    };

    // 批准：设置为已审核且可见
    // 拒绝：设置为已审核但不可见
    if (action === 'approve') {
      dataToUpdate.isVisible = true;
    } else {
      dataToUpdate.isVisible = false;
    }

    const updatedDataset = await prisma.dataset.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({
      message: action === 'approve' ? '数据集已批准上线' : '数据集已拒绝',
      dataset: updatedDataset
    });
  } catch (error) {
    console.error('审核数据集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// [新增] 更新数据集元数据
router.put('/datasets/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      summary,
      catalog,
      source,
      sourceUrl,
      sourceDate,
      recommendedCitations,
      isFeatured,
      enableDataAnalysis,
      enablePreview
    } = req.body;

    console.log('Update dataset request:', { id, enablePreview, isFeatured, enableDataAnalysis });

    // 构建要更新的数据对象
    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (description) dataToUpdate.description = description;
    if (summary !== undefined) dataToUpdate.summary = summary;
    if (catalog) dataToUpdate.catalog = catalog;
    if (source) dataToUpdate.source = source;
    // 允许传入 null 或空字符串来清空可选字段
    if (sourceUrl !== undefined) dataToUpdate.sourceUrl = sourceUrl;
    if (sourceDate !== undefined) {
      dataToUpdate.sourceDate = sourceDate ? new Date(sourceDate) : null;
    }
    if (recommendedCitations !== undefined) dataToUpdate.recommendedCitations = recommendedCitations;
    // 新增状态字段支持
    if (typeof isFeatured === 'boolean') dataToUpdate.isFeatured = isFeatured;
    if (typeof enableDataAnalysis === 'boolean') dataToUpdate.enableDataAnalysis = enableDataAnalysis;
    if (typeof enablePreview === 'boolean') dataToUpdate.enablePreview = enablePreview;

    console.log('Data to update:', dataToUpdate);

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: '没有提供任何要更新的数据' });
    }

    const updatedDataset = await prisma.dataset.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({ message: '数据集更新成功', dataset: updatedDataset });

  } catch (error) {
     console.error('更新数据集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});


// 删除数据集
router.delete('/datasets/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // 1. 先查找数据集，获取所有关联的文件
    const dataset = await prisma.dataset.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    // 2. 删除服务器上的物理文件
    dataset.files.forEach(file => {
      const filePath = path.join(ENV.UPLOAD_DIR, file.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          // 即使删除个别文件失败，也继续尝试删除数据库记录
          console.error(`删除文件失败: ${filePath}`, fileError);
        }
      }
    });

    // 3. 删除数据库中的数据集记录 (关联的文件记录会通过级联删除自动移除)
    await prisma.dataset.delete({
      where: { id },
    });

    res.json({ message: '数据集及其所有文件已成功删除' });
  } catch (error) {
    console.error('删除数据集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});


// ----------------- Case Studies Management -----------------

// 获取所有案例集
router.get('/casestudies', async (req: AuthenticatedRequest, res) => {
  try {
    const { page = '1', limit = '20', status, search } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status === 'pending') where.isReviewed = false;
    else if (status === 'approved') { where.isReviewed = true; where.isVisible = true; }
    else if (status === 'hidden') { where.isReviewed = true; where.isVisible = false; }

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
          id: true, title: true, author: true, discipline: true, publication: true, publicationYear: true,
          practiceUrl: true, uploadTime: true, uploadedBy: true, isReviewed: true,
          isVisible: true, isFeatured: true, enablePractice: true, downloadCount: true,
          _count: { select: { files: true } },
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

// 获取单个案例集详情 (管理员)
router.get('/casestudies/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!caseStudy) {
      return res.status(404).json({ error: '案例集不存在' });
    }

    res.json({ caseStudy });
  } catch (error) {
    console.error('获取案例集详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新案例集详细信息
router.put('/casestudies/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      discipline,
      summary,
      publication,
      publicationYear,
      publicationUrl,
      description,
      practiceUrl,
      isFeatured,
      enablePractice
    } = req.body;

    const dataToUpdate: any = {};
    if (title) dataToUpdate.title = title;
    if (author) dataToUpdate.author = author;
    if (discipline) dataToUpdate.discipline = discipline;
    if (summary !== undefined) dataToUpdate.summary = summary;
    if (publication) dataToUpdate.publication = publication;
    if (publicationYear !== undefined) dataToUpdate.publicationYear = publicationYear;
    if (publicationUrl !== undefined) dataToUpdate.publicationUrl = publicationUrl;
    if (description) dataToUpdate.description = description;
    if (practiceUrl !== undefined) dataToUpdate.practiceUrl = practiceUrl;
    if (typeof isFeatured === 'boolean') dataToUpdate.isFeatured = isFeatured;
    if (typeof enablePractice === 'boolean') dataToUpdate.enablePractice = enablePractice;

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: '没有提供任何要更新的数据' });
    }

    const updatedCaseStudy = await prisma.caseStudy.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({ message: '案例集更新成功', caseStudy: updatedCaseStudy });
  } catch (error) {
    console.error('更新案例集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 审核案例集
router.put('/casestudies/:id/review', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: '无效的审核操作' });
    }

    const dataToUpdate: any = {
      isReviewed: true,
    };

    if (action === 'approve') {
      dataToUpdate.isVisible = true;
    } else {
      dataToUpdate.isVisible = false;
    }

    const updatedCaseStudy = await prisma.caseStudy.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({
      message: action === 'approve' ? '案例集已批准上线' : '案例集已拒绝',
      caseStudy: updatedCaseStudy
    });
  } catch (error) {
    console.error('审核案例集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新案例集状态
router.put('/casestudies/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { isReviewed, isVisible, isFeatured, enablePractice } = req.body;

    const dataToUpdate: Record<string, boolean> = {};
    if (isReviewed !== undefined) dataToUpdate.isReviewed = isReviewed;
    if (isVisible !== undefined) dataToUpdate.isVisible = isVisible;
    if (typeof isFeatured === 'boolean') dataToUpdate.isFeatured = isFeatured;
    if (typeof enablePractice === 'boolean') dataToUpdate.enablePractice = enablePractice;

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: '没有提供要更新的状态' });
    }

    const updatedCaseStudy = await prisma.caseStudy.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({ message: '案例集状态更新成功', caseStudy: updatedCaseStudy });
  } catch (error) {
    console.error('更新案例集状态错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除案例集
router.delete('/casestudies/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!caseStudy) {
      return res.status(404).json({ error: '案例集不存在' });
    }

    // 删除物理文件
    caseStudy.files.forEach(file => {
      const filePath = path.join(ENV.UPLOAD_DIR, file.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error(`删除文件失败: ${filePath}`, fileError);
        }
      }
    });

    // 删除数据库记录
    await prisma.caseStudy.delete({ where: { id } });

    res.json({ message: '案例集及其所有文件已成功删除' });
  } catch (error) {
    console.error('删除案例集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});


// 获取所有管理员账号
router.get('/accounts', async (req: AuthenticatedRequest, res) => {
    try {
        const admins = await prisma.adminUser.findMany({
            select: {
                id: true,
                username: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(admins);
    } catch (error) {
        console.error('获取管理员列表错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 创建新管理员
router.post('/accounts', async (req: AuthenticatedRequest, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }
        if (password.length < 6) {
             return res.status(400).json({ error: '密码长度不能少于6位' });
        }
        
        const existingUser = await prisma.adminUser.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(409).json({ error: '用户名已存在' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.adminUser.create({
            data: { username, passwordHash },
            select: { id: true, username: true, createdAt: true }
        });

        res.status(201).json({ message: '管理员创建成功', user: newUser });
    } catch (error) {
        console.error('创建管理员错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 删除管理员
router.delete('/accounts/:id', async (req: AuthenticatedRequest, res) => {
    try {
        const { id } = req.params;
        
        // 禁止删除自己
        if (req.adminUser?.id === id) {
            return res.status(403).json({ error: '不能删除自己' });
        }
        
        // 确保至少保留一个管理员
        const adminCount = await prisma.adminUser.count();
        if (adminCount <= 1) {
            return res.status(400).json({ error: '不能删除唯一的管理员账号' });
        }

        await prisma.adminUser.delete({
            where: { id },
        });

        res.json({ message: '管理员删除成功' });
    } catch (error) {
        console.error('删除管理员错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});


export default router;
