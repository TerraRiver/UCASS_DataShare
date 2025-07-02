import express from 'express';
import { query } from '../config/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// 获取所有用户（仅管理员）
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = req.query.search as string || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    // 搜索条件
    if (search) {
      whereClause += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // 查询用户
    const usersQuery = `
      SELECT 
        id, username, email, role, created_at, updated_at,
        (SELECT COUNT(*) FROM datasets WHERE uploader_id = users.id) as dataset_count
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await query(usersQuery, queryParams);

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      users: result.rows,
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

// 获取单个用户详情（仅管理员）
router.get('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.id;

    const result = await query(`
      SELECT 
        id, username, email, role, api_key, created_at, updated_at,
        (SELECT COUNT(*) FROM datasets WHERE uploader_id = $1) as dataset_count
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      throw createError('用户不存在', 404);
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// 更新用户角色（仅管理员）
router.put('/:id/role', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      throw createError('无效的用户角色', 400);
    }

    // 防止用户修改自己的角色为普通用户（避免锁定）
    if (userId === req.user!.id && role === 'user') {
      throw createError('不能将自己的角色修改为普通用户', 400);
    }

    // 检查用户是否存在
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (existingUser.rows.length === 0) {
      throw createError('用户不存在', 404);
    }

    // 更新用户角色
    await query(`
      UPDATE users 
      SET role = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [role, userId]);

    res.json({ message: '用户角色更新成功' });
  } catch (error) {
    next(error);
  }
});

// 删除用户（仅管理员）
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.id;

    // 防止用户删除自己
    if (userId === req.user!.id) {
      throw createError('不能删除自己的账户', 400);
    }

    // 检查用户是否存在
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (existingUser.rows.length === 0) {
      throw createError('用户不存在', 404);
    }

    // 删除用户（数据集会通过外键约束级联删除或者可以选择转移给管理员）
    await query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: '用户删除成功' });
  } catch (error) {
    next(error);
  }
});

// 获取用户的数据集（仅管理员）
router.get('/:id/datasets', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    // 检查用户是否存在
    const userExists = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userExists.rows.length === 0) {
      throw createError('用户不存在', 404);
    }

    // 获取用户的数据集
    const result = await query(`
      SELECT 
        id, name, description, tags, file_size, file_type,
        previewable, visualizable, analyzable, created_at, updated_at
      FROM datasets 
      WHERE uploader_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    // 获取总数
    const countResult = await query(
      'SELECT COUNT(*) as total FROM datasets WHERE uploader_id = $1',
      [userId]
    );
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

// 获取平台统计信息（仅管理员）
router.get('/stats/overview', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    // 获取各种统计数据
    const [usersResult, datasetsResult, adminsResult, recentUsersResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM users'),
      query('SELECT COUNT(*) as total FROM datasets'),
      query("SELECT COUNT(*) as total FROM users WHERE role = 'admin'"),
      query('SELECT COUNT(*) as total FROM users WHERE created_at >= NOW() - INTERVAL \'30 days\'')
    ]);

    // 获取文件类型统计
    const fileTypesResult = await query(`
      SELECT file_type, COUNT(*) as count 
      FROM datasets 
      GROUP BY file_type 
      ORDER BY count DESC
    `);

    // 获取每月注册用户数（最近6个月）
    const monthlyUsersResult = await query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month 
      ORDER BY month
    `);

    // 获取每月上传数据集数（最近6个月）
    const monthlyDatasetsResult = await query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM datasets 
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month 
      ORDER BY month
    `);

    res.json({
      overview: {
        totalUsers: parseInt(usersResult.rows[0].total),
        totalDatasets: parseInt(datasetsResult.rows[0].total),
        totalAdmins: parseInt(adminsResult.rows[0].total),
        recentUsers: parseInt(recentUsersResult.rows[0].total)
      },
      fileTypes: fileTypesResult.rows,
      monthlyUsers: monthlyUsersResult.rows,
      monthlyDatasets: monthlyDatasetsResult.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router; 