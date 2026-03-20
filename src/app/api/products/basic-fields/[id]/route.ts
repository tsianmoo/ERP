import { NextRequest, NextResponse } from 'next/server';
import { basicFieldsApi } from '@/lib/java-backend-client';

// PUT /api/products/basic-fields/[id] - 更新基本字段
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const javaRequest = {
      field_name: body.fieldName,
      display_name: body.displayName || body.fieldName,
      field_code: body.fieldCode,
      field_type: body.fieldType,
      is_required: body.isRequired,
      options: body.options,
      default_value: body.defaultValue,
      sort_order: body.sortOrder,
      enabled: body.enabled,
      group_id: body.group ? parseInt(body.group) : null,
      auto_generate: body.autoGenerate,
      code_rule_id: body.codeRuleId,
      width: body.width,
      columns: body.columns,
      column_width: body.columnWidth,
      spacing: body.spacing,
      row_index: body.rowIndex,
      new_row: body.newRow,
      group_sort_order: body.groupSortOrder,
    };

    const result = await basicFieldsApi.update(parseInt(id), javaRequest);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('更新字段失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/basic-fields/[id] - 删除基本字段
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await basicFieldsApi.delete(parseInt(id));

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除字段失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
