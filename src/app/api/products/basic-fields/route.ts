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
      fieldName: body.fieldName,
      dbFieldName: body.dbFieldName,
      fieldType: body.fieldType,
      isRequired: body.isRequired || false,
      options: body.options,
      sortOrder: body.sortOrder || 0,
      enabled: body.enabled !== undefined ? body.enabled : true,
      groupId: body.group ? parseInt(body.group) : null,
      autoGenerate: body.autoGenerate || false,
      codeRuleId: body.codeRuleId,
      width: body.width || 100,
      columns: body.columns || 1,
      columnWidth: body.columnWidth || 1,
      spacing: body.spacing || 2,
      rowIndex: body.rowIndex || 1,
      newRow: body.newRow || false,
      groupSortOrder: body.groupSortOrder || 0,
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
