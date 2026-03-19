import { NextRequest, NextResponse } from 'next/server';
import { attributesApi } from '@/lib/java-backend-client';

// GET /api/products/attributes - 获取所有属性配置
export async function GET() {
  try {
    const result = await attributesApi.list();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('获取属性列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/products/attributes - 创建属性配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const javaRequest = {
      name: body.name,
      code: body.code,
      attributeCode: body.attributeCode,
      sortOrder: body.sortOrder || 0,
      codeLength: body.codeLength || 2,
      enabled: body.enabled !== undefined ? body.enabled : true,
      width: body.width || 100,
      columns: body.columns || 1,
      columnWidth: body.columnWidth || 1,
      spacing: body.spacing || 2,
      rowIndex: body.rowIndex || 1,
      newRow: body.newRow || false,
      groupSortOrder: body.groupSortOrder || 0,
      isRequired: body.isRequired || false,
      groupId: body.group_id,
    };

    const result = await attributesApi.create(javaRequest);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('创建属性失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
