import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // 获取真实IP地址
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.connection as any)?.socket?.remoteAddress ||
             'unknown';

  // 请求开始日志
  console.log(`📨 ${req.method} ${req.originalUrl} - ${ip}`);

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : '🟢';
    
    console.log(`${statusColor} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${ip}`);
  });

  next();
}; 