import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePreviewableFiles() {
  try {
    console.log('开始更新文件的 isPreviewable 字段...');

    // 获取所有文件
    const allFiles = await prisma.datasetFile.findMany();
    console.log(`找到 ${allFiles.length} 个文件`);

    let updatedCount = 0;

    // 更新可预览的文件类型
    for (const file of allFiles) {
      const fileExt = file.fileType.toLowerCase();
      const isPreviewable = ['.csv', '.txt'].includes(fileExt);

      if (isPreviewable !== file.isPreviewable) {
        await prisma.datasetFile.update({
          where: { id: file.id },
          data: { isPreviewable }
        });
        updatedCount++;
        console.log(`更新文件: ${file.originalName} (${file.fileType}) -> isPreviewable: ${isPreviewable}`);
      }
    }

    console.log(`\n完成！共更新 ${updatedCount} 个文件`);
  } catch (error) {
    console.error('更新失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePreviewableFiles();
