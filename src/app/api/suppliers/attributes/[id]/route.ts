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

    const javaRequest = {
      name: body.name,
      code: body.code,
      attributeCode: body.fieldCode || body.attributeCode,
      sortOrder: body.sortOrder,
      codeLength: body.codeLength,
      enabled: body.enabled,
      width: body.width,
      columns: body.columns,
      columnWidth: body.columnWidth,
      spacing: body.spacing,
      rowIndex: body.rowIndex,
      newRow: body.newRow,
      groupSortOrder: body.groupSortOrder,
      isRequired: body.isRequired,
      groupId: body.group_id,
    };

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
