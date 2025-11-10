# UCASS DataShare

<div align="center">

# 📚 UCASS DataShare - 人文社科数据分享平台

*专为人文社会科学实验室设计的学术资源共享交流平台*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-orange?logo=bun)](https://bun.sh/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[功能特性](#-功能特性) • [技术栈](#-技术栈) • [快速开始](#-快速开始) • [部署指南](#-部署指南) • [API 文档](#-api-文档)

</div>

---

## 📖 项目简介

**UCASS DataShare** 是一个专为**计算社会科学与国家治理实验室**（UCASS）设计的学术资源共享平台，旨在促进人文社会科学领域的数据集和案例集的安全共享、规范管理和协作使用。

### 🎯 核心价值

- **📊 数据集管理** - 支持多种格式的数据集上传、预览和下载
- **📑 案例集分享** - 学术案例的集中展示和交流
- **🔗 关系可视化** - 知识图谱展示数据集与案例集的关联关系
- **🔐 审核机制** - 完善的内容审核工作流，保证资源质量
- **📈 统计分析** - 平台使用情况和资源下载统计

### 🌟 适用场景

- 🎓 高校实验室数据共享
- 🔬 科研团队内部资源管理
- 📚 学术会议资料分发
- 🌐 开放数据集平台

---

## ✨ 功能特性

### 前台功能

#### 1. 数据集发现与管理
- ✅ **多格式支持** - CSV, XLSX, PDF, 文本等多种文件格式
- ✅ **数据预览** - CSV/XLSX 文件在线预览（前 50 行）
- ✅ **智能搜索** - 全文搜索（名称、简述、来源）
- ✅ **分类筛选** - 9 个学科分类（政治学、经济学、社会学等）
- ✅ **多维排序** - 最新上传、下载最多、名称排序
- ✅ **批量下载** - 单文件下载或自动打包 ZIP
- ✅ **下载统计** - 自动记录下载次数

#### 2. 案例集分享
- ✅ **案例展示** - 标题、作者、发表信息、学科分类
- ✅ **视频支持** - 在线播放视频文件（支持拖动）
- ✅ **关联数据集** - 案例集与数据集的双向关联
- ✅ **实践功能** - 支持实践链接和资源
- ✅ **精选标记** - 优质案例推荐

#### 3. 知识图谱探索
- ✅ **力导向图** - 交互式关系网络可视化
- ✅ **节点筛选** - 按类型（数据集/案例集）过滤
- ✅ **智能布局** - 节点大小根据下载量动态调整
- ✅ **详情查看** - 点击节点查看完整信息
- ✅ **缩放控制** - 放大、缩小、适应屏幕

#### 4. 用户上传
- ✅ **多文件上传** - 最多 10 个文件，单个最大 10GB
- ✅ **元数据填写** - 来源、简述、引用文献等
- ✅ **拖拽上传** - 支持拖拽文件上传
- ✅ **进度显示** - 上传进度实时反馈

### 后台管理功能

#### 1. 管理仪表盘
- ✅ **统计总览** - 数据集、案例集、下载量统计
- ✅ **分类分布** - 可视化图表展示
- ✅ **快速入口** - 待审核项目快速访问

#### 2. 内容审核
- ✅ **审核工作流** - 上传 → 待审核 → 批准/拒绝
- ✅ **状态管理** - 可见性、精选、预览等状态切换
- ✅ **批量操作** - 批量审核、删除

#### 3. 关系管理
- ✅ **可视化编辑** - 图形化管理数据集与案例集关系
- ✅ **批量创建** - 一次性创建多个关联
- ✅ **关系删除** - 移除不相关的关联

#### 4. 账号管理
- ✅ **管理员管理** - 创建、删除管理员账号
- ✅ **JWT 认证** - 安全的身份验证机制
- ✅ **密码加密** - bcrypt 加密存储

---

## 🛠 技术栈

### 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **Bun** | 1.0+ | 高性能 JavaScript 运行时 |
| **Express** | 4.18+ | Web 应用框架 |
| **TypeScript** | 5.3+ | 类型安全的开发语言 |
| **Prisma** | 5.7+ | 现代化 ORM |
| **PostgreSQL** | 15+ | 关系型数据库 |
| **JWT** | 9.0+ | 身份验证 |
| **Multer** | 1.4+ | 文件上传处理 |
| **Archiver** | 7.0+ | ZIP 文件压缩 |
| **xlsx** | 0.18+ | Excel 文件处理 |

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 14+ | React 框架（SSR/SSG） |
| **React** | 18+ | UI 库 |
| **TypeScript** | 5.3+ | 类型安全 |
| **NextUI** | 2.6+ | UI 组件库 |
| **Tailwind CSS** | 3.3+ | 原子化 CSS |
| **SWR** | 2.2+ | 数据获取和缓存 |
| **Recharts** | 3.0+ | 图表可视化 |
| **react-force-graph-2d** | 1.29+ | 知识图谱 |
| **Framer Motion** | 12+ | 动画库 |

### 开发工具

- **Monorepo** - 前后端统一管理
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **PM2** - 进程管理（生产环境）
- **Nginx** - 反向代理（生产环境）

---

## 📁 项目结构

```
UCASS_DataShare/
├── apps/
│   ├── api-backend/              # 后端 API 服务
│   │   ├── src/
│   │   │   ├── config/           # 配置文件
│   │   │   │   ├── database.ts   # 数据库连接
│   │   │   │   └── env.ts        # 环境变量
│   │   │   ├── middleware/       # 中间件
│   │   │   │   ├── auth.ts       # 身份验证
│   │   │   │   ├── logger.ts     # 日志
│   │   │   │   └── errorHandler.ts
│   │   │   ├── routes/           # API 路由
│   │   │   │   ├── auth.ts       # 认证接口
│   │   │   │   ├── datasets.ts   # 数据集接口
│   │   │   │   ├── casestudies.ts # 案例集接口
│   │   │   │   ├── admin.ts      # 管理接口
│   │   │   │   └── relationships.ts # 关系接口
│   │   │   ├── seed.ts           # 种子数据
│   │   │   └── index.ts          # 入口文件
│   │   ├── prisma/
│   │   │   └── schema.prisma     # 数据库模型
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web-frontend/             # 前端 Web 应用
│       ├── app/
│       │   ├── (main)/           # 前台页面
│       │   │   ├── page.tsx      # 首页
│       │   │   ├── discover/     # 数据发现
│       │   │   ├── datasets/     # 数据集详情
│       │   │   ├── casestudies/  # 案例集列表
│       │   │   ├── upload/       # 上传数据集
│       │   │   ├── upload-casestudy/ # 上传案例集
│       │   │   └── explore/      # 知识图谱
│       │   ├── admin/            # 后台管理页面
│       │   │   ├── login/        # 登录
│       │   │   ├── dashboard/    # 仪表盘
│       │   │   ├── datasets/     # 数据集管理
│       │   │   ├── casestudies/  # 案例集管理
│       │   │   └── relationships/ # 关系管理
│       │   ├── layout.tsx        # 根布局
│       │   └── globals.css       # 全局样式
│       ├── components/           # 组件
│       ├── config/               # 配置
│       ├── lib/                  # 工具函数
│       ├── public/               # 静态资源
│       ├── package.json
│       ├── next.config.js
│       └── tailwind.config.js
│
├── scripts/                      # 工具脚本
│   ├── backup.sh                 # Linux 备份脚本
│   ├── restore.sh                # Linux 恢复脚本
│   ├── backup.bat                # Windows 备份脚本
│   ├── restore.bat               # Windows 恢复脚本
│   └── README.md                 # 脚本使用文档
│
├── uploads/                      # 文件上传目录
├── backups/                      # 备份目录
├── .gitignore
├── package.json                  # Monorepo 配置
├── 部署指南-宝塔面板.md          # 部署文档
└── README.md                     # 项目说明
```

---

## ⚙️ 环境要求

### 开发环境

- **Node.js** >= 18.0.0 或 **Bun** >= 1.0.0
- **PostgreSQL** >= 15.0
- **Git**
- 8GB+ RAM（推荐）
- 20GB+ 磁盘空间

### 生产环境

- **Ubuntu** 20.04+ 或其他 Linux 发行版
- **PostgreSQL** 15+
- **Nginx** (可选，用于反向代理)
- **PM2** (可选，用于进程管理)
- 16GB+ RAM（推荐）
- 100GB+ 磁盘空间

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-org/ucass-datashare.git
cd ucass-datashare
```

### 2. 安装依赖

#### 使用 Bun（推荐）

```bash
# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 安装项目依赖
bun install
```

#### 使用 npm

```bash
npm install
```

### 3. 配置数据库

#### 安装 PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
下载安装: https://www.postgresql.org/download/windows/

#### 创建数据库

```bash
# 连接到 PostgreSQL
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE ucass_datashare;
CREATE USER ucass_datashare WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ucass_datashare TO ucass_datashare;
\q
```

### 4. 配置环境变量

#### 后端配置

创建 `apps/api-backend/.env` 文件：

```env
# 数据库配置
DATABASE_URL="postgresql://ucass_datashare:your_secure_password@localhost:5432/ucass_datashare"

# 服务配置
PORT=30002
NODE_ENV=development

# JWT 密钥（生产环境请使用强随机密钥）
JWT_SECRET="your-secret-key-change-in-production"

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10737418240  # 10GB

# 管理员初始账号
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

#### 前端配置

创建 `apps/web-frontend/.env` 文件：

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
bun run db:generate

# 推送数据库 schema（创建表）
bun run db:push

# 初始化种子数据（创建管理员账号）
bun run db:seed
```

### 6. 启动开发服务器

#### 启动后端

```bash
cd apps/api-backend
bun run dev
```

后端服务将在 http://localhost:30002 启动

#### 启动前端

```bash
cd apps/web-frontend
bun run dev
```

前端应用将在 http://localhost:30001 启动

### 7. 访问应用

| 页面 | 地址 | 说明 |
|------|------|------|
| 首页 | http://localhost:30001 | 平台首页 |
| 数据发现 | http://localhost:30001/discover | 浏览数据集 |
| 案例集 | http://localhost:30001/casestudies | 浏览案例集 |
| 知识图谱 | http://localhost:30001/explore | 关系可视化 |
| 管理后台 | http://localhost:30001/admin/login | 管理员登录 |

### 8. 默认管理员账号

- **用户名**: `admin`
- **密码**: `admin123`

⚠️ **重要**: 首次登录后请立即修改密码！

---

## 📦 生产环境构建

### 构建后端

```bash
cd apps/api-backend
bun run build
```

### 构建前端

```bash
cd apps/web-frontend
bun run build
```

### 启动生产服务

#### 后端

```bash
cd apps/api-backend
bun start
```

#### 前端

```bash
cd apps/web-frontend
bun start
```

---

## 🌐 部署指南

### 方式 1: 宝塔面板部署（推荐）

详细步骤请参考：[部署指南-宝塔面板.md](./部署指南-宝塔面板.md)

**主要步骤：**
1. 安装宝塔面板
2. 安装 Bun、PostgreSQL、Nginx
3. 配置数据库和环境变量
4. 上传代码并构建
5. 配置 Nginx 反向代理
6. 使用 PM2 守护进程
7. 配置 SSL 证书

### 方式 2: 手动部署 (Ubuntu)

#### 1. 安装依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib

# 安装 Nginx
sudo apt install nginx

# 安装 PM2
npm install -g pm2
```

#### 2. 配置数据库

```bash
sudo -u postgres psql
CREATE DATABASE ucass_datashare;
CREATE USER ucass_datashare WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ucass_datashare TO ucass_datashare;
\q
```

#### 3. 上传代码

```bash
# 克隆到服务器
cd /var/www
git clone https://github.com/your-org/ucass-datashare.git
cd ucass-datashare

# 安装依赖
bun install

# 配置环境变量
cp apps/api-backend/.env.example apps/api-backend/.env
cp apps/web-frontend/.env.example apps/web-frontend/.env
# 编辑 .env 文件...

# 初始化数据库
cd apps/api-backend
bun run db:generate
bun run db:push
bun run db:seed

# 构建
cd ../..
bun run build
```

#### 4. 配置 PM2

```bash
# 启动后端
cd /var/www/ucass-datashare/apps/api-backend
pm2 start "bun src/index.ts" --name ucass-api

# 启动前端
cd /var/www/ucass-datashare/apps/web-frontend
pm2 start "bun start" --name ucass-web

# 保存配置
pm2 save
pm2 startup
```

#### 5. 配置 Nginx

创建 `/etc/nginx/sites-available/ucass-datashare`：

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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10G;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/ucass-datashare /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. 配置 SSL (可选)

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

---

## 💾 备份与恢复

项目提供了完整的一键备份和恢复脚本，支持 Windows 和 Linux。

### 备份

备份包含：
- PostgreSQL 数据库完整转储
- uploads/ 目录所有文件
- 备份元数据信息

#### Linux/Ubuntu

```bash
cd scripts
chmod +x backup.sh
./backup.sh
```

#### Windows

```cmd
cd scripts
backup.bat
```

### 恢复

#### Linux/Ubuntu

```bash
cd scripts
./restore.sh ucass_backup_20250110_143000
```

#### Windows

```cmd
cd scripts
restore.bat ucass_backup_20250110_143000
```

### 定时自动备份

#### Linux (cron)

```bash
# 每天凌晨 2 点自动备份
crontab -e
# 添加：
0 2 * * * cd /var/www/ucass-datashare && ./scripts/backup.sh >> /var/log/ucass-backup.log 2>&1
```

详细说明请参考：[scripts/README.md](./scripts/README.md)

---

## 📚 API 文档

### 认证接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 管理员登录 | 公开 |
| POST | `/api/auth/logout` | 管理员登出 | 需认证 |
| GET | `/api/auth/check` | 检查登录状态 | 需认证 |

### 数据集接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/datasets/public` | 获取公开数据集列表 | 公开 |
| GET | `/api/datasets/:id` | 获取数据集详情 | 公开 |
| POST | `/api/datasets/upload` | 上传数据集 | 公开 |
| GET | `/api/datasets/:id/preview/:fileId` | 预览数据文件 | 公开 |
| GET | `/api/datasets/:id/download/:fileId` | 下载单个文件 | 公开 |
| POST | `/api/datasets/:id/download/zip` | 批量下载（ZIP） | 公开 |
| GET | `/api/datasets/categories` | 获取分类列表 | 公开 |
| GET | `/api/datasets/stats` | 平台统计信息 | 公开 |

### 案例集接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/casestudies` | 获取案例集列表 | 公开 |
| GET | `/api/casestudies/:id` | 获取案例集详情 | 公开 |
| POST | `/api/casestudies/upload` | 上传案例集 | 公开 |
| GET | `/api/casestudies/:id/download` | 下载案例集（ZIP） | 公开 |

### 管理接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/admin/datasets` | 获取所有数据集 | 管理员 |
| PUT | `/api/admin/datasets/:id` | 更新数据集 | 管理员 |
| PUT | `/api/admin/datasets/:id/review` | 审核数据集 | 管理员 |
| DELETE | `/api/admin/datasets/:id` | 删除数据集 | 管理员 |
| GET | `/api/admin/casestudies` | 获取所有案例集 | 管理员 |
| PUT | `/api/admin/casestudies/:id` | 更新案例集 | 管理员 |
| DELETE | `/api/admin/casestudies/:id` | 删除案例集 | 管理员 |
| GET | `/api/admin/stats` | 获取统计数据 | 管理员 |

### 关系接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/relationships/graph` | 获取关系图数据 | 公开 |
| POST | `/api/relationships` | 创建关系 | 管理员 |
| DELETE | `/api/relationships/:id` | 删除关系 | 管理员 |

完整 API 文档：参考代码中的路由文件

---

## 🔧 配置说明

### 后端环境变量

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | - | ✅ |
| `PORT` | 服务端口 | 3001 | ❌ |
| `NODE_ENV` | 运行环境 | development | ❌ |
| `JWT_SECRET` | JWT 密钥 | - | ✅ |
| `UPLOAD_DIR` | 上传目录 | ./uploads | ❌ |
| `MAX_FILE_SIZE` | 最大文件大小（字节） | 1073741824 (1GB) | ❌ |
| `ADMIN_USERNAME` | 初始管理员用户名 | admin | ❌ |
| `ADMIN_PASSWORD` | 初始管理员密码 | admin123 | ❌ |

### 前端环境变量

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `NEXT_PUBLIC_API_URL` | API 基础地址 | http://localhost:30002 | ❌ |
| `PORT` | 服务端口 | 30001 | ❌ |

### 数据库 Schema

详细的数据库模型定义请参考：`apps/api-backend/prisma/schema.prisma`

**主要表：**
- `AdminUser` - 管理员用户
- `Dataset` - 数据集
- `DatasetFile` - 数据集文件
- `CaseStudy` - 案例集
- `CaseStudyFile` - 案例集文件
- `CaseStudyDataset` - 案例集与数据集关系

---

## 🐛 故障排除

### 常见问题

#### 1. 数据库连接失败

**错误信息:** `Error: Can't reach database server`

**解决方案:**
```bash
# 检查 PostgreSQL 是否运行
sudo systemctl status postgresql

# 启动 PostgreSQL
sudo systemctl start postgresql

# 检查连接
psql -h localhost -U ucass_datashare -d ucass_datashare
```

#### 2. 端口被占用

**错误信息:** `Error: listen EADDRINUSE: address already in use :::30002`

**解决方案:**
```bash
# 查找占用端口的进程
lsof -i :30002  # Linux/Mac
netstat -ano | findstr :30002  # Windows

# 杀死进程或更改 .env 中的 PORT
```

#### 3. Prisma 客户端未生成

**错误信息:** `Cannot find module '@prisma/client'`

**解决方案:**
```bash
cd apps/api-backend
bun run db:generate
```

#### 4. 前端构建失败

**错误信息:** `Type error: ...`

**解决方案:**
```bash
# 清理缓存
cd apps/web-frontend
rm -rf .next node_modules
bun install
bun run build
```

#### 5. 文件上传失败

**可能原因:**
- 文件超过大小限制
- 上传目录权限不足

**解决方案:**
```bash
# 增加上传大小限制（.env）
MAX_FILE_SIZE=10737418240  # 10GB

# 设置目录权限
chmod 755 uploads/
chown -R your-user:your-user uploads/
```

### 获取帮助

- 📖 查看 [部署指南](./部署指南-宝塔面板.md)
- 📖 查看 [备份文档](./scripts/README.md)
- 🐛 提交 Issue: [GitHub Issues](https://github.com/your-org/ucass-datashare/issues)

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 贡献流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范

- **代码风格**: 遵循 ESLint 和 Prettier 配置
- **提交信息**: 使用语义化提交信息
- **类型检查**: 确保 TypeScript 类型检查通过
- **测试**: 添加必要的测试（如有）

### 分支说明

- `main` - 主分支，稳定版本
- `develop` - 开发分支
- `feature/*` - 新功能分支
- `fix/*` - Bug 修复分支

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 👥 团队

**计算社会科学与国家治理实验室 (UCASS)**

---

## 🙏 致谢

本项目使用了以下优秀的开源项目：

- [Next.js](https://nextjs.org/) - React 框架
- [Bun](https://bun.sh/) - JavaScript 运行时
- [Prisma](https://www.prisma.io/) - ORM 工具
- [NextUI](https://nextui.org/) - UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Recharts](https://recharts.org/) - 图表库
- [react-force-graph](https://github.com/vasturiano/react-force-graph) - 图谱可视化

感谢所有贡献者！

---

## 📞 联系方式

- 项目地址: [GitHub](https://github.com/your-org/ucass-datashare)
- 邮箱: support@ucass.edu.cn
- 官网: https://ucass.edu.cn

---

<div align="center">

**[⬆ 回到顶部](#ucass-datashare)**

Made with ❤️ by UCASS Team

</div>
