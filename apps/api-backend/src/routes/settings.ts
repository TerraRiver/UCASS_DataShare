import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取所有配置（敏感信息会被脱敏）
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { category: 'asc' }
    });

    // 脱敏处理：敏感信息只显示前4位和后4位
    const sanitizedSettings = settings.map((setting: any) => ({
      ...setting,
      value: setting.isSecret && setting.value
        ? maskSecret(setting.value)
        : setting.value
    }));

    res.json(sanitizedSettings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 获取单个配置
router.get('/settings/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json({ error: '配置不存在' });
    }

    // 敏感信息脱敏
    const sanitizedSetting = {
      ...setting,
      value: setting.isSecret && setting.value
        ? maskSecret(setting.value)
        : setting.value
    };

    res.json(sanitizedSetting);
  } catch (error) {
    console.error('Failed to fetch setting:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 更新或创建配置
router.put('/settings/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, category = 'general', isSecret = false } = req.body;

    if (!value && value !== '') {
      return res.status(400).json({ error: '配置值不能为空' });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, category, isSecret },
      create: { key, value, category, isSecret }
    });

    // 特殊处理：如果是 Qwen API key，同时更新环境变量（运行时）
    if (key === 'QWEN_EMBEDDING_API_KEY') {
      process.env.QWEN_EMBEDDING_API_KEY = value;
    } else if (key === 'QWEN_CHAT_API_KEY') {
      process.env.QWEN_CHAT_API_KEY = value;
    }

    res.json({
      message: '配置已保存',
      setting: {
        ...setting,
        value: setting.isSecret ? maskSecret(setting.value) : setting.value
      }
    });
  } catch (error) {
    console.error('Failed to save setting:', error);
    res.status(500).json({ error: '保存配置失败' });
  }
});

// 删除配置
router.delete('/settings/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;

    await prisma.systemSetting.delete({
      where: { key }
    });

    // 如果删除了 Qwen API key，清空环境变量
    if (key === 'QWEN_EMBEDDING_API_KEY') {
      delete process.env.QWEN_EMBEDDING_API_KEY;
    } else if (key === 'QWEN_CHAT_API_KEY') {
      delete process.env.QWEN_CHAT_API_KEY;
    }

    res.json({ message: '配置已删除' });
  } catch (error) {
    console.error('Failed to delete setting:', error);
    res.status(500).json({ error: '删除配置失败' });
  }
});

// 测试 Qwen API key 是否有效
router.post('/settings/test-qwen-api-key', requireAdmin, async (req, res) => {
  try {
    const { apiKey, type } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key不能为空' });
    }

    if (!type || !['embedding', 'chat'].includes(type)) {
      return res.status(400).json({ error: '测试类型无效' });
    }

    // 尝试使用API key调用 Qwen API
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    });

    if (type === 'embedding') {
      // 测试 Embedding API
      await client.embeddings.create({
        model: 'text-embedding-v4',
        input: 'test',
        encoding_format: 'float'
      });
      res.json({ valid: true, message: 'Embedding API Key 有效' });
    } else {
      // 测试 Chat API
      await client.chat.completions.create({
        model: 'qwen-plus',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10
      });
      res.json({ valid: true, message: 'Chat API Key 有效' });
    }
  } catch (error: any) {
    console.error('Qwen API key test failed:', error);

    if (error.status === 401 || error.status === 403) {
      res.json({ valid: false, message: 'API Key 无效或已过期' });
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      res.json({ valid: false, message: '无法连接到阿里云百炼 API 服务' });
    } else {
      res.json({ valid: false, message: '测试失败：' + (error.message || '未知错误') });
    }
  }
});

// 工具函数：脱敏处理
function maskSecret(value: string): string {
  if (value.length <= 8) {
    return '***' + value.slice(-4);
  }
  return value.slice(0, 4) + '***' + value.slice(-4);
}

export default router;
