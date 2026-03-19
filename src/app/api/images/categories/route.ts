import { NextRequest, NextResponse } from 'next/server';
import { imageCategoriesApi } from '@/lib/java-backend-client';

// GET /api/images/categories - 获取所有图片分类
export async function GET() {
  try {
    const result = await imageCategoriesApi.list();
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST /api/images/categories - 创建图片分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await imageCategoriesApi.create(body);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
