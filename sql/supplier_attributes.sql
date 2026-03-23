-- 供应商属性分组表
CREATE TABLE IF NOT EXISTS supplier_attribute_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 供应商属性表
CREATE TABLE IF NOT EXISTS supplier_attributes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  attribute_code VARCHAR(50), -- 属性代码（用于数据存储）
  sort_order INTEGER DEFAULT 0,
  code_length INTEGER DEFAULT 2,
  enabled BOOLEAN DEFAULT TRUE,
  width INTEGER DEFAULT 100,
  columns INTEGER DEFAULT 1,
  column_width INTEGER DEFAULT 1,
  spacing INTEGER DEFAULT 2,
  row_index INTEGER DEFAULT 1,
  new_row BOOLEAN DEFAULT FALSE,
  group_sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT FALSE,
  group_id INTEGER REFERENCES supplier_attribute_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uk_supplier_attributes_code UNIQUE (code)
);

-- 供应商属性值表
CREATE TABLE IF NOT EXISTS supplier_attribute_values (
  id SERIAL PRIMARY KEY,
  value_name VARCHAR(100) NOT NULL,
  value_code VARCHAR(50) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  attribute_id INTEGER NOT NULL REFERENCES supplier_attributes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uk_supplier_attribute_values_code UNIQUE (attribute_id, value_code)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_supplier_attributes_group_id ON supplier_attributes(group_id);
CREATE INDEX IF NOT EXISTS idx_supplier_attribute_values_attribute_id ON supplier_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_supplier_attribute_groups_sort_order ON supplier_attribute_groups(sort_order);
CREATE INDEX IF NOT EXISTS idx_supplier_attributes_sort_order ON supplier_attributes(sort_order);

-- 添加注释
COMMENT ON TABLE supplier_attribute_groups IS '供应商属性分组表';
COMMENT ON TABLE supplier_attributes IS '供应商属性表';
COMMENT ON TABLE supplier_attribute_values IS '供应商属性值表';

COMMENT ON COLUMN supplier_attributes.code IS '属性编码（唯一标识）';
COMMENT ON COLUMN supplier_attributes.attribute_code IS '属性代码（用于数据存储）';
COMMENT ON COLUMN supplier_attributes.code_length IS '编码长度';
COMMENT ON COLUMN supplier_attributes.enabled IS '是否启用';
COMMENT ON COLUMN supplier_attributes.width IS '字段宽度';
COMMENT ON COLUMN supplier_attributes.columns IS '占用列数';
COMMENT ON COLUMN supplier_attributes.column_width IS '列宽';
COMMENT ON COLUMN supplier_attributes.spacing IS '间距';
COMMENT ON COLUMN supplier_attributes.row_index IS '行索引';
COMMENT ON COLUMN supplier_attributes.new_row IS '是否新起一行';
COMMENT ON COLUMN supplier_attributes.group_sort_order IS '分组排序';
COMMENT ON COLUMN supplier_attributes.is_required IS '是否必填';

COMMENT ON COLUMN supplier_attribute_values.value_name IS '属性值名称';
COMMENT ON COLUMN supplier_attribute_values.value_code IS '属性值代码';
