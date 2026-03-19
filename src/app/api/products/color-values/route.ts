import { NextRequest, NextResponse } from 'next/server';
import { colorValuesApi } from '@/lib/java-backend-client';

// GET /api/products/color-values - 获取所有颜色值
export async function GET() {
  try {
    const result = await colorValuesApi.list();
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST /api/products/color-values - 创建颜色值
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await colorValuesApi.create(body);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
