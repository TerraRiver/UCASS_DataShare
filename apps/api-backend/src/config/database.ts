import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ucass_datashare',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // 连接池最大连接数
  idleTimeoutMillis: 30000, // 连接空闲超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
};

// 创建连接池
export const pool = new Pool(dbConfig);

// 连接测试
pool.on('connect', (client) => {
  console.log('✅ 数据库连接成功');
});

pool.on('error', (err) => {
  console.error('❌ 数据库连接错误:', err);
  process.exit(-1);
});

// 数据库查询帮助函数
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 数据库查询执行时间:', duration, 'ms');
    return res;
  } catch (error) {
    console.error('❌ 数据库查询错误:', error);
    throw error;
  }
};

// 获取客户端连接
export const getClient = async () => {
  return await pool.connect();
};

export default pool; 