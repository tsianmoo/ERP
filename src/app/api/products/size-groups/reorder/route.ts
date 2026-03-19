import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// PUT /api/products/size-groups/reorder - 批量更新尺码组排序
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '无效的排序数据' },
        { status: 400 }
      );
    }

    // 批量更新排序
    const updates = items.map((item: { id: number; sort_order: number }) =>
      client
        .from('size_groups')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新尺码组排序失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
