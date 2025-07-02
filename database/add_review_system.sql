-- Database Migration: Add Review System and Enhanced Metadata
-- Purpose: Support dataset upload with admin review workflow

-- Add new columns to datasets table for review system and enhanced metadata
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS description_markdown TEXT,
ADD COLUMN IF NOT EXISTS data_update_time DATE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;

-- Update existing data: move title to name and description to description_markdown
UPDATE datasets SET name = title WHERE name IS NULL;
UPDATE datasets SET description_markdown = description WHERE description_markdown IS NULL;

-- Add constraints for status field
ALTER TABLE datasets ADD CONSTRAINT check_dataset_status 
CHECK (status IN ('pending', 'approved', 'rejected', 'revision_required'));

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets(status);
CREATE INDEX IF NOT EXISTS idx_datasets_reviewed_by ON datasets(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_datasets_name ON datasets(name);

-- Update is_public logic: only approved datasets should be public
UPDATE datasets SET is_public = false WHERE status != 'approved';

-- Add trigger to automatically set is_public based on status
CREATE OR REPLACE FUNCTION update_dataset_public_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only approved datasets can be public
    IF NEW.status = 'approved' THEN
        NEW.is_public = true;
    ELSE
        NEW.is_public = false;
    END IF;
    
    -- Set reviewed_at timestamp when status changes to approved/rejected
    IF OLD.status != NEW.status AND NEW.status IN ('approved', 'rejected') THEN
        NEW.reviewed_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dataset_status_trigger
    BEFORE UPDATE ON datasets 
    FOR EACH ROW EXECUTE FUNCTION update_dataset_public_status();

-- Insert sample pending dataset for testing
INSERT INTO datasets (name, source, description_markdown, data_update_time, file_path, file_type, file_size, status, anonymous_id)
VALUES (
    '中国GDP数据集2023',
    'https://data.stats.gov.cn/',
    '# 中国GDP数据集

## 数据说明
本数据集包含2023年中国各省市的GDP数据，来源于国家统计局官方网站。

### 数据字段
- 省份名称
- GDP总量（亿元）
- 增长率（%）
- 人均GDP（元）

### 使用建议
适用于宏观经济分析、区域发展研究等场景。',
    '2023-12-31',
    '/uploads/china_gdp_2023.csv',
    'text/csv',
    1024000,
    'pending',
    'anon_' || substr(gen_random_uuid()::text, 1, 8)
) ON CONFLICT DO NOTHING;

-- Verification queries
SELECT 'Migration completed' as status;
SELECT name, source, status, created_at FROM datasets ORDER BY created_at DESC LIMIT 5; 