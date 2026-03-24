import { NextRequest, NextResponse } from 'next/server';
import { supplierAttributesApi } from '@/lib/java-backend-client';

// PUT /api/suppliers/attributes/[id] - 更新属性
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    // Java 后端配置了 snake_case 命名策略，需要转换字段名
    const javaRequest: Record<string, any> = {};
    
    if (body.name !== undefined) javaRequest.name = body.name;
    if (body.code !== undefined) javaRequest.code = body.code;
    if (body.fieldCode !== undefined || body.attribute_code !== undefined) {
      javaRequest.attribute_code = body.fieldCode || body.attribute_code;
    }
    if (body.sortOrder !== undefined || body.sort_order !== undefined) {
      javaRequest.sort_order = body.sortOrder || body.sort_order;
    }
    if (body.codeLength !== undefined || body.code_length !== undefined) {
      javaRequest.code_length = body.codeLength || body.code_length;
    }
    if (body.enabled !== undefined) javaRequest.enabled = body.enabled;
    if (body.width !== undefined) javaRequest.width = body.width;
    if (body.columns !== undefined) javaRequest.columns = body.columns;
    if (body.columnWidth !== undefined || body.column_width !== undefined) {
      javaRequest.column_width = body.columnWidth || body.column_width;
    }
    if (body.spacing !== undefined) javaRequest.spacing = body.spacing;
    if (body.rowIndex !== undefined || body.row_index !== undefined) {
      javaRequest.row_index = body.rowIndex || body.row_index;
    }
    if (body.newRow !== undefined || body.new_row !== undefined) {
      javaRequest.new_row = body.newRow || body.new_row;
    }
    if (body.groupSortOrder !== undefined || body.group_sort_order !== undefined) {
      javaRequest.group_sort_order = body.groupSortOrder || body.group_sort_order;
    }
    if (body.isRequired !== undefined || body.is_required !== undefined) {
      javaRequest.is_required = body.isRequired || body.is_required;
    }
    if (body.group_id !== undefined || body.groupId !== undefined) {
      javaRequest.group_id = body.group_id || body.groupId;
    }
    if (body.fieldType !== undefined || body.field_type !== undefined) {
      javaRequest.field_type = body.fieldType || body.field_type;
    }
    if (body.linkedProductAttributeId !== undefined || body.linked_product_attribute_id !== undefined) {
      javaRequest.linked_product_attribute_id = body.linkedProductAttributeId || body.linked_product_attribute_id;
    }

    const result = await supplierAttributesApi.update(parsedId, javaRequest);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('更新属性失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE /api/suppliers/attributes/[id] - 删除属性
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    const result = await supplierAttributesApi.delete(parsedId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除属性失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
