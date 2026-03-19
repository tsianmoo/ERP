import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/products/code-rules - 获取编码规则列表
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('product_code_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('获取编码规则失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST /api/products/code-rules - 创建编码规则
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('product_code_rules')
      .insert({
        rule_name: body.ruleName,
        elements: body.elements || [],
        barcode_elements: body.barcodeElements || [],
        barcode_enabled: body.barcodeEnabled ?? false,
        barcode_suffix: body.barcodeSuffix || '',
        is_active: body.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('创建编码规则失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
