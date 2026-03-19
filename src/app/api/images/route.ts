import { NextRequest, NextResponse } from 'next/server';
import { imagesApi } from '@/lib/java-backend-client';

// GET /api/images - 获取所有图片
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    let result;
    if (categoryId) {
      result = await imagesApi.getByCategory(parseInt(categoryId));
    } else {
      result = await imagesApi.list();
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('获取图片列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/images - 创建图片记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const javaRequest = {
      name: body.name,
      url: body.url,
      categoryId: body.categoryId,
      fileSize: body.fileSize,
      width: body.width,
      height: body.height,
    };

    const result = await imagesApi.create(javaRequest);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('创建图片记录失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
