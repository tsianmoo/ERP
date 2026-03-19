import { NextRequest, NextResponse } from 'next/server';
import { productsApi } from '@/lib/java-backend-client';

// POST /api/products/batch-update - 批量更新商品属性
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await productsApi.batchUpdate(body);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
