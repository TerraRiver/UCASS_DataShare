# UCASS DataShare - 人文社科数据分享平台

专为人文社科实验室设计的数据分享平台，促进学术研究数据的安全共享、规范管理和协作使用。

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd apps/api-backend
bun install
# 步骤1：确保.env文件配置正确
# 手动创建PostgreSQL数据库（如果尚未创建）
# 数据库名称 (Database Name): ucass_datashare
# 账号 (Username): ucass_datashare
# 密码 (Password): Ww2368963068
# DATABASE_URL="postgresql://ucass_datashare:Ww2368963068@localhost:5432/ucass_datashare"

# 步骤2：推送数据库schema（创建表）
bun run db:push

# 步骤3：生成Prisma客户端（可能有权限警告，但不影响功能）
bun run db:generate

# 步骤4：初始化种子数据
bun run db:seed

bun run build

bun start
```

### 2. 启动前端应用

```bash
cd apps/web-frontend
bun install
bun run build
bun start
```

### 4. 访问应用

- 前台首页: http://localhost:30001
- 数据发现: http://localhost:30001/discover
- 数据上传: http://localhost:30001/upload
- 管理后台: http://localhost:30001/admin/login

### 5. 测试账号

**管理员账号：**
- 用户名: `admin`
- 密码: `admin123`


