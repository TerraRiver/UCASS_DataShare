import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 环境变量配置接口
interface EnvConfig {
  // 服务器配置
  PORT: number;
  NODE_ENV: string;
  
  // 数据库配置
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  
  // JWT配置
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // 文件上传配置
  UPLOAD_DIR: string;
  MAX_FILE_SIZE: string;
  
  // 外部服务配置
  PYTHON_SERVICE_URL: string;
  FRONTEND_URL: string;
}

// 验证必需的环境变量
function validateEnv(): EnvConfig {
  const requiredVars = {
    PORT: process.env.PORT || '3001',
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '5432',
    DB_NAME: process.env.DB_NAME || 'ucass_datashare',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    
    JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '100MB',
    
    PYTHON_SERVICE_URL: process.env.PYTHON_SERVICE_URL || 'http://localhost:8000',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  };

  // 检查关键环境变量
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default_jwt_secret_change_in_production') {
      throw new Error('请在生产环境中设置安全的JWT_SECRET');
    }
    
    if (!process.env.DB_PASSWORD) {
      throw new Error('生产环境必须设置DB_PASSWORD');
    }
  }

  return {
    PORT: parseInt(requiredVars.PORT),
    NODE_ENV: requiredVars.NODE_ENV,
    DB_HOST: requiredVars.DB_HOST,
    DB_PORT: parseInt(requiredVars.DB_PORT),
    DB_NAME: requiredVars.DB_NAME,
    DB_USER: requiredVars.DB_USER,
    DB_PASSWORD: requiredVars.DB_PASSWORD,
    JWT_SECRET: requiredVars.JWT_SECRET,
    JWT_EXPIRES_IN: requiredVars.JWT_EXPIRES_IN,
    UPLOAD_DIR: requiredVars.UPLOAD_DIR,
    MAX_FILE_SIZE: requiredVars.MAX_FILE_SIZE,
    PYTHON_SERVICE_URL: requiredVars.PYTHON_SERVICE_URL,
    FRONTEND_URL: requiredVars.FRONTEND_URL,
  };
}

// 导出验证后的配置
export const env = validateEnv();

// 数据库URL
export const DATABASE_URL = `postgres://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;

// 是否为开发环境
export const isDevelopment = env.NODE_ENV === 'development';

// 是否为生产环境
export const isProduction = env.NODE_ENV === 'production'; 