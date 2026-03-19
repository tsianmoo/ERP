-- 图片分类表
CREATE TABLE IF NOT EXISTS image_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'manual', -- manual: 手动分类, attribute: 按商品属性分类
  attribute_code VARCHAR(50), -- 如果是属性分类，存储属性代码
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 图片表
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  category_id INTEGER REFERENCES image_categories(id) ON DELETE SET NULL,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_images_category_id ON images(category_id);
CREATE INDEX IF NOT EXISTS idx_image_categories_type ON image_categories(type);

-- 添加注释
COMMENT ON TABLE image_categories IS '图片分类表';
COMMENT ON TABLE images IS '图片表';
COMMENT ON COLUMN image_categories.type IS '分类类型: manual-手动分类, attribute-按商品属性分类';
COMMENT ON COLUMN image_categories.attribute_code IS '属性分类对应的属性代码';
