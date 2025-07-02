import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import Joi from 'joi';
import axios from 'axios';
import { query } from '../config/database';
import { authenticateToken, requireAdmin, optionalAuth, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.json', '.txt'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 数据集验证schema
const datasetSchema = Joi.object({
  name: Joi.string().min(1).max(255).required().messages({
    'string.min': '数据集名称不能为空',
    'string.max': '数据集名称最多255个字符',
    'any.required': '数据集名称是必需的'
  }),
  description: Joi.string().allow('').max(5000).messages({
    'string.max': '描述最多5000个字符'
  }),
  tags: Joi.array().items(Joi.string().max(50)).max(10).messages({
    'array.max': '最多添加10个标签',
    'string.max': '标签最多50个字符'
  }),
  previewable: Joi.boolean().default(false),
  visualizable: Joi.boolean().default(false),
  analyzable: Joi.boolean().default(false)
});

// 获取所有数据集（支持分页和搜索）
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const search = req.query.search as string || '';
    const tags = req.query.tags as string || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    // 搜索条件
    if (search) {
      whereClause += ` AND (d.name ILIKE $${paramIndex} OR d.description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // 标签过滤
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      whereClause += ` AND d.tags && $${paramIndex}`;
      queryParams.push(tagArray);
      paramIndex++;
    }

    // 查询数据集
    const datasetsQuery = `
      SELECT 
        d.id, d.name, d.description, d.tags, d.file_size, d.file_type,
        d.previewable, d.visualizable, d.analyzable, d.created_at,
        u.username as uploader_name
      FROM datasets d
      JOIN users u ON d.uploader_id = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await query(datasetsQuery, queryParams);

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM datasets d
      JOIN users u ON d.uploader_id = u.id
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      datasets: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取单个数据集详情
router.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const datasetId = req.params.id;

    const result = await query(`
      SELECT 
        d.*, 
        u.username as uploader_name,
        u.email as uploader_email
      FROM datasets d
      JOIN users u ON d.uploader_id = u.id
      WHERE d.id = $1
    `, [datasetId]);

    if (result.rows.length === 0) {
      throw createError('数据集不存在', 404);
    }

    const dataset = result.rows[0];

    // 不返回敏感信息
    delete dataset.file_path;
    delete dataset.uploader_email;

    res.json({ dataset });
  } catch (error) {
    next(error);
  }
});

// 上传新数据集（仅管理员）
router.post('/', authenticateToken, requireAdmin, upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      throw createError('请选择要上传的文件', 400);
    }

    // 验证元数据
    const { error, value } = datasetSchema.validate(req.body);
    if (error) {
      // 删除已上传的文件
      await unlinkAsync(req.file.path);
      return res.status(400).json({
        error: '数据验证失败',
        details: error.details.map(detail => detail.message)
      });
    }

    const { name, description, tags, previewable, visualizable, analyzable } = value;

    // 保存到数据库
    const result = await query(`
      INSERT INTO datasets (
        name, description, tags, uploader_id, file_path, file_size, file_type,
        previewable, visualizable, analyzable
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      name,
      description || '',
      tags || [],
      req.user!.id,
      req.file.path,
      req.file.size,
      path.extname(req.file.originalname).toLowerCase().substring(1),
      previewable,
      visualizable,
      analyzable
    ]);

    const dataset = result.rows[0];
    
    // 不返回文件路径
    delete dataset.file_path;

    res.status(201).json({
      message: '数据集上传成功',
      dataset
    });
  } catch (error) {
    // 如果出错，清理已上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      await unlinkAsync(req.file.path).catch(console.error);
    }
    next(error);
  }
});

// 更新数据集元数据（仅管理员）
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const datasetId = req.params.id;

    // 验证数据集是否存在
    const existingDataset = await query('SELECT id FROM datasets WHERE id = $1', [datasetId]);
    if (existingDataset.rows.length === 0) {
      throw createError('数据集不存在', 404);
    }

    // 验证输入
    const { error, value } = datasetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: '数据验证失败',
        details: error.details.map(detail => detail.message)
      });
    }

    const { name, description, tags, previewable, visualizable, analyzable } = value;

    // 更新数据集
    const result = await query(`
      UPDATE datasets 
      SET name = $1, description = $2, tags = $3, previewable = $4, 
          visualizable = $5, analyzable = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [name, description || '', tags || [], previewable, visualizable, analyzable, datasetId]);

    const dataset = result.rows[0];
    delete dataset.file_path;

    res.json({
      message: '数据集更新成功',
      dataset
    });
  } catch (error) {
    next(error);
  }
});

// 删除数据集（仅管理员）
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const datasetId = req.params.id;

    // 获取数据集信息以删除文件
    const result = await query('SELECT file_path FROM datasets WHERE id = $1', [datasetId]);
    
    if (result.rows.length === 0) {
      throw createError('数据集不存在', 404);
    }

    const filePath = result.rows[0].file_path;

    // 从数据库删除
    await query('DELETE FROM datasets WHERE id = $1', [datasetId]);

    // 删除文件
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
    }

    res.json({ message: '数据集删除成功' });
  } catch (error) {
    next(error);
  }
});

// 预览数据集
router.get('/:id/preview', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const datasetId = req.params.id;
    const rows = Math.min(parseInt(req.query.rows as string) || 100, 500);

    // 获取数据集信息
    const result = await query(`
      SELECT file_path, file_type, previewable, name 
      FROM datasets 
      WHERE id = $1
    `, [datasetId]);

    if (result.rows.length === 0) {
      throw createError('数据集不存在', 404);
    }

    const dataset = result.rows[0];

    if (!dataset.previewable) {
      throw createError('该数据集不支持预览', 400);
    }

    // 调用Python服务进行数据预览
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    
    try {
      const response = await axios.post(`${pythonServiceUrl}/preview`, {
        file_path: dataset.file_path,
        file_type: dataset.file_type,
        rows: rows
      });

      res.json({
        preview: response.data,
        metadata: {
          name: dataset.name,
          type: dataset.file_type,
          previewRows: rows
        }
      });
    } catch (pythonError) {
      console.error('Python服务调用失败:', pythonError);
      throw createError('数据预览服务暂时不可用', 503);
    }
  } catch (error) {
    next(error);
  }
});

// 下载数据集
router.get('/:id/download', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const datasetId = req.params.id;

    // 获取数据集信息
    const result = await query(`
      SELECT file_path, name, file_type 
      FROM datasets 
      WHERE id = $1
    `, [datasetId]);

    if (result.rows.length === 0) {
      throw createError('数据集不存在', 404);
    }

    const dataset = result.rows[0];
    const filePath = dataset.file_path;

    if (!fs.existsSync(filePath)) {
      throw createError('文件不存在', 404);
    }

    // 设置下载头
    const fileName = `${dataset.name}.${dataset.file_type}`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // 发送文件
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    next(error);
  }
});

// 数据可视化
router.post('/:id/visualize', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const datasetId = req.params.id;

    // 获取数据集信息
    const result = await query(`
      SELECT file_path, file_type, visualizable, name 
      FROM datasets 
      WHERE id = $1
    `, [datasetId]);

    if (result.rows.length === 0) {
      throw createError('数据集不存在', 404);
    }

    const dataset = result.rows[0];

    if (!dataset.visualizable) {
      throw createError('该数据集不支持可视化', 400);
    }

    // 调用Python服务进行数据可视化
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

    try {
      const response = await axios.post(`${pythonServiceUrl}/visualize`, {
        file_path: dataset.file_path,
        file_type: dataset.file_type,
        ...req.body // 传递可视化参数
      });

      res.json(response.data);
    } catch (pythonError) {
      console.error('Python可视化服务调用失败:', pythonError);
      throw createError('可视化服务暂时不可用', 503);
    }
  } catch (error) {
    next(error);
  }
});

// 数据分析
router.post('/:id/analyze', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const datasetId = req.params.id;

    // 获取数据集信息
    const result = await query(`
      SELECT file_path, file_type, analyzable, name 
      FROM datasets 
      WHERE id = $1
    `, [datasetId]);

    if (result.rows.length === 0) {
      throw createError('数据集不存在', 404);
    }

    const dataset = result.rows[0];

    if (!dataset.analyzable) {
      throw createError('该数据集不支持分析', 400);
    }

    // 调用Python服务进行数据分析
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

    try {
      const response = await axios.post(`${pythonServiceUrl}/analyze`, {
        file_path: dataset.file_path,
        file_type: dataset.file_type,
        ...req.body // 传递分析参数
      });

      res.json(response.data);
    } catch (pythonError) {
      console.error('Python分析服务调用失败:', pythonError);
      throw createError('分析服务暂时不可用', 503);
    }
  } catch (error) {
    next(error);
  }
});

export default router; 