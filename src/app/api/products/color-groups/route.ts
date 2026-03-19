import { NextRequest, NextResponse } from 'next/server';
import { colorGroupsApi } from '@/lib/java-backend-client';

// GET /api/products/color-groups - 获取所有颜色组
export async function GET() {
  try {
    const result = await colorGroupsApi.list();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('获取颜色分组列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/products/color-groups - 创建颜色组
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const javaRequest = {
      name: body.name,
      code: body.code,
      codeLength: body.codeLength || 2,
      color: body.color || '#3B82F6',
      groupCode: body.groupCode,
      sortOrder: 0,
    };

    const result = await colorGroupsApi.create(javaRequest);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('创建颜色分组失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
