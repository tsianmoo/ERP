import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/images - 获取图片列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    let query = client
      .from('images')
      .select(`
        *,
        image_categories (id, name)
      `)
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', parseInt(categoryId));
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

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

// POST /api/images - 上传图片
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('images')
      .insert({
        name: body.name,
        url: body.url,
        category_id: body.categoryId || null,
        file_size: body.fileSize || null,
        width: body.width || null,
        height: body.height || null,
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

// PUT /api/images - 更新图片信息
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('images')
      .update({
        name: body.name,
        category_id: body.categoryId,
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// DELETE /api/images - 删除图片
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '缺少图片ID' },
        { status: 400 }
      );
    }

    // 获取图片信息以便删除文件
    const { data: image } = await client
      .from('images')
      .select('url')
      .eq('id', parseInt(id))
      .single();

    // 删除数据库记录
    const { error } = await client
      .from('images')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // TODO: 删除存储的文件

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
