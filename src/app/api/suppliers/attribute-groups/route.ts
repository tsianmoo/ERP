import { NextRequest, NextResponse } from 'next/server';
import { supplierAttributeGroupsApi } from '@/lib/java-backend-client';

// 禁用缓存，确保数据实时性
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/suppliers/attribute-groups - 获取所有分组
export async function GET() {
  try {
    const result = await supplierAttributeGroupsApi.list();
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    // 包装成 { data: [...] } 格式
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('获取分组列表失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST /api/suppliers/attribute-groups - 创建分组
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const javaRequest = {
      name: body.name,
      sortOrder: body.sortOrder || 0,
    };
    const result = await supplierAttributeGroupsApi.create(javaRequest);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error('创建分组失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
