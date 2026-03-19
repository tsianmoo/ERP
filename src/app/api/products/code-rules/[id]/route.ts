import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/products/code-rules/[id] - 获取单个编码规则
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await client
      .from('product_code_rules')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error || !data) {
      return NextResponse.json({ error: '规则不存在' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('获取编码规则失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// PUT /api/products/code-rules/[id] - 更新编码规则
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = {};
    if (body.ruleName !== undefined) updateData.rule_name = body.ruleName;
    if (body.elements !== undefined) updateData.elements = body.elements;
    if (body.barcodeElements !== undefined) updateData.barcode_elements = body.barcodeElements;
    if (body.barcodeEnabled !== undefined) updateData.barcode_enabled = body.barcodeEnabled;
    if (body.barcodeSuffix !== undefined) updateData.barcode_suffix = body.barcodeSuffix;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;

    const { data, error } = await client
      .from('product_code_rules')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('更新编码规则失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE /api/products/code-rules/[id] - 删除编码规则
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { error } = await client
      .from('product_code_rules')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除编码规则失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
