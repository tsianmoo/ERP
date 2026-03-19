import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/products/attributes - 获取所有属性配置
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('product_attributes')
      .select(`
        *,
        product_attribute_groups (id, name),
        product_attribute_values(*)
      `)
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

// POST /api/products/attributes - 创建属性配置
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('product_attributes')
      .insert({
        name: body.name,
        code: body.code,
        sort_order: body.sortOrder || 0,
        code_length: body.codeLength || 2,
        enabled: body.enabled !== undefined ? body.enabled : true,
        // Layout configuration
        width: body.width || 100,
        columns: body.columns || 1,
        column_width: body.columnWidth || 1,
        spacing: body.spacing || 2,
        row_index: body.rowIndex || 1,
        new_row: body.newRow || false,
        group_sort_order: body.groupSortOrder || 0,
        is_required: body.isRequired || false,
        group_id: body.group_id !== undefined && body.group_id !== null ? body.group_id : null,
      })
      .select(`
        *,
        product_attribute_groups (id, name),
        product_attribute_values(*)
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
