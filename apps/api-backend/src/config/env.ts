import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(1073741824), // 1GB
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().default('admin123'),
  DEEPSEEK_API_KEY: z.string().optional(), // DeepSeek API 密钥（RAG 功能）
});

export const ENV = envSchema.parse(process.env);

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'] as const;

for (const envVar of requiredEnvVars) {
  if (!ENV[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
} 