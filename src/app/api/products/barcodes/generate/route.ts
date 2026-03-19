import { NextRequest, NextResponse } from 'next/server';
import { productsApi } from '@/lib/java-backend-client';

/**
 * 生成商品条码
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await productsApi.generateBarcode(body);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '生成条码失败' }, { status: 500 });
  }
}

/**
 * 批量生成条码
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json({ error: '缺少 productId 参数' }, { status: 400 });
    }
    
    const result = await productsApi.generateBarcode({ productId });
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '批量生成条码失败' }, { status: 500 });
  }
}
