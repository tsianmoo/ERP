import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/products/attribute-values - 获取所有属性值
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('product_attribute_values')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/products/attribute-values - 创建属性值
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    // 验证必填字段
    if (!body.attributeId || !body.name || !body.code) {
      return NextResponse.json(
        { error: '缺少必填字段：attributeId, name, code' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('product_attribute_values')
      .insert({
        attribute_id: body.attributeId,
        name: body.name,
        code: body.code,
        parent_id: body.parentId || null,
        sort_order: body.sortOrder || 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('添加属性值失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
