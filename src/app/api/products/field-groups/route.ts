import { NextRequest, NextResponse } from 'next/server';
import { fieldGroupsApi } from '@/lib/java-backend-client';

// GET /api/products/field-groups - 获取所有字段分组
export async function GET() {
  try {
    const result = await fieldGroupsApi.list();
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST /api/products/field-groups - 创建字段分组
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await fieldGroupsApi.create(body);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
