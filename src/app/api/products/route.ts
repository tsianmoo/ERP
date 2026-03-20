import { NextRequest, NextResponse } from 'next/server';
import { productsApi } from '@/lib/java-backend-client';

// 将 camelCase 转换为 snake_case
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// 转换对象的所有键为 snake_case
function convertKeysToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToSnakeCase(item));
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key of Object.keys(obj)) {
      converted[toSnakeCase(key)] = convertKeysToSnakeCase(obj[key]);
    }
    return converted;
  }
  
  return obj;
}

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
    
    // 转换颜色数据为 snake_case 格式
    const convertedColors = body.colors ? convertKeysToSnakeCase(body.colors) : null;
    
    // 转换请求数据格式以匹配 Java 后端 (使用 snake_case 字段名)
    const javaRequest = {
      basic_info: body.basicInfo || null,
      attribute_values: body.attributeValues || null,
      image_urls: body.imageUrls || null,
      colors: convertedColors,
      sizes: body.sizes || null,
      status: body.status || null,
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
