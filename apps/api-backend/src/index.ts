import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env';
import { logger } from './middleware/logger';
import { errorHandler, notFound } from './middleware/errorHandler';

// 路由导入
import authRoutes from './routes/auth';
import datasetRoutes from './routes/datasets';
import caseStudyRoutes from './routes/casestudies';
import adminRoutes from './routes/admin';
import relationshipRoutes from './routes/relationships';

const app = express();

// 安全中间件
app.use(helmet());

// CORS配置 - 允许所有来源（生产环境建议配置具体域名）
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true,
}));

// 解析请求体
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
app.use('/api/admin', adminRoutes);
app.use('/api/relationships', relationshipRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'UCASS DataShare API 服务',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      datasets: '/api/datasets',
      casestudies: '/api/casestudies',
      admin: '/api/admin',
      health: '/health',
    },
  });
});

// 错误处理中间件
app.use(notFound);
app.use(errorHandler);

// 启动服务器
const PORT = ENV.PORT;

app.listen(PORT, () => {
  console.log(`🚀 UCASS DataShare API 服务已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🌍 环境: ${ENV.NODE_ENV}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
});

export default app; 