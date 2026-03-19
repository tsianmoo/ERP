import { NextRequest, NextResponse } from 'next/server';
import { productsApi } from '@/lib/java-backend-client';

// POST /api/products/draft - 保存商品草稿
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await productsApi.saveDraft(body);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// PUT /api/products/draft - 将草稿转为正式商品
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await productsApi.saveDraft(body);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
