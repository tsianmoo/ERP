-- 添加草稿相关字段到 products 表

-- 1. 添加 colors_data 字段（存储颜色数据）
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS colors_data JSONB DEFAULT '[]'::jsonb;

-- 2. 添加 sizes_data 字段（存储尺码数据）
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sizes_data JSONB DEFAULT '[]'::jsonb;

-- 3. 更新 status 字段注释（支持 draft 状态）
COMMENT ON COLUMN products.status IS '商品状态: active-已启用, draft-待启用(草稿), inactive-已停用';
