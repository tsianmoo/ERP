import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// PUT /api/products/attributes/[id] - 更新属性配置
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    const { data, error } = await client
      .from('product_attributes')
      .update({
        name: body.name,
        code: body.code,
        sort_order: body.sortOrder !== undefined ? body.sortOrder : undefined,
        code_length: body.codeLength !== undefined ? body.codeLength : undefined,
        enabled: body.enabled !== undefined ? body.enabled : undefined,
        // Layout configuration
        width: body.width !== undefined ? body.width : undefined,
        columns: body.columns !== undefined ? body.columns : undefined,
        column_width: body.columnWidth !== undefined ? body.columnWidth : undefined,
        spacing: body.spacing !== undefined ? body.spacing : undefined,
        row_index: body.rowIndex !== undefined ? body.rowIndex : undefined,
        new_row: body.newRow !== undefined ? body.newRow : undefined,
        group_sort_order: body.groupSortOrder !== undefined ? body.groupSortOrder : undefined,
        is_required: body.isRequired !== undefined ? body.isRequired : undefined,
        group_id: body.group_id !== undefined ? body.group_id : undefined,
      })
      .eq('id', parsedId)
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

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/attributes/[id] - 删除属性配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    const { error } = await client
      .from('product_attributes')
      .delete()
      .eq('id', parsedId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
