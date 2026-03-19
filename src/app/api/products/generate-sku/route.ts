import { NextRequest, NextResponse } from 'next/server';
import { productsApi } from '@/lib/java-backend-client';

// 生成货号
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await productsApi.generateSku(body);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '生成货号失败，请重试' }, { status: 500 });
  }
}
