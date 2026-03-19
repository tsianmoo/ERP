import { NextRequest, NextResponse } from 'next/server';
import { supplierBasicFieldsApi } from '@/lib/java-backend-client';

// GET /api/suppliers/basic-fields - 获取所有供应商基本字段
export async function GET() {
  try {
    const result = await supplierBasicFieldsApi.list();
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST /api/suppliers/basic-fields - 创建供应商基本字段
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await supplierBasicFieldsApi.create(body);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
