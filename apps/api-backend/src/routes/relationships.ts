import { Router } from 'express';
import { prisma } from '@/config/database';
import { requireAdmin, optionalAdmin, type AuthenticatedRequest } from '@/middleware/auth';

const router = Router();

// 获取关系图数据（用于可视化）
router.get('/graph', optionalAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const isAdmin = !!req.adminUser;

    // 构建查询条件
    const whereClause = isAdmin
      ? {}
      : { isReviewed: true, isVisible: true };

    // 获取所有数据集和案例集，以及它们的关系
    const [datasets, caseStudies, relationships] = await Promise.all([
      prisma.dataset.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          catalog: true,
          summary: true,
          downloadCount: true,
          isFeatured: true,
          isReviewed: true,
          isVisible: true,
        },
      }),
      prisma.caseStudy.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          discipline: true,
          summary: true,
          downloadCount: true,
          isFeatured: true,
          isReviewed: true,
          isVisible: true,
        },
      }),
      prisma.caseStudyDataset.findMany({
        include: {
          caseStudy: {
            select: {
              isReviewed: true,
              isVisible: true,
            }
          },
          dataset: {
            select: {
              isReviewed: true,
              isVisible: true,
            }
          }
        }
      }),
    ]);

    // 过滤关系：如果不是管理员，只显示双方都已审核且可见的关系
    const filteredRelationships = isAdmin
      ? relationships
      : relationships.filter((rel: any) =>
          rel.caseStudy.isReviewed && rel.caseStudy.isVisible &&
          rel.dataset.isReviewed && rel.dataset.isVisible
        );

    // 构建节点和边的数据结构
    const nodes = [
      ...datasets.map((ds: any) => ({
        id: ds.id,
        type: 'dataset' as const,
        label: ds.name,
        data: {
          name: ds.name,
          catalog: ds.catalog,
          summary: ds.summary,
          downloadCount: ds.downloadCount,
          isFeatured: ds.isFeatured,
          isReviewed: ds.isReviewed,
          isVisible: ds.isVisible,
        }
      })),
      ...caseStudies.map((cs: any) => ({
        id: cs.id,
        type: 'casestudy' as const,
        label: cs.title,
        data: {
          title: cs.title,
          discipline: cs.discipline,
          summary: cs.summary,
          downloadCount: cs.downloadCount,
          isFeatured: cs.isFeatured,
          isReviewed: cs.isReviewed,
          isVisible: cs.isVisible,
        }
      })),
    ];

    const edges = filteredRelationships.map((rel: any) => ({
      id: rel.id,
      source: rel.caseStudyId,
      target: rel.datasetId,
      createdAt: rel.createdAt,
    }));

    res.json({
      nodes,
      edges,
      stats: {
        totalDatasets: datasets.length,
        totalCaseStudies: caseStudies.length,
        totalRelationships: filteredRelationships.length,
      }
    });
  } catch (error) {
    console.error('获取关系图数据错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取某个案例集的关联数据集
router.get('/casestudy/:id/datasets', async (req, res) => {
  try {
    const { id } = req.params;

    const relationships = await prisma.caseStudyDataset.findMany({
      where: { caseStudyId: id },
      include: {
        dataset: {
          select: {
            id: true,
            name: true,
            catalog: true,
            summary: true,
          }
        }
      }
    });

    const datasets = relationships.map((rel: any) => rel.dataset);
    res.json({ datasets });
  } catch (error) {
    console.error('获取案例集关联数据集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取某个数据集的关联案例集
router.get('/dataset/:id/casestudies', async (req, res) => {
  try {
    const { id } = req.params;

    const relationships = await prisma.caseStudyDataset.findMany({
      where: { datasetId: id },
      include: {
        caseStudy: {
          select: {
            id: true,
            title: true,
            discipline: true,
            summary: true,
          }
        }
      }
    });

    const caseStudies = relationships.map((rel: any) => rel.caseStudy);
    res.json({ caseStudies });
  } catch (error) {
    console.error('获取数据集关联案例集错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建关系（管理员功能）
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { caseStudyId, datasetId } = req.body;

    if (!caseStudyId || !datasetId) {
      return res.status(400).json({ error: '案例集ID和数据集ID不能为空' });
    }

    // 检查案例集和数据集是否存在
    const [caseStudy, dataset] = await Promise.all([
      prisma.caseStudy.findUnique({ where: { id: caseStudyId } }),
      prisma.dataset.findUnique({ where: { id: datasetId } }),
    ]);

    if (!caseStudy) {
      return res.status(404).json({ error: '案例集不存在' });
    }

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    // 检查关系是否已存在
    const existingRelation = await prisma.caseStudyDataset.findFirst({
      where: {
        caseStudyId,
        datasetId,
      }
    });

    if (existingRelation) {
      return res.status(400).json({ error: '该关系已存在' });
    }

    // 创建关系
    const relationship = await prisma.caseStudyDataset.create({
      data: {
        caseStudyId,
        datasetId,
      },
      include: {
        caseStudy: {
          select: {
            id: true,
            title: true,
          }
        },
        dataset: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    res.status(201).json({
      message: '关系创建成功',
      relationship
    });
  } catch (error) {
    console.error('创建关系错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除关系（管理员功能）
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const relationship = await prisma.caseStudyDataset.findUnique({
      where: { id },
    });

    if (!relationship) {
      return res.status(404).json({ error: '关系不存在' });
    }

    await prisma.caseStudyDataset.delete({
      where: { id },
    });

    res.json({ message: '关系删除成功' });
  } catch (error) {
    console.error('删除关系错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 批量创建关系（管理员功能）
router.post('/batch', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { caseStudyId, datasetIds } = req.body;

    if (!caseStudyId || !Array.isArray(datasetIds) || datasetIds.length === 0) {
      return res.status(400).json({ error: '案例集ID和数据集ID列表不能为空' });
    }

    // 检查案例集是否存在
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id: caseStudyId }
    });

    if (!caseStudy) {
      return res.status(404).json({ error: '案例集不存在' });
    }

    // 获取现有关系
    const existingRelations = await prisma.caseStudyDataset.findMany({
      where: {
        caseStudyId,
        datasetId: { in: datasetIds },
      },
      select: { datasetId: true }
    });

    const existingDatasetIds = existingRelations.map((r: any) => r.datasetId);
    const newDatasetIds = datasetIds.filter(id => !existingDatasetIds.includes(id));

    // 创建新关系
    if (newDatasetIds.length > 0) {
      await prisma.caseStudyDataset.createMany({
        data: newDatasetIds.map(datasetId => ({
          caseStudyId,
          datasetId,
        })),
      });
    }

    res.json({
      message: '批量关系创建成功',
      created: newDatasetIds.length,
      skipped: existingDatasetIds.length,
    });
  } catch (error) {
    console.error('批量创建关系错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
