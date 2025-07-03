import bcrypt from 'bcryptjs';
import { prisma } from './config/database';
import { ENV } from './config/env';

async function main() {
  console.log('开始初始化数据库种子数据...');

  try {
    // 检查是否已存在管理员用户
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { username: ENV.ADMIN_USERNAME },
    });

    if (existingAdmin) {
      console.log(`管理员用户 "${ENV.ADMIN_USERNAME}" 已存在，跳过创建`);
      return;
    }

    // 创建默认管理员用户
    const hashedPassword = await bcrypt.hash(ENV.ADMIN_PASSWORD, 12);

    const adminUser = await prisma.adminUser.create({
      data: {
        username: ENV.ADMIN_USERNAME,
        passwordHash: hashedPassword,
      },
    });

    console.log(`✅ 成功创建管理员用户: ${adminUser.username}`);
    console.log(`📧 用户名: ${ENV.ADMIN_USERNAME}`);
    console.log(`🔑 密码: ${ENV.ADMIN_PASSWORD}`);
    console.log('⚠️  请在生产环境中立即更改默认密码！');

  } catch (error) {
    console.error('初始化种子数据失败:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
  }); 