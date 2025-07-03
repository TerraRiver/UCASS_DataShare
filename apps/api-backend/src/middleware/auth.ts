import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '@/config/env';

export interface AuthenticatedRequest extends Request {
  adminUser?: {
    id: string;
    username: string;
  };
}

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: '访问令牌缺失' });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      id: string;
      username: string;
    };

    req.adminUser = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: '无效的访问令牌' });
  }
}; 