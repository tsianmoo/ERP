import { NextRequest, NextResponse } from 'next/server';
import { attributeValuesApi } from '@/lib/java-backend-client';

// PUT /api/products/attribute-values/[id] - 更新属性值
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // 转换字段名：camelCase -> snake_case
    const javaRequest = {
      name: body.name,
      code: body.code,
      parent_id: body.parentId,
      sort_order: body.sortOrder,
    };
    
    const result = await attributeValuesApi.update(parseInt(id), javaRequest);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE /api/products/attribute-values/[id] - 删除属性值
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await attributeValuesApi.delete(parseInt(id));
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
