import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = error;

  // 数据库错误处理
  if (error.message.includes('duplicate key')) {
    statusCode = 409;
    message = '数据已存在';
  } else if (error.message.includes('violates foreign key')) {
    statusCode = 400;
    message = '引用的数据不存在';
  } else if (error.message.includes('invalid input syntax')) {
    statusCode = 400;
    message = '输入数据格式错误';
  }

  // JWT错误处理
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的访问令牌';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '访问令牌已过期';
  }

  // Multer文件上传错误
  if (error.message.includes('LIMIT_FILE_SIZE')) {
    statusCode = 413;
    message = '文件大小超过限制';
  } else if (error.message.includes('LIMIT_UNEXPECTED_FILE')) {
    statusCode = 400;
    message = '不支持的文件类型';
  }

  console.error(`❌ 错误 [${statusCode}]:`, {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: (req as any).user?.id,
  });

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error 
    })
  });
};

// 创建应用错误的帮助函数
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}; 