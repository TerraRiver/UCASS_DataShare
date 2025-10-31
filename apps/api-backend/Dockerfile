# 使用官方 Bun 镜像作为基础镜像
FROM oven/bun:1 AS base

# 安装 OpenSSL 和 curl（Prisma 和健康检查需要）
RUN apt-get update -y && \
    apt-get install -y openssl curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 安装依赖阶段
FROM base AS deps

# 复制 package.json 和 bun.lockb
COPY package.json bun.lockb* ./
COPY prisma ./prisma/

# 安装生产依赖
RUN bun install --frozen-lockfile --production

# 生成 Prisma Client
RUN bunx prisma generate

# 构建阶段
FROM base AS builder

WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 编译 TypeScript（如果有编译步骤）
# RUN bun build

# 生产运行阶段
FROM base AS runner

WORKDIR /app

# 设置为生产环境
ENV NODE_ENV=production

# 创建上传文件目录
RUN mkdir -p /app/uploads

# 复制必要的文件
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/bunfig.toml* ./

# 暴露端口
EXPOSE 30002

# 启动应用
CMD ["bun", "run", "src/index.ts"]
