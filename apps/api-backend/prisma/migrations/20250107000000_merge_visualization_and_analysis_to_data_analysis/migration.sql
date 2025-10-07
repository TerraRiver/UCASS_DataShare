-- 添加新的 enable_data_analysis 字段
ALTER TABLE "datasets" ADD COLUMN "enable_data_analysis" BOOLEAN NOT NULL DEFAULT false;

-- 合并旧字段的值：如果任一为 true，则新字段为 true
UPDATE "datasets" SET "enable_data_analysis" = ("enable_visualization" OR "enable_analysis");

-- 删除旧字段
ALTER TABLE "datasets" DROP COLUMN "enable_visualization";
ALTER TABLE "datasets" DROP COLUMN "enable_analysis";
