import { Router } from 'express';
import { RAGService } from '@/services/rag';
import { EmbeddingService } from '@/services/embedding';
import { requireAdmin } from '@/middleware/auth';
import { prisma } from '@/config/database';

const router = Router();

/**
 * 智能搜索
 * POST /api/rag/search
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: '请提供搜索查询' });
    }

    const ragService = await RAGService.create();
    const results = await ragService.search(query, limit);

    res.json({
      query,
      results: results.map(r => ({
        type: r.contentType,
        id: r.contentId,
        title: r.title,
        snippet: r.content.slice(0, 200) + '...',
        similarity: r.similarity,
        metadata: r.metadata
      }))
    });
  } catch (error: any) {
    console.error('Search failed:', error);
    res.status(500).json({ error: error.message || '搜索失败' });
  }
});

/**
 * 智能问答
 * POST /api/rag/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '请提供问题' });
    }

    const ragService = await RAGService.create();
    const response = await ragService.chat(message, history);

    res.json(response);
  } catch (error: any) {
    console.error('Chat failed:', error);
    res.status(500).json({ error: error.message || '问答失败' });
  }
});

/**
 * 推荐相关内容
 * GET /api/rag/recommend/:type/:id
 */
router.get('/recommend/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!['dataset', 'casestudy'].includes(type)) {
      return res.status(400).json({ error: '无效的内容类型' });
    }

    const ragService = await RAGService.create();
    const results = await ragService.recommend(type, id, limit);

    res.json({
      recommendations: results.map(r => ({
        type: r.contentType,
        id: r.contentId,
        title: r.title,
        similarity: r.similarity
      }))
    });
  } catch (error: any) {
    console.error('Recommendation failed:', error);
    res.status(500).json({ error: error.message || '推荐失败' });
  }
});

/**
 * 向量化单个数据集（管理员）
 * POST /api/rag/embed/dataset/:id
 */
router.post('/embed/dataset/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const dataset = await prisma.dataset.findUnique({
      where: { id },
      include: { files: true }
    });

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    const embeddingService = await EmbeddingService.create();
    await embeddingService.embedDataset(dataset);

    res.json({ message: '向量化成功', datasetId: id });
  } catch (error: any) {
    console.error('Embedding failed:', error);
    res.status(500).json({ error: error.message || '向量化失败' });
  }
});

/**
 * 向量化单个案例集（管理员）
 * POST /api/rag/embed/casestudy/:id
 */
router.post('/embed/casestudy/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id },
      include: { files: true }
    });

    if (!caseStudy) {
      return res.status(404).json({ error: '案例集不存在' });
    }

    const embeddingService = await EmbeddingService.create();
    await embeddingService.embedCaseStudy(caseStudy);

    res.json({ message: '向量化成功', caseStudyId: id });
  } catch (error: any) {
    console.error('Embedding failed:', error);
    res.status(500).json({ error: error.message || '向量化失败' });
  }
});

/**
 * 批量向量化所有数据集（管理员）
 * POST /api/rag/embed/all-datasets
 */
router.post('/embed/all-datasets', requireAdmin, async (req, res) => {
  try {
    const embeddingService = await EmbeddingService.create();
    const count = await embeddingService.embedAllDatasets();

    res.json({
      message: '批量向量化完成',
      count,
      type: 'datasets'
    });
  } catch (error: any) {
    console.error('Batch embedding failed:', error);
    res.status(500).json({ error: error.message || '批量向量化失败' });
  }
});

/**
 * 批量向量化所有案例集（管理员）
 * POST /api/rag/embed/all-casestudies
 */
router.post('/embed/all-casestudies', requireAdmin, async (req, res) => {
  try {
    const embeddingService = await EmbeddingService.create();
    const count = await embeddingService.embedAllCaseStudies();

    res.json({
      message: '批量向量化完成',
      count,
      type: 'casestudies'
    });
  } catch (error: any) {
    console.error('Batch embedding failed:', error);
    res.status(500).json({ error: error.message || '批量向量化失败' });
  }
});

/**
 * 获取向量化统计信息（管理员）
 * GET /api/rag/stats
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [totalEmbeddings, datasetCount, caseStudyCount] = await Promise.all([
      prisma.embeddedContent.count(),
      prisma.embeddedContent.count({ where: { contentType: 'dataset' } }),
      prisma.embeddedContent.count({ where: { contentType: 'casestudy' } })
    ]);

    const [totalDatasets, totalCaseStudies] = await Promise.all([
      prisma.dataset.count({ where: { isReviewed: true, isVisible: true } }),
      prisma.caseStudy.count({ where: { isReviewed: true, isVisible: true } })
    ]);

    res.json({
      totalEmbeddings,
      byType: {
        datasets: datasetCount,
        caseStudies: caseStudyCount
      },
      coverage: {
        datasets: totalDatasets > 0 ? (datasetCount / totalDatasets * 100).toFixed(1) + '%' : '0%',
        caseStudies: totalCaseStudies > 0 ? (caseStudyCount / totalCaseStudies * 100).toFixed(1) + '%' : '0%'
      }
    });
  } catch (error: any) {
    console.error('Stats failed:', error);
    res.status(500).json({ error: error.message || '获取统计信息失败' });
  }
});

/**
 * 删除向量化内容（管理员）
 * DELETE /api/rag/embed/:type/:id
 */
router.delete('/embed/:type/:id', requireAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;

    if (!['dataset', 'casestudy'].includes(type)) {
      return res.status(400).json({ error: '无效的内容类型' });
    }

    const embeddingService = await EmbeddingService.create();
    await embeddingService.deleteEmbedding(type, id);

    res.json({ message: '删除成功' });
  } catch (error: any) {
    console.error('Delete failed:', error);
    res.status(500).json({ error: error.message || '删除失败' });
  }
});

export default router;
