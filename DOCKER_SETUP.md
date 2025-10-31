# Docker 容器化部署 - 文件清单

本次为 UCASS DataShare 项目添加了完整的 Docker 容器化部署支持。

## 📦 新增文件清单

### 1. Docker 配置文件

| 文件路径 | 说明 |
|---------|------|
| `docker-compose.yml` | Docker Compose 主配置文件，定义所有服务 |
| `apps/api-backend/Dockerfile` | 后端 API 的 Docker 镜像构建文件 |
| `apps/web-frontend/Dockerfile` | 前端 Web 的 Docker 镜像构建文件 |
| `apps/api-backend/.dockerignore` | 后端构建时忽略的文件 |
| `apps/web-frontend/.dockerignore` | 前端构建时忽略的文件 |

### 2. Nginx 配置

| 文件路径 | 说明 |
|---------|------|
| `nginx/nginx.conf` | Nginx 主配置文件 |
| `nginx/conf.d/ucass.conf` | 应用反向代理配置 |

### 3. 环境配置

| 文件路径 | 说明 |
|---------|------|
| `.env.example` | 环境变量模板文件（需复制为 .env 使用）|

### 4. 管理脚本

| 文件路径 | 说明 | 使用方式 |
|---------|------|----------|
| `deploy.sh` | 快速部署脚本 | `./deploy.sh` |
| `backup.sh` | 数据备份脚本 | `./backup.sh` |
| `restore.sh` | 数据恢复脚本 | `./restore.sh` |
| `monitor.sh` | 系统监控脚本 | `./monitor.sh` |

### 5. 文档

| 文件路径 | 说明 |
|---------|------|
| `DEPLOYMENT.md` | 完整部署指南（31 页详细文档）|
| `DOCKER_README.md` | Docker 部署快速开始 |

### 6. 更新的文件

| 文件路径 | 修改内容 |
|---------|----------|
| `apps/web-frontend/next.config.js` | 添加 `output: 'standalone'` 配置 |
| `.gitignore` | 添加 Docker 相关忽略规则 |

## 🏗️ 部署架构

```
┌─────────────────────────────────────────────┐
│              Nginx (Port 80/443)            │
│              反向代理 + 静态文件服务          │
└─────────────────────────────────────────────┘
              │                  │
              ↓                  ↓
┌──────────────────────┐  ┌──────────────────┐
│   Web Frontend       │  │   API Backend    │
│   (Next.js)          │  │   (Express)      │
│   Container          │  │   Container      │
│   Port: 30001        │  │   Port: 30002    │
└──────────────────────┘  └──────────────────┘
                                   │
                                   ↓
                          ┌──────────────────┐
                          │   PostgreSQL     │
                          │   Container      │
                          │   Port: 5432     │
                          └──────────────────┘

持久化存储:
- postgres_data (数据库数据)
- uploads_data (用户上传文件)
```

## 🚀 快速开始（3 步）

### 1. 配置环境

```bash
cp .env.example .env
nano .env  # 修改密码和配置
```

### 2. 部署服务

```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. 访问应用

- 前台: http://localhost
- 管理后台: http://localhost/admin/login
- 默认账号: admin / admin123

## 📋 服务说明

| 服务名 | 容器名 | 端口 | 说明 |
|-------|--------|------|------|
| postgres | ucass_postgres | 5432 | PostgreSQL 16 数据库 |
| api | ucass_api | 30002 (内部) | 后端 API 服务 |
| web | ucass_web | 30001 (内部) | 前端 Web 服务 |
| nginx | ucass_nginx | 80, 443 | 反向代理服务器 |

## 🛠️ 常用操作

### 启动/停止

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 备份/恢复

```bash
# 备份数据
./backup.sh

# 恢复数据
./restore.sh
```

### 监控

```bash
# 查看系统状态
./monitor.sh

# 实时日志
docker compose logs -f
```

## ⚙️ 核心功能

### ✅ 已实现

- [x] 完整的 Docker 容器化
- [x] 多阶段构建优化镜像大小
- [x] Nginx 反向代理
- [x] 数据持久化（数据库 + 文件）
- [x] 健康检查
- [x] 自动重启策略
- [x] 环境变量配置
- [x] 日志管理
- [x] 备份恢复脚本
- [x] 监控脚本
- [x] HTTPS 支持（可选）
- [x] 详细文档

### 🔐 安全特性

- JWT 认证
- 密码加密
- 环境变量隔离
- 容器网络隔离
- 文件上传安全检查
- SQL 注入防护（Prisma ORM）
- XSS 防护
- CORS 配置
- Rate Limiting

### 📈 性能优化

- Nginx 反向代理缓存
- 静态资源压缩（Gzip）
- 多阶段构建减小镜像体积
- 资源限制和预留
- 数据库连接池
- Next.js 生产优化

## 📚 详细文档

完整部署指南请查看：**[DEPLOYMENT.md](./DEPLOYMENT.md)**

包含内容：
- 系统要求和安装
- 详细部署步骤
- 配置说明
- SSL/HTTPS 配置
- 故障排查指南
- 生产环境优化
- 备份与恢复
- 监控与日志

## 🔄 CI/CD 支持（未来）

可以基于现有配置添加：
- GitHub Actions 自动构建
- Docker Hub 自动推送
- 自动化测试
- 滚动更新部署

## 📝 注意事项

### ⚠️ 生产环境部署前必做

1. 修改 `.env` 中的所有默认密码
2. 生成新的 JWT_SECRET: `openssl rand -base64 32`
3. 配置防火墙规则
4. 启用 HTTPS
5. 设置自动备份
6. 配置监控和告警

### 💡 建议

- 定期备份数据（建议每天）
- 定期检查日志
- 监控磁盘空间使用
- 定期更新 Docker 镜像
- 使用强密码
- 启用二步验证（如有）

## 🆘 获取帮助

如遇到问题：

1. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 的故障排查章节
2. 运行 `./monitor.sh` 检查系统状态
3. 查看日志: `docker compose logs -f`
4. 提交 Issue 到 GitHub

## 📄 许可证

MIT License

---

**部署文档编写完成！** ✅

创建时间: 2024
文档版本: 1.0.0
