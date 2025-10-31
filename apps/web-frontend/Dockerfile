# 使用官方 Bun 镜像作为基础镜像
FROM oven/bun:1 AS base

# 安装依赖阶段
FROM base AS deps

WORKDIR /app

# 复制 package.json
COPY package.json bun.lockb* ./

# 安装依赖
RUN bun install --frozen-lockfile

# 构建阶段
FROM base AS builder

WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 确保 public 目录存在（即使为空）
RUN mkdir -p public

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1

# 构建 Next.js 应用
RUN bun run build

# 生产运行阶段
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制 public 文件夹（如果存在）
COPY --from=builder /app/public ./public

# 复制构建输出
RUN mkdir -p .next
RUN chown nextjs:nodejs .next

# 自动利用输出跟踪来减少镜像大小
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# 暴露端口
EXPOSE 30001

ENV PORT=30001
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["bun", "run", "server.js"]
