import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// 注册验证schema
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': '用户名只能包含字母和数字',
    'string.min': '用户名至少3个字符',
    'string.max': '用户名最多30个字符',
    'any.required': '用户名不能为空'
  }),
  email: Joi.string().email().required().messages({
    'string.email': '邮箱格式不正确',
    'any.required': '邮箱不能为空'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '密码至少6个字符',
    'any.required': '密码不能为空'
  })
});

// 登录验证schema
const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': '用户名不能为空'
  }),
  password: Joi.string().required().messages({
    'any.required': '密码不能为空'
  })
});

// 用户注册
router.post('/register', async (req, res, next) => {
  try {
    // 验证输入
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: '输入验证失败', 
        details: error.details.map(detail => detail.message) 
      });
    }

    const { username, email, password } = value;

    // 检查用户名和邮箱是否已存在
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      throw createError('用户名或邮箱已存在', 409);
    }

    // 加密密码
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const result = await query(
      `INSERT INTO users (username, email, password_hash, role, api_key) 
       VALUES ($1, $2, $3, 'user', $4) 
       RETURNING id, username, email, role, created_at`,
      [username, email, passwordHash, uuidv4()]
    );

    const newUser = result.rows[0];

    // 生成JWT
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.created_at
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// 用户登录
router.post('/login', async (req, res, next) => {
  try {
    // 验证输入
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: '输入验证失败', 
        details: error.details.map(detail => detail.message) 
      });
    }

    const { username, password } = value;

    // 查找用户
    const result = await query(
      'SELECT id, username, email, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      throw createError('用户名或密码错误', 401);
    }

    const user = result.rows[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw createError('用户名或密码错误', 401);
    }

    // 生成JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: '登录成功',
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

// 生成新的API密钥
router.post('/api-key/generate', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const newApiKey = uuidv4();
    
    await query(
      'UPDATE users SET api_key = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newApiKey, req.user!.id]
    );

    res.json({
      message: 'API密钥生成成功',
      apiKey: newApiKey
    });
  } catch (error) {
    next(error);
  }
});

export default router; 