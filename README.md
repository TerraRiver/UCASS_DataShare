# UCASS DataShare - 社科大数据分享平台

中国社会科学院大学数据集分享与分析平台，提供数据存储、预览、可视化和分析功能。

## ⚡ 使用 Bun 构建

本项目使用 [Bun](https://bun.sh) 作为 JavaScript 运行时和包管理器，提供极快的安装速度和运行性能。

### 为什么选择 Bun？
- 🚀 **极快的包安装**：比 npm/yarn/pnpm 快 10-100 倍
- ⚡ **高性能运行时**：原生支持 TypeScript，无需编译
- 🔧 **内置工具**：包含测试运行器、打包器等
- 🪶 **轻量级**：单个二进制文件，体积小

## 🌟 项目特性

- **用户系统**: 支持注册、登录，区分管理员和普通用户权限
- **数据集管理**: 数据集上传、下载、预览和元数据管理  
- **在线预览**: 支持CSV、Excel等格式的在线数据预览
- **数据可视化**: 多种图表类型的交互式数据可视化
- **数据分析**: 基本的统计分析和相关性分析
- **API访问**: RESTful API支持，可生成个人API密钥
- **管理后台**: 完整的用户和数据集管理界面

## 🏗️ 技术架构

### 前端 (Next.js)
- **框架**: Next.js 14 + TypeScript
- **样式**: Tailwind CSS + Radix UI 组件
- **图表**: Recharts / Chart.js
- **状态管理**: React Hooks
- **API请求**: Axios

### 后端 (Node.js)
- **框架**: Express.js + TypeScript
- **数据库**: PostgreSQL
- **认证**: JWT + bcryptjs
- **文件上传**: Multer
- **安全**: Helmet + CORS + 速率限制

### Python服务 (FastAPI)
- **框架**: FastAPI
- **数据处理**: Pandas + NumPy  
- **可视化**: Plotly + Matplotlib + Seaborn
- **分析**: Scikit-learn

### 包管理
- **包管理**: Monorepo + Bun workspace

## 📁 项目结构

```
ucass-datashare/
├── apps/
│   ├── web-frontend/          # Next.js 前端应用
│   │   ├── app/              # App Router 页面
│   │   ├── components/       # 可复用组件  
│   │   └── lib/              # 工具函数和API
│   ├── api-backend/          # Node.js 后端API
│   │   ├── src/
│   │   │   ├── routes/       # API路由
│   │   │   ├── middleware/   # 中间件
│   │   │   ├── config/       # 配置文件
│   │   │   └── index.ts      # 入口文件
│   │   └── uploads/          # 文件上传目录
│   └── python-service/       # Python 数据服务
│       ├── app/              # FastAPI应用
│       ├── main.py           # 入口文件
│       └── requirements.txt  # Python依赖
├── packages/                 # 共享代码包
├── database/                 # 数据库脚本
│   └── init.sql             # 初始化SQL
├── package.json             # 根package.json
├── bunfig.toml              # Bun配置文件
└── bun.lockb               # Bun锁定文件
```

## 🚀 安装和使用

### 环境要求

- Node.js 18+ 或 Bun 1.0+
- Python 3.9+
- PostgreSQL 13+
- Bun 1.0+ (推荐) 或 npm/yarn

### 1. 安装 Bun

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# 或者使用 npm
npm install -g bun

# 验证安装
bun --version
```

### 2. 克隆和安装

```bash
# 克隆项目
git clone <repository-url>
cd ucass-datashare

# 安装所有依赖
bun install

# 安装Python依赖
cd apps/python-service
pip install -r requirements.txt
cd ../..
```

### 3. 数据库设置

```bash
# 启动 PostgreSQL 服务
# macOS (Homebrew): brew services start postgresql
# Ubuntu/Debian: sudo systemctl start postgresql
# Windows: 启动 PostgreSQL 服务

# 创建数据库
createdb ucass_datashare

# 初始化数据库结构
psql -d ucass_datashare -f database/init.sql
```

### 4. 环境配置

```bash
# 复制环境变量模板
cp apps/api-backend/env.example apps/api-backend/.env

# 编辑配置文件 (请根据您的环境修改)
# 配置数据库连接、JWT密钥等
```

重要配置项：
```env
# 数据库连接
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ucass_datashare
DB_USER=your_username
DB_PASSWORD=your_password

# JWT密钥 (生产环境请使用强密钥)
JWT_SECRET=your_super_secret_jwt_key

# 服务端口
PORT=3001
```

### 5. 启动服务

```bash
# 启动所有服务 (推荐)
bun dev

# 或者分别启动
bun --filter web-frontend dev      # 前端 (http://localhost:3000)
bun --filter api-backend dev       # 后端 (http://localhost:3001) 
cd apps/python-service && python main.py  # Python服务 (http://localhost:8000)
```

### 6. 访问应用

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001
- **Python服务**: http://localhost:8000
- **Python API文档**: http://localhost:8000/docs

## 📊 数据库设计

### 用户表 (users)
- `id`: UUID主键
- `username`: 用户名
- `email`: 邮箱
- `password_hash`: 加密密码
- `role`: 用户角色 (admin/user)
- `api_key`: API访问密钥

### 数据集表 (datasets)  
- `id`: UUID主键
- `name`: 数据集名称
- `description`: 描述
- `tags`: 标签数组
- `uploader_id`: 上传者ID
- `file_path`: 文件路径
- `file_size`: 文件大小
- `file_type`: 文件类型
- `previewable`: 是否可预览
- `visualizable`: 是否可可视化
- `analyzable`: 是否可分析

## 🔌 API 文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录  
- `GET /api/auth/me` - 获取当前用户信息

### 数据集接口
- `GET /api/datasets` - 获取数据集列表
- `GET /api/datasets/:id` - 获取数据集详情
- `POST /api/datasets` - 上传数据集 (管理员)
- `GET /api/datasets/:id/preview` - 预览数据
- `GET /api/datasets/:id/download` - 下载数据集
- `POST /api/datasets/:id/visualize` - 数据可视化
- `POST /api/datasets/:id/analyze` - 数据分析

### 用户管理接口 (管理员)
- `GET /api/users` - 获取用户列表
- `GET /api/users/:id` - 获取用户详情
- `PUT /api/users/:id/role` - 更新用户角色
- `DELETE /api/users/:id` - 删除用户

## 🛡️ 安全特性

- JWT身份认证
- 密码加密存储 (bcrypt)
- 请求速率限制
- CORS跨域控制
- 文件类型验证
- SQL注入防护
- XSS攻击防护

## 📈 生产部署

### 构建和启动

```bash
# 构建应用
bun build

# 启动生产服务
bun start
```

### 环境配置

- 设置生产数据库连接
- 配置强JWT密钥
- 设置文件上传路径
- 配置反向代理 (推荐使用Nginx)

## 🧪 测试

```bash
# 运行测试
bun test

# 前端测试
bun --filter web-frontend test

# 后端测试
bun --filter api-backend test

# Python测试
cd apps/python-service && python -m pytest
```

## 🔧 开发说明

### 代码风格
- 使用TypeScript严格模式
- 遵循ESLint规则
- 使用Prettier格式化代码

### 调试
```bash
# 前端调试
DEBUG=* bun --filter web-frontend dev

# 后端调试
NODE_ENV=development DEBUG=* bun --filter api-backend dev
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 邮箱: support@ucass.edu.cn
- 项目主页: [GitHub Repository]

---

**UCASS DataShare Team** - 中国社会科学院大学
