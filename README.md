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

### 3. 数据库设置（使用pgAdmin4图形界面）

#### 步骤1: 启动PostgreSQL服务和pgAdmin4
```bash
# 确保PostgreSQL服务正在运行
# Windows: 在服务管理器中启动PostgreSQL服务
# 或使用命令: net start postgresql-x64-13 (版本号可能不同)

# 启动pgAdmin4
# 通常在开始菜单中找到pgAdmin4，或者浏览器访问 http://localhost:5050
```

#### 步骤2: 连接到PostgreSQL服务器
1. 打开pgAdmin4
2. 如果是首次使用，需要设置主密码
3. 右键点击 "Servers" → "Register" → "Server"
4. 填写连接信息：
   - **Name**: Local PostgreSQL
   - **Host**: localhost
   - **Port**: 5432
   - **Username**: postgres
   - **Password**: [您安装时设置的postgres密码]

#### 步骤3: 创建数据库用户
1. 在左侧导航栏展开服务器连接
2. 右键点击 "Login/Group Roles" → "Create" → "Login/Group Role"
3. 在 "General" 标签页：
   - **Name**: `ucass_datashare`
4. 在 "Definition" 标签页：
   - **Password**: `Ww2368963068` (或您想要的密码)
5. 在 "Privileges" 标签页：
   - 勾选 **Can login?**
   - 勾选 **Create databases?**
6. 点击 "Save"

#### 步骤4: 创建数据库
1. 右键点击 "Databases" → "Create" → "Database"
2. 在 "General" 标签页：
   - **Database**: `ucass_datashare`
   - **Owner**: `ucass_datashare`
3. 点击 "Save"

#### 步骤5: 初始化数据库结构

**⚠️ 重要提示：推荐使用 `database/init_clean.sql` 文件而不是 `init.sql`，该文件已修复编码和密码哈希问题。**

**方法1: 使用pgAdmin4 (推荐新手)**
1. 展开 `ucass_datashare` 数据库
2. 右键点击数据库名称 → "Query Tool"
3. 打开项目中的 `database/init_clean.sql` 文件
4. 复制所有内容到查询工具中
5. 点击 "Execute/Refresh" 按钮 (▶️) 运行SQL脚本

**方法2: 使用命令行 (推荐有经验用户)**
```bash
# 在项目根目录执行
psql -h localhost -U ucass_datashare -d ucass_datashare -f database/init_clean.sql
```

#### 步骤6: 验证数据库初始化
运行以下命令确保所有表和数据都正确创建：

```sql
-- 1. 查看所有表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- 2. 验证管理员用户是否创建成功
SELECT username, role, length(password_hash) as hash_length 
FROM users WHERE username = 'admin';

-- 3. 查看表结构
\d users
\d datasets  
\d operation_logs

-- 4. 验证触发器和函数
SELECT proname FROM pg_proc WHERE proname LIKE '%update_timestamp%';
```

**预期结果：**
- 应该看到3个表：`users`, `datasets`, `operation_logs`
- 管理员用户存在，hash_length应为60 (bcrypt哈希长度)
- 触发器函数 `update_updated_at` 存在

#### 步骤7: 测试管理员登录
初始化完成后，默认管理员账户信息：
- **用户名**: `admin`
- **密码**: `admin123`

**如果登录失败，请参考下方的故障排除部分。**

### 4. 环境配置

```bash
# 复制环境变量模板
cp apps/api-backend/env.example apps/api-backend/.env

# 编辑配置文件 (请根据您的环境修改)
# 配置数据库连接、JWT密钥等
```

重要配置项：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ucass_datashare
DB_USER=ucass_datashare
DB_PASSWORD=Ww2368963068

# JWT配置
JWT_SECRET=dev_secret_key_please_change_in_production
JWT_EXPIRES_IN=24h

# 服务器配置
PORT=3001
NODE_ENV=development

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100MB

# CORS配置
CORS_ORIGIN=http://localhost:3000 
```

### 5. 启动服务

```bash
# 终端1
cd apps/web-frontend
bun dev

# 终端2
cd apps/api-backend
bun dev

# 终端3
cd apps/python-service  
python main.py
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

## 🔧 故障排除

### 数据库相关问题

#### 问题1: 管理员登录失败 "用户名或密码错误"

**可能原因：**
- 密码哈希损坏或不正确
- 数据库表未正确初始化
- 密码验证逻辑错误

**解决方案：**

1. **验证管理员用户是否存在：**
```sql
SELECT username, role, length(password_hash) as hash_length 
FROM users WHERE username = 'admin';
```

2. **如果管理员不存在或密码哈希长度不是60，重新创建管理员：**
```bash
# 创建修复脚本
cat > fix_admin.js << 'EOF'
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function fixAdmin() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'ucass_datashare',
    user: 'ucass_datashare',
    password: 'Ww2368963068'  // 请替换为您的数据库密码
  });

  try {
    await client.connect();
    
    // 生成正确的密码哈希
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // 更新或插入管理员用户
    await client.query(
      `INSERT INTO users (id, username, password_hash, role, created_at, updated_at) 
       VALUES (gen_random_uuid(), 'admin', $1, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (username) DO UPDATE SET password_hash = $1, updated_at = CURRENT_TIMESTAMP`,
      [hashedPassword]
    );
    
    console.log('✅ 管理员密码修复成功！');
    console.log('用户名: admin');
    console.log('密码: admin123');
    
  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await client.end();
  }
}

fixAdmin();
EOF

# 安装依赖并运行修复脚本
bun install pg bcryptjs
bun run fix_admin.js
rm fix_admin.js
```

#### 问题2: 数据库连接失败

**检查连接配置：**
```bash
# 测试数据库连接
psql -h localhost -U ucass_datashare -d ucass_datashare -c "SELECT version();"
```

**常见解决方案：**
- 确认PostgreSQL服务正在运行
- 检查 `.env` 文件中的数据库配置
- 确认用户权限和密码正确

#### 问题3: 表不存在错误

**完全重置数据库：**
```sql
-- 连接到postgres数据库
\c postgres

-- 删除并重新创建数据库
DROP DATABASE IF EXISTS ucass_datashare;
CREATE DATABASE ucass_datashare OWNER ucass_datashare;

-- 重新执行初始化脚本
\c ucass_datashare
\i database/init_clean.sql
```

### 服务启动问题

#### 问题: 端口占用

```bash
# 查找占用端口的进程
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# macOS/Linux  
lsof -i :3001
lsof -i :3000

# 停止占用端口的进程 (Windows)
taskkill /PID <进程ID> /F
```

#### 问题: Bun 相关错误

```bash
# 重新安装依赖
rm -rf node_modules bun.lockb
bun install

# 清理缓存
bun pm cache rm --all

# 更新Bun
bun upgrade
```

### 前端访问问题

#### 问题: CORS 错误

确保 `.env` 文件中的CORS配置正确：
```env
CORS_ORIGIN=http://localhost:3000
```

#### 问题: API请求失败

1. 确认API服务在 http://localhost:3001 运行
2. 检查网络标签页的错误信息
3. 验证认证token是否有效

### 获取更多帮助

如果以上解决方案都无法解决问题：

1. **查看详细日志：**
```bash
# API后端日志
cd apps/api-backend && DEBUG=* bun dev

# 前端开发服务器日志  
cd apps/web-frontend && bun dev
```

2. **数据库查询日志：**
在 `.env` 中添加：
```env
DB_LOGGING=true
```

3. **提交Issue：**
请在GitHub仓库提交issue，包含：
- 错误信息截图
- 操作系统版本
- Bun/Node.js版本
- 数据库版本
- 详细的复现步骤

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 邮箱: support@ucass.edu.cn
- 项目主页: [GitHub Repository]

---

**UCASS DataShare Team** - 中国社会科学院大学
