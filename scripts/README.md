# UCASS DataShare 备份与恢复脚本

本目录包含数据库和文件的一键备份与恢复脚本，支持 Windows 和 Linux 平台。

## 📁 文件说明

- **backup.sh** - Linux/Ubuntu 备份脚本
- **restore.sh** - Linux/Ubuntu 恢复脚本
- **backup.bat** - Windows 备份脚本
- **restore.bat** - Windows 恢复脚本

## 🚀 快速使用

### Linux/Ubuntu

#### 一键备份
```bash
cd scripts
chmod +x backup.sh restore.sh
./backup.sh
```

#### 一键恢复
```bash
cd scripts
./restore.sh ucass_backup_20250110_143000
```

### Windows

#### 一键备份
```cmd
cd scripts
backup.bat
```

#### 一键恢复
```cmd
cd scripts
restore.bat ucass_backup_20250110_143000
```

## ⚙️ 配置说明

### 环境变量配置

在运行脚本前，建议设置以下环境变量：

**Linux:**
```bash
export DB_NAME=ucass_datashare
export DB_USER=ucass_datashare
export DB_PASSWORD=your_password
export DB_HOST=localhost
export DB_PORT=5432
export UPLOAD_DIR=./uploads
export BACKUP_DIR=./backups
export KEEP_DAYS=30
```

**Windows:**
```cmd
set DB_NAME=ucass_datashare
set DB_USER=ucass_datashare
set DB_PASSWORD=your_password
set DB_HOST=localhost
set DB_PORT=5432
set UPLOAD_DIR=uploads
set BACKUP_DIR=backups
```

### 或使用 .env 文件

也可以在项目根目录创建 `.env.backup` 文件：

```env
DB_NAME=ucass_datashare
DB_USER=ucass_datashare
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
UPLOAD_DIR=./uploads
BACKUP_DIR=./backups
KEEP_DAYS=30
```

然后在脚本中加载：
```bash
source .env.backup  # Linux
```

## 📦 备份内容

每次备份包含：

1. **数据库** - PostgreSQL 完整转储 (database.sql)
2. **上传文件** - uploads/ 目录所有文件
3. **备份信息** - backup_info.txt 元数据

备份文件结构：
```
ucass_backup_20250110_143000.tar.gz
├── database.sql          # 数据库 SQL 转储
├── uploads/              # 上传文件目录
│   ├── file1.xlsx
│   ├── file2.pdf
│   └── ...
└── backup_info.txt       # 备份元数据
```

## 🔧 前置要求

### Linux/Ubuntu

1. **PostgreSQL 客户端工具**
   ```bash
   sudo apt install postgresql-client
   ```

2. **tar** (通常已安装)
   ```bash
   tar --version
   ```

### Windows

1. **PostgreSQL** (包含 pg_dump 和 psql)
   - 下载: https://www.postgresql.org/download/windows/
   - 确保 `C:\Program Files\PostgreSQL\15\bin` 在系统 PATH 中

2. **tar** (Windows 10+ 已内置)
   ```cmd
   tar --version
   ```

   或安装 **7-Zip** 作为替代:
   - 下载: https://www.7-zip.org/

## ⏰ 定时自动备份

### Linux (使用 cron)

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点自动备份
0 2 * * * cd /var/www/ucass-datashare && ./scripts/backup.sh >> /var/log/ucass-backup.log 2>&1

# 每周日凌晨 3 点备份
0 3 * * 0 cd /var/www/ucass-datashare && ./scripts/backup.sh
```

### Windows (使用任务计划程序)

1. 打开"任务计划程序"
2. 创建基本任务
3. 触发器：每天 2:00 AM
4. 操作：启动程序
   - 程序：`D:\Projects\UCASS_DataShare\scripts\backup.bat`
   - 起始于：`D:\Projects\UCASS_DataShare`

## 🔐 安全建议

### 1. 密码安全

**不要**在脚本中硬编码密码，推荐使用：

**Linux - pgpass 文件:**
```bash
# 创建 ~/.pgpass 文件
echo "localhost:5432:ucass_datashare:ucass_datashare:your_password" > ~/.pgpass
chmod 600 ~/.pgpass
```

**Windows - pgpass.conf:**
```cmd
# 创建 %APPDATA%\postgresql\pgpass.conf
echo localhost:5432:ucass_datashare:ucass_datashare:your_password > %APPDATA%\postgresql\pgpass.conf
```

### 2. 备份存储

- ✅ 定期将备份上传到远程存储（云存储、NAS）
- ✅ 使用加密存储敏感备份
- ✅ 保留多个版本的备份
- ❌ 不要将备份与应用存储在同一磁盘

### 3. 恢复测试

定期测试恢复流程，确保备份可用：
```bash
# 在测试环境恢复
DB_NAME=ucass_test ./restore.sh ucass_backup_20250110_143000
```

## 📊 备份管理

### 查看所有备份

**Linux:**
```bash
ls -lh backups/*.tar.gz
```

**Windows:**
```cmd
dir backups\*.tar.gz
```

### 手动清理旧备份

**Linux:**
```bash
# 删除 30 天前的备份
find backups/ -name "ucass_backup_*.tar.gz" -mtime +30 -delete
```

**Windows:**
```powershell
# PowerShell: 删除 30 天前的备份
Get-ChildItem backups -Filter "ucass_backup_*.tar.gz" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item
```

### 备份到远程服务器

**使用 rsync (Linux):**
```bash
# 备份后同步到远程服务器
./backup.sh && rsync -avz backups/ user@remote:/path/to/backups/
```

**使用 scp:**
```bash
# 上传最新备份
LATEST=$(ls -t backups/*.tar.gz | head -1)
scp $LATEST user@remote:/path/to/backups/
```

## ❌ 故障排除

### 1. "pg_dump: command not found"

**解决方案:**
- Linux: `sudo apt install postgresql-client`
- Windows: 确保 PostgreSQL bin 目录在 PATH 中

### 2. "database does not exist"

**解决方案:**
```bash
# 检查数据库是否存在
psql -h localhost -U ucass_datashare -l

# 如果不存在，先运行 Prisma migrations
cd apps/api-backend
bunx prisma db push
```

### 3. "Permission denied"

**解决方案:**
```bash
# Linux: 添加执行权限
chmod +x backup.sh restore.sh

# 文件目录权限
chmod 755 uploads/
chmod 755 backups/
```

### 4. 恢复后数据不完整

**可能原因:**
- 备份时数据库连接中断
- 磁盘空间不足
- 备份文件损坏

**解决方案:**
- 重新创建备份
- 验证备份文件完整性：`tar -tzf backup.tar.gz`

## 📝 示例场景

### 场景 1: 迁移到新服务器

```bash
# 旧服务器
cd /var/www/ucass-datashare
./scripts/backup.sh
scp backups/ucass_backup_*.tar.gz user@new-server:/tmp/

# 新服务器
cd /var/www/ucass-datashare
./scripts/restore.sh /tmp/ucass_backup_20250110_143000.tar.gz
```

### 场景 2: 定期备份到 S3

```bash
# 备份后上传到 AWS S3
./backup.sh && \
aws s3 cp backups/ucass_backup_$(date +%Y%m%d)*.tar.gz \
  s3://my-bucket/ucass-backups/
```

### 场景 3: 恢复特定版本

```bash
# 查看可用备份
ls -lh backups/

# 恢复 1月10日的备份
./restore.sh ucass_backup_20250110_143000
```

## 🆘 紧急恢复

如果系统完全损坏，最小化恢复步骤：

```bash
# 1. 安装 PostgreSQL
sudo apt install postgresql

# 2. 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE ucass_datashare;
CREATE USER ucass_datashare WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE ucass_datashare TO ucass_datashare;
\q

# 3. 恢复数据
cd /path/to/project
./scripts/restore.sh /path/to/backup.tar.gz

# 4. 启动应用
pm2 start apps/api-backend/src/index.ts --name ucass-api
```

## 📞 支持

如有问题，请查看：
- 项目主 README.md
- 部署指南-宝塔面板.md
- GitHub Issues

---

**最后更新:** 2025-01-10
**版本:** 1.0.0
