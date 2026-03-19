import { NextRequest, NextResponse } from 'next/server';
import { sizeGroupsApi } from '@/lib/java-backend-client';

// GET /api/products/size-groups - 获取所有尺码组
export async function GET() {
  try {
    const result = await sizeGroupsApi.list();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('获取尺码分组列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/products/size-groups - 创建尺码组
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const javaRequest = {
      name: body.name,
      code: body.code,
      codeLength: body.codeLength || 2,
      sortOrder: 0,
    };

    const result = await sizeGroupsApi.create(javaRequest);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('创建尺码分组失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
