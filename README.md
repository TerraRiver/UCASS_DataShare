# UCASS DataShare

**人文社科数据分享平台** - 专为计算社会科学与国家治理实验室设计的学术资源共享交流平台

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://www.postgresql.org/)

## 🎯 核心功能

- 📊 **数据集管理** - 多格式支持、在线预览、智能搜索、分类筛选
- 📑 **案例集分享** - 视频播放、关联数据集、实践链接
- 🔗 **知识图谱** - 交互式力导向图可视化资源关系
- 🧩 **方法模块** - 10大类计算社会科学方法管理
- 🔐 **审核机制** - 完善的内容审核工作流
- 📈 **统计分析** - 平台使用情况和资源下载统计
- 🔍 **RAG搜索** - 向量化语义智能搜索

## 🛠 技术栈

**后端**: Express + TypeScript + Prisma + PostgreSQL + JWT
**前端**: Next.js 14 + React 18 + NextUI + Tailwind CSS + SWR
**可视化**: Recharts + react-force-graph-2d
**AI**: OpenAI (RAG)

## 📁 项目结构

```
UCASS_DataShare/
├── apps/
│   ├── api-backend/          # 后端 API (Port: 30002)
│   │   ├── src/
│   │   │   ├── config/       # 配置文件
│   │   │   ├── middleware/   # 中间件
│   │   │   ├── routes/       # API 路由
│   │   │   ├── services/     # 业务逻辑
│   │   │   └── index.ts      # 入口文件
│   │   └── prisma/
│   │       └── schema.prisma # 数据库模型
│   │
│   └── web-frontend/         # 前端 (Port: 30001)
│       ├── app/
│       │   ├── (main)/       # 前台页面
│       │   └── admin/        # 后台管理
│       └── components/       # UI 组件
│
├── scripts/                  # 备份恢复脚本
└── package.json              # Monorepo 配置
```

## ⚙️ 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 15.0
- **磁盘空间** >= 20GB

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-org/ucass-datashare.git
cd ucass-datashare
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置数据库

**安装 PostgreSQL**

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql@15
brew services start postgresql@15
```

**创建数据库**

```bash
sudo -u postgres psql

CREATE DATABASE ucass_datashare;
CREATE USER ucass_datashare WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ucass_datashare TO ucass_datashare;
\q
```

### 4. 配置环境变量

**后端配置** - 创建 `apps/api-backend/.env`：

```env
# 数据库
DATABASE_URL="postgresql://ucass_datashare:your_password@localhost:5432/ucass_datashare"

# 服务配置
PORT=30002
NODE_ENV=development

# JWT 密钥
JWT_SECRET="your-secret-key-change-in-production"

# 文件上传
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10737418240

# 管理员账号
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

**前端配置** - 创建 `apps/web-frontend/.env`：

```env
# API 地址
NEXT_PUBLIC_API_URL=http://localhost:30002

# 服务端口
PORT=30001
```

### 5. 初始化数据库

```bash
cd apps/api-backend
# 生成 Prisma 客户端
npm run db:generate

# 推送数据库 schema
npm run db:push

# 初始化种子数据（创建管理员账号）
npm run db:seed
```

### 6. 启动开发服务器

**方式 1：同时启动前后端**

```bash
npm run dev
```

**方式 2：分别启动**

```bash
# 终端 1 - 后端
cd apps/api-backend
npm run dev

# 终端 2 - 前端
cd apps/web-frontend
npm run dev
```

### 7. 访问应用

| 页面 | 地址 | 说明 |
|------|------|------|
| 首页 | http://localhost:30001 | 平台首页 |
| 数据发现 | http://localhost:30001/discover | 浏览数据集 |
| 案例集 | http://localhost:30001/casestudies | 浏览案例集 |
| 知识图谱 | http://localhost:30001/explore | 关系可视化 |
| 管理后台 | http://localhost:30001/admin/login | 管理员登录 |

**默认管理员账号**
- 用户名: `admin`
- 密码: `admin123`

⚠️ **首次登录后请立即修改密码！**

## 📦 生产环境部署

### 构建项目

```bash
npm run build
```

### 启动生产服务

```bash
npm start
```

### 使用 PM2 守护进程

```bash
# 安装 PM2
npm install -g pm2

# 启动后端
cd apps/api-backend
pm2 start npm --name ucass-api -- start

# 启动前端
cd apps/web-frontend
pm2 start npm --name ucass-web -- start

# 保存配置
pm2 save
pm2 startup
```

### Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:30001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:30002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        client_max_body_size 10G;
    }
}
```

## 💾 备份与恢复

### 备份

```bash
cd scripts

# Linux/Ubuntu
./backup.sh

# Windows
backup.bat
```

### 恢复

```bash
cd scripts

# Linux/Ubuntu
./restore.sh ucass_backup_20250117_143000

# Windows
restore.bat ucass_backup_20250117_143000
```

### 定时自动备份

```bash
# 每天凌晨 2 点自动备份
crontab -e

# 添加以下行
0 2 * * * cd /path/to/ucass-datashare && ./scripts/backup.sh >> /var/log/ucass-backup.log 2>&1
```

## 📚 数据库模型

**核心表结构**：

- `admin_users` - 管理员账号
- `datasets` - 数据集（支持9个学科分类）
- `dataset_files` - 数据集文件
- `case_studies` - 案例集
- `case_study_files` - 案例集文件
- `case_study_datasets` - 案例集与数据集关系
- `embedded_contents` - RAG 向量化内容
- `system_settings` - 系统配置
- `method_categories` - 方法模块分类（10大类）
- `method_modules` - 方法模块
- `method_module_files` - 方法模块文件

查看详细 schema：`apps/api-backend/prisma/schema.prisma`

## 🔧 开发指南

### 常用命令

```bash
# 根目录命令
npm run dev           # 启动所有服务（开发模式）
npm run build         # 构建所有应用
npm start             # 启动所有服务（生产模式）

# 数据库命令
npm run db:generate   # 生成 Prisma 客户端
npm run db:push       # 推送 schema 到数据库
npm run db:migrate    # 创建数据库迁移
npm run db:studio     # 打开 Prisma Studio

# 后端命令（在 apps/api-backend 目录）
npm run dev           # 开发模式（热重载）
npm run build         # 构建
npm start             # 生产模式
npm run db:seed       # 初始化种子数据

# 前端命令（在 apps/web-frontend 目录）
npm run dev           # 开发模式
npm run build         # 构建
npm start             # 生产模式
npm run lint          # 代码检查
```

### 目录说明

- `apps/api-backend/src/routes/` - API 路由定义
- `apps/api-backend/src/middleware/` - 中间件（认证、日志等）
- `apps/api-backend/src/services/` - 业务逻辑服务
- `apps/web-frontend/app/(main)/` - 前台页面
- `apps/web-frontend/app/admin/` - 后台管理页面
- `apps/web-frontend/components/` - 可复用组件
- `scripts/` - 备份恢复等工具脚本

### 环境变量

**后端环境变量** (`apps/api-backend/.env`)：

| 变量名 | 说明 | 必填 |
|--------|------|------|
| DATABASE_URL | PostgreSQL 连接字符串 | ✅ |
| PORT | 服务端口 | ❌ |
| JWT_SECRET | JWT 密钥 | ✅ |
| UPLOAD_DIR | 上传目录 | ❌ |
| MAX_FILE_SIZE | 最大文件大小（字节） | ❌ |

**前端环境变量** (`apps/web-frontend/.env`)：

| 变量名 | 说明 | 必填 |
|--------|------|------|
| NEXT_PUBLIC_API_URL | API 基础地址 | ❌ |
| PORT | 服务端口 | ❌ |

## 🐛 故障排除

### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 启动 PostgreSQL
sudo systemctl start postgresql
```

### 端口被占用

```bash
# Linux/Mac
lsof -i :30002

# Windows
netstat -ano | findstr :30002

# 修改 .env 中的 PORT 配置
```

### Prisma 客户端未生成

```bash
cd apps/api-backend
npm run db:generate
```

### 前端构建失败

```bash
cd apps/web-frontend
rm -rf .next node_modules
npm install
npm run build
```

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 👥 团队

**计算社会科学与国家治理实验室 (UCASS)**

---

## 🙏 致谢

感谢以下优秀的开源项目：

- [Next.js](https://nextjs.org/) - React 框架
- [Prisma](https://www.prisma.io/) - ORM 工具
- [NextUI](https://nextui.org/) - UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Recharts](https://recharts.org/) - 图表库
- [react-force-graph](https://github.com/vasturiano/react-force-graph) - 图谱可视化

---

Made with ❤️ by UCASS Team
