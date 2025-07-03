# UCASS DataShare - 人文社科数据分享平台

专为人文社科实验室设计的数据分享平台，促进学术研究数据的安全共享、规范管理和协作使用。

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd apps/api-backend
bun install
bunx prisma generate
bun run dev
```

### 2. 启动前端应用

```bash
cd apps/web-frontend
bun install
bun run dev
```

### 3. 创建管理员账号

```bash
cd apps/api-backend
bun run db:seed
```

### 4. 访问应用

- 前台首页: http://localhost:3000
- 数据发现: http://localhost:3000/discover
- 数据上传: http://localhost:3000/upload
- 管理后台: http://localhost:3000/admin/login

### 5. 测试账号

**管理员账号：**
- 用户名: `admin`
- 密码: `admin123`

## 📁 测试数据

根目录包含 `test-data.csv` 测试文件，可用于测试上传功能。

## 🔧 主要功能

### 用户功能
- ✅ 数据集上传（支持多种格式）
- ✅ 数据集发现和搜索
- ✅ 数据集详情查看
- ✅ 文件下载
- ✅ 学术引用格式生成

### 管理员功能
- ✅ 安全登录认证
- ✅ 数据集审核管理
- ✅ 平台统计信息
- ✅ 待审核列表管理

## 🛠️ 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: Express.js + TypeScript + Prisma
- **数据库**: PostgreSQL
- **包管理**: Bun
- **UI组件**: shadcn/ui

## 📋 开发进度

当前已完成阶段一MVP开发，包括完整的数据上传、审核、发现工作流。详见 [`开发方案.md`](./开发方案.md) 了解详细进度。

## 📞 联系我们

如有问题或建议，请联系项目团队。
