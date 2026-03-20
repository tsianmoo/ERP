import { NextRequest, NextResponse } from 'next/server';
import { basicFieldsApi } from '@/lib/java-backend-client';

// GET /api/products/basic-fields - 获取所有基本字段配置
export async function GET() {
  try {
    const result = await basicFieldsApi.list();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('获取字段列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/products/basic-fields - 创建基本字段
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const javaRequest = {
      field_name: body.fieldName,
      display_name: body.displayName || body.fieldName,
      field_code: body.fieldCode,
      field_type: body.fieldType,
      is_required: body.isRequired || false,
      options: body.options,
      sort_order: body.sortOrder || 0,
      enabled: body.enabled !== undefined ? body.enabled : true,
      group_id: body.group ? parseInt(body.group) : null,
      auto_generate: body.autoGenerate || false,
      code_rule_id: body.codeRuleId,
      width: body.width || 100,
      columns: body.columns || 1,
      column_width: body.columnWidth || 1,
      spacing: body.spacing || 2,
      row_index: body.rowIndex || 1,
      new_row: body.newRow || false,
      group_sort_order: body.groupSortOrder || 0,
    };

    const result = await basicFieldsApi.create(javaRequest);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('创建字段失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
