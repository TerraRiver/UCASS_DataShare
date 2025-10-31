# UCASS DataShare - Docker 部署快速开始

> 🚀 一键部署校内学术资源分享平台

## 📦 快速部署（3 步骤）

### 1️⃣ 克隆项目

```bash
git clone <repository-url>
cd UCASS_DataShare
```

### 2️⃣ 配置环境

```bash
# 复制环境变量配置
cp .env.example .env

# 编辑配置文件（⚠️ 生产环境务必修改密码）
nano .env
```

### 3️⃣ 启动服务

```bash
# 使用快速部署脚本
chmod +x deploy.sh
./deploy.sh

# 或手动启动
docker compose up -d --build
```

## 🌐 访问应用

部署完成后，通过以下地址访问：

- **前台页面**: http://localhost 或 http://your-server-ip
- **管理后台**: http://localhost/admin/login
- **API 文档**: http://localhost/api

**默认管理员账号**：
- 用户名：`admin`
- 密码：`admin123`（⚠️ 首次登录后请立即修改）

## 📋 项目架构

```
┌─────────────┐
│   Nginx     │ ← 80/443 端口（外部访问）
│  (反向代理)  │
└─────────────┘
      │
      ├─→ Web Frontend (Next.js)   [端口: 30001]
      │
      ├─→ API Backend (Express)    [端口: 30002]
      │         │
      │         └─→ PostgreSQL     [端口: 5432]
      │
      └─→ Static Files (uploads)
```

## 🛠️ 常用命令

### 服务管理

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 完全清除（包括数据）
docker compose down -v
```

### 备份与恢复

```bash
# 备份数据
chmod +x backup.sh
./backup.sh

# 恢复数据
chmod +x restore.sh
./restore.sh

# 定时备份（每天凌晨2点）
crontab -e
# 添加：0 2 * * * /path/to/backup.sh >> /var/log/ucass_backup.log 2>&1
```

### 监控

```bash
# 查看系统状态
chmod +x monitor.sh
./monitor.sh

# 实时资源监控
docker stats

# 查看特定服务日志
docker compose logs -f api
docker compose logs -f web
```

## 📁 文件说明

| 文件/目录 | 说明 |
|----------|------|
| `docker-compose.yml` | Docker Compose 配置文件 |
| `.env` | 环境变量配置 |
| `apps/api-backend/Dockerfile` | 后端 Dockerfile |
| `apps/web-frontend/Dockerfile` | 前端 Dockerfile |
| `nginx/` | Nginx 配置文件 |
| `deploy.sh` | 快速部署脚本 |
| `backup.sh` | 数据备份脚本 |
| `restore.sh` | 数据恢复脚本 |
| `monitor.sh` | 系统监控脚本 |
| `DEPLOYMENT.md` | 详细部署文档 |

## 🔐 安全建议

### 生产环境必做：

1. **修改所有默认密码**
   ```bash
   # 编辑 .env 文件
   POSTGRES_PASSWORD=使用强密码
   JWT_SECRET=$(openssl rand -base64 32)
   ADMIN_PASSWORD=使用强密码
   ```

2. **配置防火墙**
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **启用 HTTPS**
   - 获取 SSL 证书（Let's Encrypt 或其他）
   - 将证书放入 `nginx/ssl/` 目录
   - 取消注释 `nginx/conf.d/ucass.conf` 中的 HTTPS 配置

4. **限制数据库访问**
   - 注释掉 `docker-compose.yml` 中数据库的端口映射

5. **设置自动备份**
   ```bash
   # 添加到 crontab
   0 2 * * * /path/to/backup.sh
   ```

## 🐛 故障排查

### 服务无法启动

```bash
# 查看详细日志
docker compose logs

# 检查端口占用
sudo netstat -tlnp | grep -E '(80|443|5432)'

# 清理并重启
docker compose down
docker compose up -d --build
```

### 数据库连接失败

```bash
# 检查数据库状态
docker compose exec postgres pg_isready

# 查看数据库日志
docker compose logs postgres

# 重置数据库
docker compose down
docker volume rm ucass_datashare_postgres_data
docker compose up -d
```

### 文件上传失败

```bash
# 检查上传目录权限
docker compose exec api ls -la /app/uploads

# 检查 Nginx 配置
docker compose exec nginx nginx -t

# 增加上传大小限制
# 编辑 nginx/conf.d/ucass.conf
client_max_body_size 10G;
```

## 📚 详细文档

完整的部署指南和故障排查，请参阅 **[DEPLOYMENT.md](./DEPLOYMENT.md)**

## 🔄 更新应用

```bash
# 1. 备份数据
./backup.sh

# 2. 拉取最新代码
git pull

# 3. 重新构建
docker compose up -d --build

# 4. 查看日志确认
docker compose logs -f
```

## 💡 性能优化

### 调整资源限制

编辑 `docker-compose.yml`：

```yaml
api:
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 2G
```

### 启用 Nginx 缓存

编辑 `nginx/conf.d/ucass.conf`，添加缓存配置。

### 数据库优化

```bash
# 进入数据库容器
docker compose exec postgres psql -U ucass_datashare -d ucass_datashare

-- 创建索引
CREATE INDEX idx_datasets_catalog ON "Dataset"(catalog);
CREATE INDEX idx_casestudies_discipline ON "CaseStudy"(discipline);
```

## 📞 获取帮助

- 📖 [完整部署文档](./DEPLOYMENT.md)
- 🐛 [问题反馈](https://github.com/your-repo/issues)
- 💬 联系技术支持

## 📄 许可证

MIT License

---

**祝部署顺利！** 🎉
