# =====================================================
# Dockerfile for Next.js in Bun Workspaces Monorepo
# =====================================================

# 使用官方 Bun 镜像作为基础镜像
FROM oven/bun:1 AS base

# 安装 curl（健康检查需要）
RUN apt-get update -y && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# =====================================================
# 依赖安装阶段 - 处理 Monorepo 结构
# =====================================================
FROM base AS deps

WORKDIR /app

# 1. 复制根目录的 package.json（包含 workspaces 配置）
COPY package.json bun.lockb* ./

# 2. 复制所有 workspace 的 package.json
COPY apps/web-frontend/package.json ./apps/web-frontend/
COPY apps/api-backend/package.json ./apps/api-backend/

# 3. 安装所有依赖（Bun 会自动处理 workspaces）
RUN bun install --frozen-lockfile

# 4. 额外：在 workspace 目录中也安装一次，确保 next CLI 可用
WORKDIR /app/apps/web-frontend
RUN bun install --frozen-lockfile

# =====================================================
# 构建阶段
# =====================================================
FROM base AS builder

WORKDIR /app

# 复制根目录的 node_modules（包含提升的依赖）
COPY --from=deps /app/node_modules ./node_modules

# 复制 workspace 的 node_modules（包含 next CLI）
COPY --from=deps /app/apps/web-frontend/node_modules ./apps/web-frontend/node_modules

# 复制根目录的 package.json
COPY package.json ./

# 复制整个前端项目
COPY apps/web-frontend ./apps/web-frontend

# 确保 public 目录存在
RUN mkdir -p apps/web-frontend/public

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1

# 进入前端目录并构建（使用 bunx 自动查找 next）
WORKDIR /app/apps/web-frontend
RUN bunx next build

# =====================================================
# 生产运行阶段 - 使用 Node.js
# =====================================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 安装 curl（健康检查需要）
RUN apt-get update -y && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制 standalone 输出（包含 monorepo 结构）
# standalone 输出已经包含了必要的依赖，但需要正确的目录结构
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-frontend/.next/standalone ./

# 复制静态文件到正确位置
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-frontend/.next/static ./apps/web-frontend/.next/static

# 复制 public 文件夹
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-frontend/public ./apps/web-frontend/public

USER nextjs

# 暴露端口
EXPOSE 30001

ENV PORT=30001
ENV HOSTNAME="0.0.0.0"

# standalone 的启动文件应该在 apps/web-frontend/server.js
CMD ["node", "apps/web-frontend/server.js"]
