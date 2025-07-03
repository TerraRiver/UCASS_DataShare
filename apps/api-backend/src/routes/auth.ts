import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { ENV } from '@/config/env';
import { requireAdmin, type AuthenticatedRequest } from '@/middleware/auth';

const router = Router();

// 管理员登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 查找管理员用户
    const adminUser = await prisma.adminUser.findUnique({
      where: { username },
    });

    if (!adminUser) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, adminUser.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { id: adminUser.id, username: adminUser.username },
      ENV.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 管理员登出（客户端处理，删除token）
router.post('/logout', (req, res) => {
  res.json({ message: '登出成功' });
});

// 验证登录状态
router.get('/check', requireAdmin, (req: AuthenticatedRequest, res) => {
  res.json({
    message: '已登录',
    user: req.adminUser,
  });
});

export default router; 