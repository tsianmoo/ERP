import { pgTable, serial, timestamp, text, varchar, integer, boolean, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core"
import { sql, relations } from "drizzle-orm"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

// System table - must be kept
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// Product field groups
export const productFieldGroups = pgTable("product_field_groups", {
	id: serial().primaryKey(),
	name: varchar("name", { length: 64 }).notNull(), // 分组名称: "基本信息", "价格信息", "库存信息"
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("product_field_groups_sort_idx").on(table.sortOrder),
])

// Product basic fields configuration
export const productBasicFields = pgTable("product_basic_fields", {
	id: serial().primaryKey(),
	fieldName: varchar("field_name", { length: 128 }).notNull(),
	fieldCode: varchar("field_code", { length: 64 }).notNull().unique(),
	fieldType: varchar("field_type", { length: 32 }).notNull(), // text, number, select, boolean
	isRequired: boolean("is_required").default(false),
	options: jsonb("options"), // For select type: [{"label": "Yes", "value": "yes"}]
	sortOrder: integer("sort_order").default(0),
	enabled: boolean("enabled").default(true), // Whether this field is enabled for use
	groupId: integer("group_id").references(() => productFieldGroups.id, { onDelete: 'set null' }), // Foreign key to product_field_groups
	// Layout configuration for controlling display in product list and add/edit product pages
	width: integer("width").default(100), // Width percentage of parent container (1-100)
	columns: integer("columns").default(1), // Number of columns for form elements within this field (1-12)
	columnWidth: integer("column_width").default(1), // Width specification for each column (1-12)
	spacing: integer("spacing").default(2), // Spacing between form elements (0-5)
	rowIndex: integer("row_index").default(1), // Which row this field is in (1-N)
	newRow: boolean("new_row").default(false), // Whether this field should start on a new line
	groupSortOrder: integer("group_sort_order").default(0), // Sort order within the group
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("product_basic_fields_sort_idx").on(table.sortOrder),
	index("product_basic_fields_group_idx").on(table.groupId),
])

// Product attributes (brands, years, seasons, etc.)
export const productAttributes = pgTable("product_attributes", {
	id: serial().primaryKey(),
	name: varchar("name", { length: 64 }).notNull(), // 品牌, 年份, 季节, etc.
	code: varchar("code", { length: 32 }).notNull().unique(), // brand, year, season
	sortOrder: integer("sort_order").default(0),
	codeLength: integer("code_length").default(2), // Encoding length for SKU
	enabled: boolean("enabled").default(true), // Whether this attribute is enabled for use
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("product_attributes_sort_idx").on(table.sortOrder),
])

// Product attribute values
export const productAttributeValues = pgTable("product_attribute_values", {
	id: serial().primaryKey(),
	attributeId: integer("attribute_id").notNull().references(() => productAttributes.id, { onDelete: 'cascade' }),
	name: varchar("name", { length: 128 }).notNull(), // 培蒙, 金盾, 太平鸟, 2023, 2024
	code: varchar("code", { length: 32 }).notNull(), // PM, JD, TN, 23, 24
	parentId: integer("parent_id").references((): any => productAttributeValues.id, { onDelete: 'cascade' }), // For multi-level attributes
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("product_attribute_values_attr_idx").on(table.attributeId),
	index("product_attribute_values_parent_idx").on(table.parentId),
])

// Color groups (color systems)
export const colorGroups = pgTable("color_groups", {
	id: serial().primaryKey(),
	name: varchar("name", { length: 64 }).notNull(), // 红色系
	code: varchar("code", { length: 32 }).notNull().unique(),
	sortOrder: integer("sort_order").default(0),
	codeLength: integer("code_length").default(2),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("color_groups_sort_idx").on(table.sortOrder),
])

// Color values
export const colorValues = pgTable("color_values", {
	id: serial().primaryKey(),
	groupId: integer("group_id").notNull().references(() => colorGroups.id, { onDelete: 'cascade' }),
	name: varchar("name", { length: 64 }).notNull(), // 大红, 深红
	code: varchar("code", { length: 32 }).notNull(),
	transparency: integer("transparency").default(10), // 1-10
	hexCode: varchar("hex_code", { length: 7 }), // #FF0000
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("color_values_group_idx").on(table.groupId),
])

// Size groups
export const sizeGroups = pgTable("size_groups", {
	id: serial().primaryKey(),
	name: varchar("name", { length: 64 }).notNull(), // 男装尺码组
	code: varchar("code", { length: 32 }).notNull().unique(),
	sortOrder: integer("sort_order").default(0),
	codeLength: integer("code_length").default(2),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("size_groups_sort_idx").on(table.sortOrder),
])

// Size values
export const sizeValues = pgTable("size_values", {
	id: serial().primaryKey(),
	groupId: integer("group_id").notNull().references(() => sizeGroups.id, { onDelete: 'cascade' }),
	name: varchar("name", { length: 32 }).notNull(), // S, M, L, XL
	code: varchar("code", { length: 32 }).notNull(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("size_values_group_idx").on(table.groupId),
])

// SKU rules configuration
export const skuRules = pgTable("sku_rules", {
	id: serial().primaryKey(),
	ruleName: varchar("rule_name", { length: 128 }).notNull(),
	attributeCodes: jsonb("attribute_codes").notNull(), // ["brand", "year", "season"]
	useSequence: boolean("use_sequence").default(true),
	sequenceLength: integer("sequence_length").default(4),
	barcodeFormat: varchar("barcode_format", { length: 128 }).default("{skuCode}{colorCode}{sizeCode}"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
})

// Products main table
export const products = pgTable("products", {
	id: serial().primaryKey(),
	productCode: varchar("product_code", { length: 64 }).notNull().unique(), // Generated SKU
	productName: varchar("product_name", { length: 256 }).notNull(),
	basicInfo: jsonb("basic_info"), // Custom basic fields values
	attributeValues: jsonb("attribute_values"), // {brand: "PM", year: "2024", season: "SS"}
	imageUrls: jsonb("image_urls"), // ["url1", "url2"]
	status: varchar("status", { length: 32 }).default("active"), // active, inactive
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("products_code_idx").on(table.productCode),
	index("products_status_idx").on(table.status),
])

// Product variants (SKU + Color + Size)
export const productVariants = pgTable("product_variants", {
	id: serial().primaryKey(),
	productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
	skuCode: varchar("sku_code", { length: 64 }).notNull(), // Full SKU code
	barcode: varchar("barcode", { length: 64 }).notNull().unique(),
	colorId: integer("color_id").notNull().references(() => colorValues.id, { onDelete: 'restrict' }),
	sizeId: integer("size_id").notNull().references(() => sizeValues.id, { onDelete: 'restrict' }),
	price: integer("price"), // In cents
	cost: integer("cost"), // In cents
	stock: integer("stock").default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("product_variants_product_idx").on(table.productId),
	index("product_variants_sku_idx").on(table.skuCode),
	uniqueIndex("product_variants_unique_idx").on(table.productId, table.colorId, table.sizeId),
])

// Supplier basic fields configuration
export const supplierBasicFields = pgTable("supplier_basic_fields", {
	id: serial().primaryKey(),
	fieldName: varchar("field_name", { length: 128 }).notNull(),
	fieldCode: varchar("field_code", { length: 64 }).notNull().unique(),
	fieldType: varchar("field_type", { length: 32 }).notNull(),
	isRequired: boolean("is_required").default(false),
	options: jsonb("options"),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("supplier_basic_fields_sort_idx").on(table.sortOrder),
])

// Suppliers main table
export const suppliers = pgTable("suppliers", {
	id: serial().primaryKey(),
	supplierCode: varchar("supplier_code", { length: 64 }).notNull().unique(),
	supplierName: varchar("supplier_name", { length: 256 }).notNull(),
	basicInfo: jsonb("basic_info"), // Custom basic fields values
	status: varchar("status", { length: 32 }).default("active"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("suppliers_code_idx").on(table.supplierCode),
	index("suppliers_status_idx").on(table.status),
])

// Drizzle relations
export const productFieldGroupsRelations = relations(productFieldGroups, ({ many }) => ({
	fields: many(productBasicFields),
}))

export const productBasicFieldsRelations = relations(productBasicFields, ({ one }) => ({
	group: one(productFieldGroups, {
		fields: [productBasicFields.groupId],
		references: [productFieldGroups.id],
	}),
}))

// Zod schemas
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
	coerce: { date: true },
});

export const insertProductSchema = createCoercedInsertSchema(products).pick({
	productName: true,
	basicInfo: true,
	attributeValues: true,
	imageUrls: true,
	status: true,
});

export const updateProductSchema = createCoercedInsertSchema(products)
	.pick({
		productName: true,
		basicInfo: true,
		attributeValues: true,
		imageUrls: true,
		status: true,
	})
	.partial();

export const insertVariantSchema = createCoercedInsertSchema(productVariants).pick({
	productId: true,
	skuCode: true,
	barcode: true,
	colorId: true,
	sizeId: true,
	price: true,
	cost: true,
	stock: true,
});

export const updateVariantSchema = createCoercedInsertSchema(productVariants)
	.pick({
		price: true,
		cost: true,
		stock: true,
	})
	.partial();

export const insertSupplierSchema = createCoercedInsertSchema(suppliers).pick({
	supplierName: true,
	basicInfo: true,
	status: true,
});

export const updateSupplierSchema = createCoercedInsertSchema(suppliers)
	.pick({
		supplierName: true,
		basicInfo: true,
		status: true,
	})
	.partial();

// TypeScript types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertVariant = z.infer<typeof insertVariantSchema>;
export type UpdateVariant = z.infer<typeof updateVariantSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type UpdateSupplier = z.infer<typeof updateSupplierSchema>;
