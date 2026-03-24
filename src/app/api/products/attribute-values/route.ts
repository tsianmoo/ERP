import { NextRequest, NextResponse } from 'next/server';
import { attributeValuesApi } from '@/lib/java-backend-client';

// GET /api/products/attribute-values - 获取所有属性值
export async function GET() {
  try {
    const result = await attributeValuesApi.list();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('获取属性值列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/products/attribute-values - 创建属性值
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Java 后端期望 snake_case 字段名
    const javaRequest = {
      attribute_id: body.attributeId || body.attribute_id,
      name: body.name,
      code: body.code,
      parent_id: body.parentId || body.parent_id || null,
      sort_order: body.sortOrder || body.sort_order || 0,
    };

    const result = await attributeValuesApi.create(javaRequest);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error('创建属性值失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
