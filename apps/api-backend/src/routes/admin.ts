import { Router } from 'express';
import { prisma } from '@/config/database';
import { requireAdmin, type AuthenticatedRequest } from '@/middleware/auth';
import fs from 'fs';

const router = Router();

// 所有管理员路由都需要身份验证
router.use(requireAdmin);

// 获取待审核数据集列表
router.get('/datasets/pending', async (req: AuthenticatedRequest, res) => {
  try {
    const datasets = await prisma.dataset.findMany({
      where: { isReviewed: false },
      select: {
        id: true,
        name: true,
        catalog: true,
        description: true,
        fileType: true,
        fileSize: true,
        uploadTime: true,
        uploadedBy: true,
      },
      orderBy: { uploadTime: 'asc' },
    });

    res.json({ datasets });
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
        { description: { contains: search as string, mode: 'insensitive' } },
        { catalog: { contains: search as string, mode: 'insensitive' } },
      ];
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
          uploadedBy: true,
          isReviewed: true,
          isVisible: true,
          enableVisualization: true,
          enableAnalysis: true,
          downloadCount: true,
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

// 审核数据集
router.put('/datasets/:id/review', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { action, visible = true, enableVisualization = false, enableAnalysis = false } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: '无效的审核操作' });
    }

    const dataset = await prisma.dataset.findUnique({
      where: { id },
    });

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    if (action === 'approve') {
      await prisma.dataset.update({
        where: { id },
        data: {
          isReviewed: true,
          isVisible: visible,
          enableVisualization,
          enableAnalysis,
        },
      });

      res.json({ message: '数据集审核通过' });
    } else {
      // 拒绝审核，删除数据集和文件
      if (fs.existsSync(dataset.filePath)) {
        fs.unlinkSync(dataset.filePath);
      }

      await prisma.dataset.delete({
        where: { id },
      });

      res.json({ message: '数据集审核拒绝，已删除' });
    }
  } catch (error) {
    console.error('审核数据集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 设置数据集可见性
router.put('/datasets/:id/visibility', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { visible } = req.body;

    if (typeof visible !== 'boolean') {
      return res.status(400).json({ error: '可见性参数无效' });
    }

    const dataset = await prisma.dataset.findUnique({
      where: { id },
    });

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    if (!dataset.isReviewed) {
      return res.status(400).json({ error: '数据集尚未审核' });
    }

    await prisma.dataset.update({
      where: { id },
      data: { isVisible: visible },
    });

    res.json({
      message: `数据集已${visible ? '显示' : '隐藏'}`,
      dataset: { id, isVisible: visible },
    });
  } catch (error) {
    console.error('设置数据集可见性错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 设置数据集功能
router.put('/datasets/:id/features', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { enableVisualization, enableAnalysis } = req.body;

    const updateData: any = {};
    if (typeof enableVisualization === 'boolean') {
      updateData.enableVisualization = enableVisualization;
    }
    if (typeof enableAnalysis === 'boolean') {
      updateData.enableAnalysis = enableAnalysis;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: '无有效的功能设置参数' });
    }

    const dataset = await prisma.dataset.findUnique({
      where: { id },
    });

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    if (!dataset.isReviewed) {
      return res.status(400).json({ error: '数据集尚未审核' });
    }

    await prisma.dataset.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: '数据集功能设置已更新',
      dataset: { id, ...updateData },
    });
  } catch (error) {
    console.error('设置数据集功能错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除数据集
router.delete('/datasets/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const dataset = await prisma.dataset.findUnique({
      where: { id },
    });

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    // 删除文件
    if (fs.existsSync(dataset.filePath)) {
      fs.unlinkSync(dataset.filePath);
    }

    // 删除数据库记录
    await prisma.dataset.delete({
      where: { id },
    });

    res.json({ message: '数据集已删除' });
  } catch (error) {
    console.error('删除数据集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取管理员仪表板统计
router.get('/dashboard/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const [
      totalDatasets,
      pendingReview,
      approvedDatasets,
      totalDownloads,
      recentUploads,
    ] = await Promise.all([
      prisma.dataset.count(),
      prisma.dataset.count({ where: { isReviewed: false } }),
      prisma.dataset.count({ where: { isReviewed: true, isVisible: true } }),
      prisma.dataset.aggregate({
        _sum: { downloadCount: true },
      }),
      prisma.dataset.findMany({
        take: 5,
        orderBy: { uploadTime: 'desc' },
        select: {
          id: true,
          name: true,
          catalog: true,
          uploadTime: true,
          isReviewed: true,
        },
      }),
    ]);

    res.json({
      totalDatasets,
      pendingReview,
      approvedDatasets,
      totalDownloads: totalDownloads._sum.downloadCount || 0,
      recentUploads,
    });
  } catch (error) {
    console.error('获取仪表板统计错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router; 