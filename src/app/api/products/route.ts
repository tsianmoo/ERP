import { NextRequest, NextResponse } from 'next/server';
import { productsApi } from '@/lib/java-backend-client';

// GET /api/products - 获取商品列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || undefined;

    const result = await productsApi.list(page, pageSize, status);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('获取商品列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/products - 创建商品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 转换请求数据格式以匹配 Java 后端
    const javaRequest = {
      basicInfo: body.basicInfo,
      attributeValues: body.attributeValues,
      imageUrls: body.imageUrls,
      colors: body.colors,
      sizes: body.sizes,
      status: body.status,
    };

    const result = await productsApi.create(javaRequest);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('创建商品失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
