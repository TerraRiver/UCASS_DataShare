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
    const sanitizedSettings = settings.map(setting => ({
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

    // 特殊处理：如果是DeepSeek API key，同时更新环境变量（运行时）
    if (key === 'DEEPSEEK_API_KEY') {
      process.env.DEEPSEEK_API_KEY = value;
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

    // 如果删除了DeepSeek API key，清空环境变量
    if (key === 'DEEPSEEK_API_KEY') {
      delete process.env.DEEPSEEK_API_KEY;
    }

    res.json({ message: '配置已删除' });
  } catch (error) {
    console.error('Failed to delete setting:', error);
    res.status(500).json({ error: '删除配置失败' });
  }
});

// 测试API key是否有效
router.post('/settings/test-api-key', requireAdmin, async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key不能为空' });
    }

    // 尝试使用API key调用DeepSeek API
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com/v1'
    });

    // 调用embeddings API来测试（系统实际使用的API）
    await client.embeddings.create({
      model: 'deepseek-chat',
      input: 'test'
    });

    res.json({ valid: true, message: 'API key 有效' });
  } catch (error: any) {
    console.error('API key test failed:', error);

    if (error.status === 401 || error.status === 403) {
      res.json({ valid: false, message: 'API key 无效或已过期' });
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      res.json({ valid: false, message: '无法连接到 DeepSeek API 服务' });
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
