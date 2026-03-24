import { NextRequest, NextResponse } from 'next/server';
import { supplierAttributeValuesApi } from '@/lib/java-backend-client';

// 禁用缓存，确保数据实时性
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/suppliers/attribute-values - 获取所有属性值
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const attributeId = searchParams.get('attributeId');

    const result = attributeId 
      ? await supplierAttributeValuesApi.getByAttribute(parseInt(attributeId, 10))
      : await supplierAttributeValuesApi.list();
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    // 包装成 { data: [...] } 格式
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('获取属性值列表失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST /api/suppliers/attribute-values - 创建属性值
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const javaRequest = {
      valueName: body.value_name,
      valueCode: body.value_code,
      sortOrder: body.sort_order || 0,
      attributeId: body.attribute_id,
    };

    const result = await supplierAttributeValuesApi.create(javaRequest);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error('创建属性值失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
