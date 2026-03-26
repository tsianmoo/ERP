import { NextRequest, NextResponse } from 'next/server';
import { suppliersApi } from '@/lib/java-backend-client';

// GET /api/suppliers/[id] - 获取单个供应商详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await suppliersApi.get(parseInt(id));

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }

    // 解包嵌套的 data.data 结构
    const data = result.data as any;
    if (data && data.data) {
      return NextResponse.json({ data: data.data });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('获取供应商详情失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// PUT /api/suppliers/[id] - 更新供应商
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    // 构建请求数据
    const requestData = {
      basic_info: {
        ...body.basicInfo,
        _attributes: body.attributes,
      },
    };

    const result = await suppliersApi.update(parseInt(id), requestData);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }

    // 解包嵌套的 data.data 结构
    const data = result.data as any;
    if (data && data.data) {
      return NextResponse.json({ data: data.data });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('更新供应商失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE /api/suppliers/[id] - 删除供应商
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await suppliersApi.delete(parseInt(id));

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除供应商失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
