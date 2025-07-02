import express from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { query } from '../config/database';
import { authenticateToken, AuthRequest, generateAnonymousId } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// 管理员登录验证schema
const adminLoginSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': '用户名不能为空'
  }),
  password: Joi.string().required().messages({
    'any.required': '密码不能为空'
  })
});

// 操作日志记录函数
const logOperation = async (operation: string, details: any = {}, userId?: string) => {
  try {
    await query(
      'INSERT INTO operation_logs (operation, details, user_id, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)',
      [operation, JSON.stringify(details), userId || null, details.ip || null, details.userAgent || null]
    );
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
};

// 获取匿名用户标识
router.post('/anonymous', async (req, res, next) => {
  try {
    const anonymousId = generateAnonymousId();
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip || req.connection.remoteAddress;

    // 记录匿名访问
    await logOperation('anonymous_access', {
      anonymousId,
      ip,
      userAgent
    });

    res.json({
      anonymousId,
      message: '匿名标识生成成功'
    });
  } catch (error) {
    next(error);
  }
});

// 管理员登录
router.post('/admin/login', async (req, res, next) => {
  try {
    // 验证输入
    const { error, value } = adminLoginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: '输入验证失败', 
        details: error.details.map(detail => detail.message) 
      });
    }

    const { username, password } = value;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';

    // 查找管理员用户
    const result = await query(
      'SELECT id, username, email, password_hash, role FROM users WHERE username = $1 AND role = $2',
      [username, 'admin']
    );

    if (result.rows.length === 0) {
      // 记录登录失败
      await logOperation('admin_login_failed', {
        username,
        reason: 'user_not_found',
        ip,
        userAgent
      });
      throw createError('管理员用户名或密码错误', 401);
    }

    const user = result.rows[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      // 记录登录失败
      await logOperation('admin_login_failed', {
        username,
        reason: 'invalid_password',
        ip,
        userAgent
      }, user.id);
      throw createError('管理员用户名或密码错误', 401);
    }

    // 生成JWT
    const jwtSecret = process.env.JWT_SECRET || 'dev_secret_key_please_change_in_production';
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };
    const options: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as string
    };
    const token = jwt.sign(payload, jwtSecret, options);

    // 记录成功登录
    await logOperation('admin_login_success', {
      username,
      ip,
      userAgent
    }, user.id);

    res.json({
      message: '管理员登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    user: req.user
  });
});

// 管理员注销
router.post('/admin/logout', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw createError('仅管理员可以执行此操作', 403);
    }

    // 记录注销操作
    await logOperation('admin_logout', {
      username: req.user.username,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }, req.user.id);

    res.json({
      message: '管理员注销成功'
    });
  } catch (error) {
    next(error);
  }
});

// 检查管理员状态
router.get('/admin/status', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        isAdmin: false,
        message: '非管理员用户' 
      });
    }

    res.json({
      isAdmin: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 