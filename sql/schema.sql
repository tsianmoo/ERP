-- ============================================================
-- 服装ERP系统数据库DDL
-- 生成时间: 2026-03-26
-- 数据库: PostgreSQL
-- ============================================================

-- ============================================================
-- 一、商品管理相关表
-- ============================================================

-- 1. 商品主表
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(64) UNIQUE,
    product_name VARCHAR(256),
    basic_info JSONB,
    attribute_values JSONB,
    image_urls JSONB,
    status VARCHAR(32) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE,
    colors_data JSONB DEFAULT '[]'::jsonb,
    sizes_data JSONB DEFAULT '[]'::jsonb
);

COMMENT ON TABLE products IS '商品主表';
COMMENT ON COLUMN products.product_code IS '商品编码';
COMMENT ON COLUMN products.product_name IS '商品名称';
COMMENT ON COLUMN products.basic_info IS '基本信息JSON';
COMMENT ON COLUMN products.attribute_values IS '属性值JSON';
COMMENT ON COLUMN products.status IS '状态: active-启用, inactive-停用';

-- 2. 商品基本信息字段配置表
CREATE TABLE IF NOT EXISTS product_basic_fields (
    id SERIAL PRIMARY KEY,
    field_name VARCHAR(128) NOT NULL,
    display_name VARCHAR(100),
    field_type VARCHAR(32) NOT NULL,
    field_code VARCHAR(64),
    db_field_name VARCHAR(100) UNIQUE,
    is_required BOOLEAN DEFAULT false,
    default_value VARCHAR(50),
    options JSONB,
    sort_order INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    width INTEGER DEFAULT 100,
    columns INTEGER DEFAULT 1,
    column_width INTEGER DEFAULT 1,
    spacing INTEGER DEFAULT 2,
    row_index INTEGER DEFAULT 1,
    new_row BOOLEAN DEFAULT false,
    group_sort_order INTEGER DEFAULT 0,
    group_id INTEGER,
    group_name VARCHAR(64),
    auto_generate BOOLEAN DEFAULT false,
    code_rule_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE product_basic_fields IS '商品基本信息字段配置';
COMMENT ON COLUMN product_basic_fields.field_type IS '字段类型: text, number, select, boolean, date等';
COMMENT ON COLUMN product_basic_fields.auto_generate IS '是否自动生成编码';

-- 3. 商品字段分组表
CREATE TABLE IF NOT EXISTS product_field_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE product_field_groups IS '商品字段分组表';

-- 4. 商品属性表
CREATE TABLE IF NOT EXISTS product_attributes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    attribute_code VARCHAR(32),
    code_length INTEGER DEFAULT 2,
    sort_order INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    width INTEGER DEFAULT 100,
    columns INTEGER DEFAULT 1,
    column_width INTEGER DEFAULT 1,
    spacing INTEGER DEFAULT 2,
    row_index INTEGER DEFAULT 1,
    new_row BOOLEAN DEFAULT false,
    group_sort_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    group_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE product_attributes IS '商品属性表(品牌、年份、季节等)';
COMMENT ON COLUMN product_attributes.code_length IS '编码长度';

-- 5. 商品属性分组表
CREATE TABLE IF NOT EXISTS product_attribute_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE product_attribute_groups IS '商品属性分组表';

-- 6. 商品属性值表
CREATE TABLE IF NOT EXISTS product_attribute_values (
    id SERIAL PRIMARY KEY,
    attribute_id INTEGER NOT NULL,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(32) NOT NULL,
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE product_attribute_values IS '商品属性值表';

-- 7. 颜色组表
CREATE TABLE IF NOT EXISTS color_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    group_code VARCHAR(8),
    color VARCHAR(7) DEFAULT '#3B82F6',
    sort_order INTEGER DEFAULT 0,
    code_length INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE color_groups IS '颜色组表';
COMMENT ON COLUMN color_groups.color IS '颜色组显示颜色(HEX格式)';

-- 8. 颜色值表
CREATE TABLE IF NOT EXISTS color_values (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    name VARCHAR(64) NOT NULL,
    code VARCHAR(32) NOT NULL,
    hex_code VARCHAR(7),
    transparency INTEGER DEFAULT 10,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE color_values IS '颜色值表';
COMMENT ON COLUMN color_values.hex_code IS '颜色十六进制代码';
COMMENT ON COLUMN color_values.transparency IS '透明度(0-100)';

-- 9. 尺码组表
CREATE TABLE IF NOT EXISTS size_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    code_length INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE size_groups IS '尺码组表';

-- 10. 尺码值表
CREATE TABLE IF NOT EXISTS size_values (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    name VARCHAR(32) NOT NULL,
    code VARCHAR(32) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE size_values IS '尺码值表';

-- 11. 商品SKU表
CREATE TABLE IF NOT EXISTS product_skus (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    color_id BIGINT NOT NULL,
    size_id BIGINT NOT NULL,
    sku_code VARCHAR(100),
    barcode VARCHAR(100) UNIQUE,
    style_code VARCHAR(100),
    factory_color_code VARCHAR(100),
    color_alias VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    cost_price NUMERIC(10,2),
    retail_price NUMERIC(10,2),
    supplier_id BIGINT,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE product_skus IS '商品SKU表';
COMMENT ON COLUMN product_skus.sku_code IS 'SKU编码';
COMMENT ON COLUMN product_skus.barcode IS '条形码';

-- 12. 商品变体表(旧版)
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    sku_code VARCHAR(64) NOT NULL,
    barcode VARCHAR(64) UNIQUE NOT NULL,
    color_id INTEGER NOT NULL,
    size_id INTEGER NOT NULL,
    price INTEGER,
    cost INTEGER,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE product_variants IS '商品变体表(旧版)';

-- ============================================================
-- 二、商品编码规则相关表
-- ============================================================

-- 1. 编码规则表(旧版)
CREATE TABLE IF NOT EXISTS code_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_template TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE code_rules IS '编码规则表(旧版)';

-- 2. 商品编码规则表(新版)
CREATE TABLE IF NOT EXISTS product_code_rules (
    id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    barcode_enabled BOOLEAN DEFAULT false,
    barcode_suffix VARCHAR(50),
    barcode_elements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE product_code_rules IS '商品编码规则表';
COMMENT ON COLUMN product_code_rules.elements IS '编码元素配置JSON';
COMMENT ON COLUMN product_code_rules.barcode_enabled IS '是否启用条码';
COMMENT ON COLUMN product_code_rules.barcode_elements IS '条码元素配置JSON';

-- 3. 商品编码历史表
CREATE TABLE IF NOT EXISTS product_code_history (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(255) UNIQUE NOT NULL,
    product_id INTEGER,
    db_field_name VARCHAR(255) NOT NULL,
    code_rule_id INTEGER NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE product_code_history IS '商品编码历史表';

-- 4. 商品编码序列号表(旧版)
CREATE TABLE IF NOT EXISTS product_code_sequences (
    id SERIAL PRIMARY KEY,
    date_key VARCHAR(8) UNIQUE NOT NULL,
    sequence_value VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE product_code_sequences IS '商品编码序列号表(旧版)';

-- 5. 商品编码序列号表(新版)
CREATE TABLE IF NOT EXISTS product_code_sequences_new (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL,
    prefix_key VARCHAR(255) NOT NULL,
    current_sequence INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rule_id, prefix_key)
);

COMMENT ON TABLE product_code_sequences_new IS '商品编码序列号表(新版)-支持按前缀独立计数';
COMMENT ON COLUMN product_code_sequences_new.prefix_key IS '编码前缀(用于区分不同系列)';
COMMENT ON COLUMN product_code_sequences_new.current_sequence IS '当前序列号';

-- ============================================================
-- 三、供应商管理相关表
-- ============================================================

-- 1. 供应商主表
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    supplier_code VARCHAR(64) UNIQUE NOT NULL,
    supplier_name VARCHAR(256) NOT NULL,
    basic_info JSONB,
    status VARCHAR(32) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE suppliers IS '供应商主表';
COMMENT ON COLUMN suppliers.supplier_code IS '供应商编码';
COMMENT ON COLUMN suppliers.supplier_name IS '供应商名称';
COMMENT ON COLUMN suppliers.status IS '状态: active-启用, inactive-停用';

-- 2. 供应商基本信息字段配置表
CREATE TABLE IF NOT EXISTS supplier_basic_fields (
    id SERIAL PRIMARY KEY,
    field_name VARCHAR(128) NOT NULL,
    display_name VARCHAR(255),
    field_code VARCHAR(64) UNIQUE NOT NULL,
    field_type VARCHAR(32) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    default_value TEXT,
    options JSONB,
    sort_order INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    width INTEGER DEFAULT 100,
    columns INTEGER DEFAULT 1,
    column_width INTEGER DEFAULT 1,
    spacing INTEGER DEFAULT 2,
    row_index INTEGER DEFAULT 1,
    new_row BOOLEAN DEFAULT false,
    group_sort_order INTEGER DEFAULT 0,
    group_id INTEGER,
    group_name VARCHAR(100),
    auto_generate BOOLEAN DEFAULT false,
    code_rule_id INTEGER,
    linked_product_attribute_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE supplier_basic_fields IS '供应商基本信息字段配置';
COMMENT ON COLUMN supplier_basic_fields.auto_generate IS '是否自动生成编码';
COMMENT ON COLUMN supplier_basic_fields.linked_product_attribute_id IS '关联的商品属性ID';

-- 3. 供应商字段分组表
CREATE TABLE IF NOT EXISTS supplier_field_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE supplier_field_groups IS '供应商字段分组表';

-- 4. 供应商属性表
CREATE TABLE IF NOT EXISTS supplier_attributes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    attribute_code VARCHAR(50),
    field_type VARCHAR(20) DEFAULT 'single_select',
    code_length INTEGER DEFAULT 2,
    sort_order INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    width INTEGER DEFAULT 100,
    columns INTEGER DEFAULT 1,
    column_width INTEGER DEFAULT 1,
    spacing INTEGER DEFAULT 2,
    row_index INTEGER DEFAULT 1,
    new_row BOOLEAN DEFAULT false,
    group_sort_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    group_id INTEGER,
    linked_product_attribute_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE supplier_attributes IS '供应商属性表(供应商类型、分类等)';
COMMENT ON COLUMN supplier_attributes.field_type IS '字段类型: single_select, text';

-- 5. 供应商属性分组表
CREATE TABLE IF NOT EXISTS supplier_attribute_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE supplier_attribute_groups IS '供应商属性分组表';

-- 6. 供应商属性值表
CREATE TABLE IF NOT EXISTS supplier_attribute_values (
    id SERIAL PRIMARY KEY,
    attribute_id INTEGER NOT NULL,
    value_name VARCHAR(100) NOT NULL,
    value_code VARCHAR(50) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(attribute_id, value_code)
);

COMMENT ON TABLE supplier_attribute_values IS '供应商属性值表';

-- 7. 供应商编码规则表
CREATE TABLE IF NOT EXISTS supplier_code_rules (
    id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE supplier_code_rules IS '供应商编码规则表';
COMMENT ON COLUMN supplier_code_rules.elements IS '编码元素配置JSON';

-- 8. 供应商编码序列号表
CREATE TABLE IF NOT EXISTS supplier_code_sequences (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL,
    prefix_key VARCHAR(255) NOT NULL,
    current_sequence INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rule_id, prefix_key)
);

COMMENT ON TABLE supplier_code_sequences IS '供应商编码序列号表-支持按前缀独立计数';

-- ============================================================
-- 四、图片管理相关表
-- ============================================================

-- 1. 图片分类表
CREATE TABLE IF NOT EXISTS image_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'manual',
    attribute_code VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE image_categories IS '图片分类表';
COMMENT ON COLUMN image_categories.type IS '类型: manual-手动, auto-自动';

-- 2. 图片表
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    category_id INTEGER,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE images IS '图片表';

-- ============================================================
-- 五、系统相关表
-- ============================================================

-- 健康检查表
CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE health_check IS '健康检查表';

-- ============================================================
-- 六、外键约束
-- ============================================================

-- 商品相关外键
ALTER TABLE product_basic_fields 
    ADD CONSTRAINT product_basic_fields_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES product_field_groups(id);

ALTER TABLE product_attributes 
    ADD CONSTRAINT product_attributes_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES product_attribute_groups(id);

ALTER TABLE product_attribute_values 
    ADD CONSTRAINT product_attribute_values_attribute_id_product_attributes_id_fk 
    FOREIGN KEY (attribute_id) REFERENCES product_attributes(id);

ALTER TABLE product_attribute_values 
    ADD CONSTRAINT product_attribute_values_parent_id_product_attribute_values_id_ 
    FOREIGN KEY (parent_id) REFERENCES product_attribute_values(id);

ALTER TABLE color_values 
    ADD CONSTRAINT color_values_group_id_color_groups_id_fk 
    FOREIGN KEY (group_id) REFERENCES color_groups(id);

ALTER TABLE size_values 
    ADD CONSTRAINT size_values_group_id_size_groups_id_fk 
    FOREIGN KEY (group_id) REFERENCES size_groups(id);

ALTER TABLE product_skus 
    ADD CONSTRAINT product_skus_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id);

ALTER TABLE product_skus 
    ADD CONSTRAINT product_skus_color_id_fkey 
    FOREIGN KEY (color_id) REFERENCES color_values(id);

ALTER TABLE product_skus 
    ADD CONSTRAINT product_skus_size_id_fkey 
    FOREIGN KEY (size_id) REFERENCES size_values(id);

ALTER TABLE product_variants 
    ADD CONSTRAINT product_variants_product_id_products_id_fk 
    FOREIGN KEY (product_id) REFERENCES products(id);

ALTER TABLE product_variants 
    ADD CONSTRAINT product_variants_color_id_color_values_id_fk 
    FOREIGN KEY (color_id) REFERENCES color_values(id);

ALTER TABLE product_variants 
    ADD CONSTRAINT product_variants_size_id_size_values_id_fk 
    FOREIGN KEY (size_id) REFERENCES size_values(id);

ALTER TABLE product_code_history 
    ADD CONSTRAINT fk_product 
    FOREIGN KEY (product_id) REFERENCES products(id);

ALTER TABLE product_code_history 
    ADD CONSTRAINT fk_code_rule 
    FOREIGN KEY (code_rule_id) REFERENCES code_rules(id);

-- 供应商相关外键
ALTER TABLE supplier_basic_fields 
    ADD CONSTRAINT supplier_basic_fields_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES supplier_field_groups(id);

ALTER TABLE supplier_attributes 
    ADD CONSTRAINT supplier_attributes_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES supplier_attribute_groups(id);

ALTER TABLE supplier_attribute_values 
    ADD CONSTRAINT supplier_attribute_values_attribute_id_fkey 
    FOREIGN KEY (attribute_id) REFERENCES supplier_attributes(id);

-- 图片相关外键
ALTER TABLE images 
    ADD CONSTRAINT images_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES image_categories(id);

-- ============================================================
-- 七、索引
-- ============================================================

-- 商品相关索引
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_product_basic_fields_group_id ON product_basic_fields(group_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_group_id ON product_attributes(group_id);
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_attribute_id ON product_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_color_values_group_id ON color_values(group_id);
CREATE INDEX IF NOT EXISTS idx_size_values_group_id ON size_values(group_id);
CREATE INDEX IF NOT EXISTS idx_product_skus_product_id ON product_skus(product_id);

-- 供应商相关索引
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_supplier_basic_fields_group_id ON supplier_basic_fields(group_id);
CREATE INDEX IF NOT EXISTS idx_supplier_attributes_group_id ON supplier_attributes(group_id);
CREATE INDEX IF NOT EXISTS idx_supplier_attribute_values_attribute_id ON supplier_attribute_values(attribute_id);

-- 序列号索引
CREATE INDEX IF NOT EXISTS idx_product_code_sequences_new_rule_prefix ON product_code_sequences_new(rule_id, prefix_key);
CREATE INDEX IF NOT EXISTS idx_supplier_code_sequences_rule_prefix ON supplier_code_sequences(rule_id, prefix_key);

-- ============================================================
-- 八、初始化数据
-- ============================================================

-- 初始化健康检查数据
INSERT INTO health_check (updated_at) VALUES (now()) ON CONFLICT DO NOTHING;
