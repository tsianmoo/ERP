import { NextRequest, NextResponse } from 'next/server';
import { supplierAttributesApi } from '@/lib/java-backend-client';

// 禁用缓存，确保数据实时性
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/suppliers/attributes - 获取所有属性
export async function GET() {
  try {
    const result = await supplierAttributesApi.list();
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    // 包装成 { data: [...] } 格式，与商品属性保持一致
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('获取属性列表失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST /api/suppliers/attributes - 创建属性
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Java 后端配置了 snake_case 命名策略，需要转换字段名
    const javaRequest = {
      name: body.name,
      code: body.fieldCode || body.code || body.name,
      attribute_code: body.fieldCode || body.attributeCode,
      sort_order: body.sortOrder || body.sort_order || 0,
      code_length: body.codeLength || body.code_length || 2,
      enabled: body.enabled !== undefined ? body.enabled : true,
      width: body.width || 100,
      columns: body.columns || 1,
      column_width: body.columnWidth || body.column_width || 1,
      spacing: body.spacing || 2,
      row_index: body.rowIndex || body.row_index || 1,
      new_row: body.newRow || body.new_row || false,
      group_sort_order: body.groupSortOrder || body.group_sort_order || 0,
      is_required: body.isRequired || body.is_required || false,
      group_id: body.group_id || body.groupId,
      field_type: body.fieldType || body.field_type || 'single_select',
      linked_product_attribute_id: body.linkedProductAttributeId || body.linked_product_attribute_id || null,
    };

    const result = await supplierAttributesApi.create(javaRequest);
    if (result.error) {
      // 解析唯一约束错误，给出更友好的提示
      if (result.error.includes('duplicate key value') && result.error.includes('uk_supplier_attributes_code')) {
        const codeMatch = result.error.match(/Key \(code\)=\(([^)]+)\)/);
        const duplicateCode = codeMatch ? codeMatch[1] : javaRequest.code;
        return NextResponse.json({ 
          error: `属性编码"${duplicateCode}"已存在，请修改属性名称或手动调整编码` 
        }, { status: 400 });
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    // 包装成 { data: ... } 格式
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error('创建属性失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
