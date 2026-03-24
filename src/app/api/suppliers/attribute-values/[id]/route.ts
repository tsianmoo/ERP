import { NextRequest, NextResponse } from 'next/server';
import { supplierAttributeValuesApi } from '@/lib/java-backend-client';

// PUT /api/suppliers/attribute-values/[id] - 更新属性值
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    // Java 后端期望 snake_case 字段名
    const javaRequest = {
      name: body.name,
      code: body.code,
      sort_order: body.sortOrder || body.sort_order,
    };

    const result = await supplierAttributeValuesApi.update(parsedId, javaRequest);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('更新属性值失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE /api/suppliers/attribute-values/[id] - 删除属性值
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    const result = await supplierAttributeValuesApi.delete(parsedId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除属性值失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
