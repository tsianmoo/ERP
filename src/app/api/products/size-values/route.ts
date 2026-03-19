import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST /api/products/size-values - 创建尺码值
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    if (!body.groupId || !body.name || !body.code) {
      return NextResponse.json(
        { error: '缺少必填字段：groupId, name, code' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('size_values')
      .insert({
        group_id: body.groupId,
        name: body.name,
        code: body.code,
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
    console.error('添加尺码值失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
