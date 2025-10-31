-- AlterTable - 添加 enable_data_analysis 字段
ALTER TABLE "datasets" ADD COLUMN "enable_data_analysis" BOOLEAN NOT NULL DEFAULT false;

-- 如果有数据，可以根据旧字段迁移（如果旧字段存在的话）
-- 但因为我们已经删除了旧字段，这里只是添加新字段
