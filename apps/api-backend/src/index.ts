import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env';
import { logger } from './middleware/logger';
import { errorHandler, notFound } from './middleware/errorHandler';

// 全局修复 BigInt JSON 序列化问题
// @ts-ignore
BigInt.prototype.toJSON = function() {
  return Number(this);
};

// 路由导入
import authRoutes from './routes/auth';
import datasetRoutes from './routes/datasets';
import caseStudyRoutes from './routes/casestudies';
import adminRoutes from './routes/admin';
import relationshipRoutes from './routes/relationships';
import ragRoutes from './routes/rag';
import settingsRoutes from './routes/settings';
import methodRoutes from './routes/methods';
import adminMethodRoutes from './routes/admin-methods';

const app = express();

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:30001'],
  credentials: true,
}));

// 解析请求体 - 仅用于非文件上传的API路由
// 注意：文件上传路由使用 multer，不受此限制影响
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志中间件
app.use(logger);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/casestudies', caseStudyRoutes);
app.use('/api/methods', methodRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/methods', adminMethodRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/admin', settingsRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'UCASS DataShare API 服务',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      datasets: '/api/datasets',
      casestudies: '/api/casestudies',
      methods: '/api/methods',
      admin: '/api/admin',
      relationships: '/api/relationships',
      rag: '/api/rag',
      settings: '/api/admin/settings',
      health: '/health',
    },
  });
});

// 错误处理中间件
app.use(notFound);
app.use(errorHandler);

// 启动服务器
const PORT = ENV.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 UCASS DataShare API 服务已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🌍 环境: ${ENV.NODE_ENV}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
});

// 设置请求超时时间为30分钟（支持大文件上传）
server.timeout = 1800000; // 30分钟
server.keepAliveTimeout = 1800000;
server.headersTimeout = 1800000;

export default app; 