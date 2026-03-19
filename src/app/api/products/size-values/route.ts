import { NextRequest, NextResponse } from 'next/server';
import { sizeValuesApi } from '@/lib/java-backend-client';

// GET /api/products/size-values - 获取所有尺码值
export async function GET() {
  try {
    const result = await sizeValuesApi.list();
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST /api/products/size-values - 创建尺码值
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await sizeValuesApi.create(body);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
