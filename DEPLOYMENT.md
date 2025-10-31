# UCASS DataShare - Docker 容器化部署指南

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细部署步骤](#详细部署步骤)
- [配置说明](#配置说明)
- [常用命令](#常用命令)
- [故障排查](#故障排查)
- [生产环境优化](#生产环境优化)
- [备份与恢复](#备份与恢复)
- [监控与日志](#监控与日志)

---

## 系统要求

### 硬件要求

- **CPU**: 2核心及以上
- **内存**: 4GB 及以上（推荐 8GB）
- **磁盘空间**: 至少 20GB 可用空间（根据数据量调整）

### 软件要求

- **操作系统**: Linux (Ubuntu 20.04+、CentOS 7+、Debian 10+) / macOS / Windows (with WSL2)
- **Docker**: 20.10+ 版本
- **Docker Compose**: 2.0+ 版本

### 安装 Docker 和 Docker Compose

#### Ubuntu/Debian

```bash
# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 添加 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker compose version
```

#### CentOS/RHEL

```bash
# 安装依赖
sudo yum install -y yum-utils

# 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker Engine
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker compose version
```

#### 添加当前用户到 docker 组（可选，避免每次使用 sudo）

```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## 快速开始

### 1. 克隆或上传项目

```bash
# 如果使用 Git
git clone <repository-url>
cd UCASS_DataShare

# 或者直接上传项目文件到服务器
# 使用 scp、rsync 或 FTP 等方式
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（⚠️ 生产环境务必修改默认密码！）
nano .env  # 或使用 vim、vi 等编辑器
```

**重要：** 在生产环境中，请务必修改以下配置：
- `POSTGRES_PASSWORD`: 数据库密码
- `JWT_SECRET`: JWT 密钥（使用 `openssl rand -base64 32` 生成）
- `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`: 管理员账号

### 3. 构建并启动服务

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 4. 访问应用

- **前台页面**: http://your-server-ip
- **管理后台**: http://your-server-ip/admin/login
- **API 接口**: http://your-server-ip/api

**默认管理员账号**：
- 用户名：`admin`
- 密码：`admin123`（⚠️ 首次登录后请立即修改）

---

## 详细部署步骤

### 项目结构

```
UCASS_DataShare/
├── apps/
│   ├── api-backend/
│   │   ├── Dockerfile           # 后端 Dockerfile
│   │   ├── .dockerignore        # Docker 忽略文件
│   │   └── ...
│   └── web-frontend/
│       ├── Dockerfile           # 前端 Dockerfile
│       ├── .dockerignore        # Docker 忽略文件
│       └── ...
├── nginx/
│   ├── nginx.conf              # Nginx 主配置
│   └── conf.d/
│       └── ucass.conf          # 应用配置
├── docker-compose.yml          # Docker Compose 配置
├── .env.example                # 环境变量模板
└── DEPLOYMENT.md               # 本文档
```

### 服务架构

```
┌─────────────────────────────────────────────┐
│              Nginx (反向代理)                │
│         Port: 80 (HTTP) / 443 (HTTPS)       │
└─────────────────────────────────────────────┘
              │                  │
              ↓                  ↓
┌──────────────────────┐  ┌──────────────────┐
│   Web Frontend       │  │   API Backend    │
│   (Next.js)          │  │   (Express)      │
│   Port: 30001        │  │   Port: 30002    │
└──────────────────────┘  └──────────────────┘
                                   │
                                   ↓
                          ┌──────────────────┐
                          │   PostgreSQL     │
                          │   Port: 5432     │
                          └──────────────────┘
```

### Docker Compose 服务说明

| 服务名称 | 说明 | 端口映射 | 依赖 |
|---------|------|---------|------|
| `postgres` | PostgreSQL 数据库 | 5432:5432 | - |
| `api` | 后端 API 服务 | 内部 30002 | postgres |
| `web` | 前端 Web 服务 | 内部 30001 | api |
| `nginx` | 反向代理服务器 | 80:80, 443:443 | web, api |

---

## 配置说明

### 环境变量配置（.env）

```bash
# 数据库配置
POSTGRES_DB=ucass_datashare
POSTGRES_USER=ucass_datashare
POSTGRES_PASSWORD=强密码_请修改   # ⚠️ 生产环境必改

# 应用配置
JWT_SECRET=使用openssl生成的密钥  # ⚠️ 生产环境必改
ADMIN_USERNAME=admin              # ⚠️ 建议修改
ADMIN_PASSWORD=强密码_请修改      # ⚠️ 生产环境必改

# 文件上传限制（字节）
MAX_FILE_SIZE=10737418240  # 10GB

# 端口配置
HTTP_PORT=80
HTTPS_PORT=443
POSTGRES_PORT=5432
```

### Nginx 配置自定义

编辑 `nginx/conf.d/ucass.conf` 文件以自定义：

1. **修改域名**：将 `server_name _;` 改为你的域名
   ```nginx
   server_name example.com www.example.com;
   ```

2. **启用 HTTPS**：取消注释 HTTPS 配置块，并配置 SSL 证书

3. **调整文件上传大小**：修改 `client_max_body_size` 参数

### SSL/HTTPS 配置（可选）

#### 1. 准备 SSL 证书

```bash
# 创建 SSL 目录
mkdir -p nginx/ssl

# 将证书文件复制到该目录
# - fullchain.pem: 完整证书链
# - privkey.pem: 私钥文件
cp /path/to/fullchain.pem nginx/ssl/
cp /path/to/privkey.pem nginx/ssl/
```

#### 2. 使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
sudo apt-get install certbot

# 获取证书（需要临时停止 Nginx）
sudo certbot certonly --standalone -d example.com -d www.example.com

# 证书位置
# /etc/letsencrypt/live/example.com/fullchain.pem
# /etc/letsencrypt/live/example.com/privkey.pem

# 复制到项目目录
sudo cp /etc/letsencrypt/live/example.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/example.com/privkey.pem nginx/ssl/
```

#### 3. 启用 HTTPS 配置

编辑 `nginx/conf.d/ucass.conf`，取消注释 HTTPS 配置部分。

#### 4. 重启 Nginx

```bash
docker compose restart nginx
```

---

## 常用命令

### 启动和停止

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 停止服务但保留数据卷
docker compose stop

# 重启所有服务
docker compose restart

# 重启单个服务
docker compose restart api
docker compose restart web
docker compose restart nginx
```

### 构建和更新

```bash
# 重新构建镜像
docker compose build

# 重新构建并启动
docker compose up -d --build

# 仅重新构建特定服务
docker compose build api
docker compose build web

# 拉取最新代码后更新部署
git pull
docker compose up -d --build
```

### 日志查看

```bash
# 查看所有服务日志
docker compose logs

# 实时查看日志
docker compose logs -f

# 查看特定服务日志
docker compose logs api
docker compose logs web
docker compose logs postgres
docker compose logs nginx

# 查看最近 100 行日志
docker compose logs --tail=100

# 查看实时日志并显示时间戳
docker compose logs -f -t
```

### 进入容器

```bash
# 进入 API 容器
docker compose exec api sh

# 进入 Web 容器
docker compose exec web sh

# 进入数据库容器
docker compose exec postgres psql -U ucass_datashare -d ucass_datashare

# 进入 Nginx 容器
docker compose exec nginx sh
```

### 数据库操作

```bash
# 运行数据库迁移
docker compose exec api bunx prisma migrate deploy

# 查看数据库状态
docker compose exec api bunx prisma migrate status

# 生成 Prisma Client
docker compose exec api bunx prisma generate

# 打开 Prisma Studio（数据库可视化工具）
docker compose exec api bunx prisma studio

# 直接执行 SQL
docker compose exec postgres psql -U ucass_datashare -d ucass_datashare -c "SELECT * FROM \"AdminUser\";"
```

### 清理和重置

```bash
# 停止并删除所有容器
docker compose down

# 停止并删除所有容器和卷（⚠️ 会删除所有数据！）
docker compose down -v

# 清理未使用的 Docker 资源
docker system prune -a

# 清理所有未使用的卷
docker volume prune
```

---

## 故障排查

### 问题 1: 容器启动失败

**症状**: 使用 `docker compose ps` 看到容器状态为 `Exited`

**解决方案**:

```bash
# 查看详细日志
docker compose logs <service-name>

# 常见原因：
# 1. 端口被占用
sudo netstat -tulpn | grep <port>
# 解决：修改 .env 中的端口配置

# 2. 权限问题
# 解决：检查文件权限，确保 Docker 有读取权限
sudo chown -R $USER:$USER .

# 3. 数据库连接失败
# 解决：确保 postgres 容器已完全启动
docker compose up -d postgres
# 等待 30 秒后再启动其他服务
docker compose up -d
```

### 问题 2: 数据库连接错误

**症状**: API 日志显示 "Error: connect ECONNREFUSED"

**解决方案**:

```bash
# 1. 检查数据库是否运行
docker compose ps postgres

# 2. 检查数据库健康状态
docker compose exec postgres pg_isready -U ucass_datashare

# 3. 查看数据库日志
docker compose logs postgres

# 4. 验证环境变量
docker compose exec api env | grep DATABASE_URL

# 5. 手动测试数据库连接
docker compose exec api bunx prisma db push
```

### 问题 3: 文件上传失败

**症状**: 上传文件时返回 413 错误或超时

**解决方案**:

```bash
# 1. 检查 Nginx 配置中的 client_max_body_size
docker compose exec nginx cat /etc/nginx/conf.d/ucass.conf | grep client_max_body_size

# 2. 修改 nginx/conf.d/ucass.conf 中的限制
client_max_body_size 10G;

# 3. 重启 Nginx
docker compose restart nginx

# 4. 检查后端环境变量
docker compose exec api env | grep MAX_FILE_SIZE
```

### 问题 4: 前端页面无法访问

**症状**: 浏览器显示 "502 Bad Gateway" 或无法连接

**解决方案**:

```bash
# 1. 检查所有服务状态
docker compose ps

# 2. 检查 web 服务日志
docker compose logs web

# 3. 检查 Nginx 日志
docker compose logs nginx

# 4. 测试前端服务是否响应
docker compose exec nginx wget -O- http://web:30001

# 5. 重启相关服务
docker compose restart web nginx
```

### 问题 5: 磁盘空间不足

**症状**: 日志显示 "no space left on device"

**解决方案**:

```bash
# 1. 查看磁盘使用情况
df -h

# 2. 查看 Docker 占用空间
docker system df

# 3. 清理未使用的镜像和容器
docker system prune -a

# 4. 清理未使用的卷（⚠️ 谨慎操作）
docker volume prune

# 5. 查看最大的文件
du -sh /var/lib/docker/*
```

---

## 生产环境优化

### 安全加固

#### 1. 修改默认密码

```bash
# 修改 .env 文件中的所有密码
POSTGRES_PASSWORD=使用强密码
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_PASSWORD=使用强密码
```

#### 2. 配置防火墙

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### 3. 限制数据库访问

修改 `docker-compose.yml`，注释掉数据库端口映射：

```yaml
postgres:
  # ports:
  #   - "${POSTGRES_PORT:-5432}:5432"  # 注释掉这行
```

#### 4. 启用 HTTPS

参考上文 [SSL/HTTPS 配置](#sslhttps-配置可选) 部分。

### 性能优化

#### 1. 调整数据库连接池

编辑 `apps/api-backend/.env` 或在 `docker-compose.yml` 中添加：

```yaml
api:
  environment:
    DATABASE_URL: postgresql://user:pass@postgres:5432/db?connection_limit=20
```

#### 2. 启用 Nginx 缓存

编辑 `nginx/conf.d/ucass.conf`，添加缓存配置：

```nginx
# 在 http 块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

# 在 location 块中使用
location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 60m;
    # ...
}
```

#### 3. 配置资源限制

修改 `docker-compose.yml`：

```yaml
api:
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 2G
      reservations:
        cpus: '0.5'
        memory: 512M
```

### 自动重启策略

已在 `docker-compose.yml` 中配置 `restart: unless-stopped`，确保容器异常退出后自动重启。

---

## 备份与恢复

### 数据库备份

#### 自动备份脚本

创建备份脚本 `backup.sh`：

```bash
#!/bin/bash

# 配置
BACKUP_DIR="/var/backups/ucass_datashare"
DATE=$(date +%Y%m%d_%H%M%S)
POSTGRES_CONTAINER="ucass_postgres"
DB_NAME="ucass_datashare"
DB_USER="ucass_datashare"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
docker exec $POSTGRES_CONTAINER pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# 删除 7 天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR/backup_$DATE.sql.gz"
```

#### 设置定时备份

```bash
# 添加执行权限
chmod +x backup.sh

# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点自动备份
0 2 * * * /path/to/backup.sh >> /var/log/ucass_backup.log 2>&1
```

### 数据库恢复

```bash
# 1. 停止 API 服务
docker compose stop api

# 2. 恢复数据库
gunzip -c /path/to/backup.sql.gz | docker exec -i ucass_postgres psql -U ucass_datashare -d ucass_datashare

# 3. 重启服务
docker compose start api
```

### 上传文件备份

```bash
# 备份上传文件目录
docker run --rm \
  -v ucass_datashare_uploads_data:/source:ro \
  -v /backup:/backup \
  alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /source .

# 恢复上传文件
docker run --rm \
  -v ucass_datashare_uploads_data:/target \
  -v /backup:/backup \
  alpine sh -c "cd /target && tar xzf /backup/uploads_YYYYMMDD.tar.gz"
```

---

## 监控与日志

### 日志管理

#### 配置日志轮转

创建 `/etc/docker/daemon.json`：

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

重启 Docker 服务：

```bash
sudo systemctl restart docker
```

#### 查看日志位置

```bash
# Docker 日志位置
/var/lib/docker/containers/<container-id>/<container-id>-json.log

# Nginx 日志
docker compose exec nginx ls -la /var/log/nginx/

# 应用日志
docker compose logs api
docker compose logs web
```

### 健康检查

```bash
# 检查所有服务健康状态
docker compose ps

# 测试 API 健康端点
curl http://localhost/api/health

# 测试前端
curl http://localhost/

# 测试数据库
docker compose exec postgres pg_isready
```

### 监控工具集成

#### Prometheus + Grafana（可选）

1. 添加 Prometheus 和 Grafana 到 `docker-compose.yml`
2. 配置应用导出指标
3. 创建 Grafana 仪表盘

#### 简单监控脚本

创建 `monitor.sh`：

```bash
#!/bin/bash

# 检查服务状态
echo "=== 服务状态 ==="
docker compose ps

# 检查磁盘空间
echo -e "\n=== 磁盘空间 ==="
df -h | grep -E '^/dev/'

# 检查内存使用
echo -e "\n=== 内存使用 ==="
free -h

# 检查容器资源使用
echo -e "\n=== 容器资源 ==="
docker stats --no-stream
```

---

## 升级和维护

### 应用更新

```bash
# 1. 备份数据（重要！）
./backup.sh

# 2. 拉取最新代码
git pull origin main

# 3. 重新构建并启动
docker compose up -d --build

# 4. 查看日志确认
docker compose logs -f
```

### 数据库迁移

```bash
# 1. 停止 API 服务
docker compose stop api

# 2. 备份数据库
docker exec ucass_postgres pg_dump -U ucass_datashare ucass_datashare > backup.sql

# 3. 运行迁移
docker compose exec api bunx prisma migrate deploy

# 4. 启动服务
docker compose start api
```

---

## 附录

### 完整部署检查清单

- [ ] 安装 Docker 和 Docker Compose
- [ ] 克隆或上传项目文件
- [ ] 复制并配置 `.env` 文件
- [ ] 修改所有默认密码和密钥
- [ ] 配置域名（如果有）
- [ ] 配置 SSL 证书（如果需要 HTTPS）
- [ ] 构建并启动所有服务
- [ ] 验证所有服务正常运行
- [ ] 测试文件上传功能
- [ ] 配置防火墙规则
- [ ] 设置自动备份
- [ ] 配置日志轮转
- [ ] 文档记录管理员账号和重要配置

### 常见端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 80 | HTTP | 外部访问端口 |
| 443 | HTTPS | 安全访问端口（可选）|
| 5432 | PostgreSQL | 数据库（仅内部） |
| 30001 | Web Frontend | 前端服务（内部） |
| 30002 | API Backend | 后端API（内部） |

### 技术支持

如遇到问题，请：

1. 查看本文档的[故障排查](#故障排查)部分
2. 查看服务日志: `docker compose logs`
3. 检查 GitHub Issues
4. 联系技术支持团队

---

## 许可证

本项目遵循 MIT 许可证。

---

**最后更新**: 2024年

**文档版本**: 1.0.0
