import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/products/color-groups - 获取所有颜色组
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('color_groups')
      .select('*, color_values(*)')
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

// POST /api/products/color-groups - 创建颜色组
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('color_groups')
      .insert({
        name: body.name,
        code: body.code,
        code_length: body.codeLength || 2,
        color: body.color || '#3B82F6',
        sort_order: 0,
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
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
