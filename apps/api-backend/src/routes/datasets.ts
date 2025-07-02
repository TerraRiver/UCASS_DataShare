import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import axios from 'axios';
import { query } from '../config/database';
import { authenticateToken, requireAdmin, optionalAuth, AuthRequest, generateAnonymousId } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

// 数据集上传验证schema
const datasetUploadSchema = Joi.object({
  name: Joi.string().min(3).max(255).required().messages({
    'any.required': '数据集名称不能为空',
    'string.min': '数据集名称至少3个字符',
    'string.max': '数据集名称不能超过255个字符'
  }),
  source: Joi.string().uri().required().messages({
    'any.required': '数据来源不能为空',
    'string.uri': '数据来源必须是有效的网址'
  }),
  description_markdown: Joi.string().min(10).required().messages({
    'any.required': '详细介绍不能为空',
    'string.min': '详细介绍至少10个字符'
  }),
  data_update_time: Joi.date().iso().required().messages({
    'any.required': '数据更新时间不能为空',
    'date.format': '数据更新时间格式错误'
  }),
  tags: Joi.array().items(Joi.string()).default([])
});

// 审核操作验证schema
const reviewSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject', 'require_revision').required(),
  notes: Joi.string().when('action', {
    is: Joi.valid('reject', 'require_revision'),
    then: Joi.required(),
    otherwise: Joi.optional()
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

// 获取已批准的数据集列表（公开接口）
router.get('/public', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const tag = req.query.tag as string;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE status = 'approved' AND is_public = true";
    const queryParams: any[] = [limit, offset];
    let paramIndex = 3;

    // 搜索功能
    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR description_markdown ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // 标签筛选
    if (tag) {
      whereClause += ` AND $${paramIndex} = ANY(tags)`;
      queryParams.push(tag);
      paramIndex++;
    }

    // 获取数据集列表
    const datasetsResult = await query(`
      SELECT 
        id, name, source, description_markdown, data_update_time,
        tags, file_type, file_size, download_count, view_count,
        created_at, updated_at
      FROM datasets 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);

    // 获取总数
    const countResult = await query(`
      SELECT COUNT(*) as total 
      FROM datasets 
      ${whereClause.replace('LIMIT $1 OFFSET $2', '')}
    `, queryParams.slice(2));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      datasets: datasetsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
});

// 上传数据集（支持匿名上传）
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError('请选择要上传的文件', 400);
    }

    // 验证表单数据
    const { error, value } = datasetUploadSchema.validate(req.body);
    if (error) {
      // 删除已上传的文件
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        error: '数据验证失败',
        details: error.details.map(detail => detail.message)
      });
    }

    const { name, source, description_markdown, data_update_time, tags } = value;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';

    // 检查数据集名称是否重复
    const nameCheckResult = await query(
      'SELECT id FROM datasets WHERE name = $1',
      [name]
    );

    if (nameCheckResult.rows.length > 0) {
      await fs.unlink(req.file.path).catch(() => {});
      throw createError('数据集名称已存在，请使用其他名称', 400);
    }

    // 生成匿名用户ID（如果未认证）
    const anonymousId = generateAnonymousId();
    const uploaderId = req.user ? req.user.id : null;
    const uploaderType = req.user ? 'user' : 'anonymous';

    // 插入数据集记录
    const insertResult = await query(`
      INSERT INTO datasets (
        name, source, description_markdown, data_update_time,
        file_path, file_type, file_size, tags,
        uploader_id, uploader_type, anonymous_id, status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, status, created_at
    `, [
      name,
      source,
      description_markdown,
      data_update_time,
      req.file.path,
      req.file.mimetype,
      req.file.size,
      tags,
      uploaderId,
      uploaderType,
      anonymousId
    ]);

    const dataset = insertResult.rows[0];

    // 记录操作日志
    await logOperation('dataset_upload', {
      datasetId: dataset.id,
      datasetName: name,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploaderType,
      anonymousId: anonymousId,
      ip,
      userAgent
    }, uploaderId);

    res.status(201).json({
      message: '数据集上传成功，等待管理员审核',
      dataset: {
        id: dataset.id,
        name: dataset.name,
        status: dataset.status,
        uploadedAt: dataset.created_at
      }
    });
  } catch (error) {
    // 清理上传的文件
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
});

// 获取数据集详情（公开接口）
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        d.*,
        u.username as uploader_username
      FROM datasets d
      LEFT JOIN users u ON d.uploader_id = u.id
      WHERE d.id = $1 AND d.status = 'approved' AND d.is_public = true
    `, [id]);

    if (result.rows.length === 0) {
      throw createError('数据集不存在或未公开', 404);
    }

    const dataset = result.rows[0];

    // 增加查看次数
    await query(
      'UPDATE datasets SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    res.json({ dataset });
  } catch (error) {
    next(error);
  }
});

// 下载数据集（公开接口）
router.get('/:id/download', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT name, file_path, file_type 
      FROM datasets 
      WHERE id = $1 AND status = 'approved' AND is_public = true
    `, [id]);

    if (result.rows.length === 0) {
      throw createError('数据集不存在或未公开', 404);
    }

    const dataset = result.rows[0];

    // 检查文件是否存在
    try {
      await fs.access(dataset.file_path);
    } catch {
      throw createError('文件不存在', 404);
    }

    // 增加下载次数
    await query(
      'UPDATE datasets SET download_count = download_count + 1 WHERE id = $1',
      [id]
    );

    // 记录下载操作
    await logOperation('dataset_download', {
      datasetId: id,
      datasetName: dataset.name,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 设置下载响应头
    res.setHeader('Content-Disposition', `attachment; filename="${dataset.name}${path.extname(dataset.file_path)}"`);
    res.setHeader('Content-Type', dataset.file_type);

    // 发送文件
    res.sendFile(path.resolve(dataset.file_path));
  } catch (error) {
    next(error);
  }
});

// === 管理员接口 ===

// 获取待审核数据集列表（管理员专用）
router.get('/admin/pending', requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT 
        d.*,
        u.username as uploader_username
      FROM datasets d
      LEFT JOIN users u ON d.uploader_id = u.id
      WHERE d.status = 'pending'
      ORDER BY d.created_at ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await query(
      "SELECT COUNT(*) as total FROM datasets WHERE status = 'pending'"
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      datasets: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
});

// 审核数据集（管理员专用）
router.put('/admin/:id/review', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = reviewSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: '数据验证失败',
        details: error.details.map(detail => detail.message)
      });
    }

    const { action, notes } = value;

    // 确定新状态
    let newStatus: string;
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'require_revision':
        newStatus = 'revision_required';
        break;
      default:
        throw createError('无效的审核操作', 400);
    }

    // 更新数据集状态
    const updateResult = await query(`
      UPDATE datasets 
      SET 
        status = $1,
        review_notes = $2,
        reviewed_by = $3,
        reviewed_at = CURRENT_TIMESTAMP,
        revision_count = CASE WHEN $1 = 'revision_required' THEN revision_count + 1 ELSE revision_count END
      WHERE id = $4 AND status = 'pending'
      RETURNING name, uploader_id, anonymous_id
    `, [newStatus, notes, req.user!.id, id]);

    if (updateResult.rows.length === 0) {
      throw createError('数据集不存在或状态不正确', 404);
    }

    const dataset = updateResult.rows[0];

    // 记录审核操作
    await logOperation('dataset_review', {
      datasetId: id,
      datasetName: dataset.name,
      action,
      newStatus,
      notes,
      reviewedBy: req.user!.username,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }, req.user!.id);

    res.json({
      message: `数据集审核完成：${action === 'approve' ? '已批准' : action === 'reject' ? '已拒绝' : '需要修改'}`,
      datasetId: id,
      status: newStatus
    });
  } catch (error) {
    next(error);
  }
});

// 获取所有数据集管理列表（管理员专用）
router.get('/admin/all', requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const queryParams: any[] = [limit, offset];
    let paramIndex = 3;

    if (status) {
      whereClause = `WHERE status = $${paramIndex}`;
      queryParams.push(status);
    }

    const result = await query(`
      SELECT 
        d.*,
        u.username as uploader_username,
        r.username as reviewer_username
      FROM datasets d
      LEFT JOIN users u ON d.uploader_id = u.id
      LEFT JOIN users r ON d.reviewed_by = r.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);

    const countQuery = status ? 
      'SELECT COUNT(*) as total FROM datasets WHERE status = $1' :
      'SELECT COUNT(*) as total FROM datasets';
    
    const countParams = status ? [status] : [];
    const countResult = await query(countQuery, countParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      datasets: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取审核统计（管理员专用）
router.get('/admin/stats', requireAdmin, async (req, res, next) => {
  try {
    const statsResult = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM datasets 
      GROUP BY status
    `);

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      revision_required: 0
    };

    statsResult.rows.forEach(row => {
      stats[row.status as keyof typeof stats] = parseInt(row.count);
    });

    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

export default router; 