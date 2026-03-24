import { NextRequest, NextResponse } from 'next/server';
import { supplierAttributeGroupsApi } from '@/lib/java-backend-client';

// PUT /api/suppliers/attribute-groups/[id] - 更新分组
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    const javaRequest = {
      name: body.name,
      sortOrder: body.sortOrder,
    };

    const result = await supplierAttributeGroupsApi.update(parsedId, javaRequest);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('更新分组失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE /api/suppliers/attribute-groups/[id] - 删除分组
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    const result = await supplierAttributeGroupsApi.delete(parsedId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除分组失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
