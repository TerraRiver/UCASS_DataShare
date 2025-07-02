-- UCASS DataShare Platform 数据库初始化脚本
-- 创建数据库（如果不存在）
-- CREATE DATABASE ucass_datashare;

-- 使用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户角色枚举类型
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    api_key UUID UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建数据集表
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tags TEXT[],
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    previewable BOOLEAN DEFAULT false,
    visualizable BOOLEAN DEFAULT false,
    analyzable BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_api_key ON users(api_key);
CREATE INDEX idx_datasets_uploader ON datasets(uploader_id);
CREATE INDEX idx_datasets_tags ON datasets USING GIN(tags);
CREATE INDEX idx_datasets_type ON datasets(file_type);
CREATE INDEX idx_datasets_created ON datasets(created_at);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为users表创建更新时间戳触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 为datasets表创建更新时间戳触发器
CREATE TRIGGER update_datasets_updated_at 
    BEFORE UPDATE ON datasets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 插入默认管理员用户（密码: admin123，实际使用时应该更改）
INSERT INTO users (username, email, password_hash, role, api_key) 
VALUES (
    'admin', 
    'admin@ucass.edu.cn', 
    '$2b$10$rQ7Q7Q7Q7Q7Q7Q7Q7Q7Q7O7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q', -- 需要在后端实际生成
    'admin',
    uuid_generate_v4()
) ON CONFLICT (username) DO NOTHING;

-- 创建文件上传目录相关的函数（用于验证文件路径）
CREATE OR REPLACE FUNCTION validate_file_path(file_path VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    -- 简单的文件路径验证逻辑
    RETURN file_path IS NOT NULL AND length(file_path) > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE users IS '用户表';
COMMENT ON TABLE datasets IS '数据集表';
COMMENT ON COLUMN users.api_key IS '用户的API访问密钥';
COMMENT ON COLUMN datasets.tags IS '数据集标签数组';
COMMENT ON COLUMN datasets.previewable IS '是否支持在线预览';
COMMENT ON COLUMN datasets.visualizable IS '是否支持数据可视化';
COMMENT ON COLUMN datasets.analyzable IS '是否支持数据分析'; 