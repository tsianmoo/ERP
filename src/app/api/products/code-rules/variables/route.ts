import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/products/code-rules/variables - 获取可用的编码变量
export async function GET() {
  try {
    const client = getSupabaseClient();
    
    // 获取基本信息字段
    const { data: basicFields } = await client
      .from('product_basic_fields')
      .select('db_field_name, field_name')
      .eq('enabled', true);

    // 获取属性字段
    const { data: attributes } = await client
      .from('product_attributes')
      .select('code, name')
      .eq('enabled', true);

    // 内置变量
    const builtInVariables = [
      { value: 'base_code', label: '基础货号', description: '商品的基础货号' },
      { value: 'color_code', label: '颜色编码', description: '所选颜色的编码' },
      { value: 'color_group_code', label: '色系编码', description: '所选颜色所属色系的编码' },
      { value: 'size_code', label: '尺码编码', description: '所选尺码的编码' },
      { value: 'size_group_code', label: '尺码组编码', description: '所选尺码所属尺码组的编码' },
      { value: 'year', label: '年份', description: '当前年份（后两位）' },
      { value: 'month', label: '月份', description: '当前月份（两位）' },
      { value: 'day', label: '日期', description: '当前日期（两位）' },
      { value: 'sequence', label: '流水号', description: '自动递增的流水号' },
    ];

    // 基本信息 field 变量
    const basicFieldVariables = (basicFields || []).map((field: any) => ({
      value: field.db_field_name,
      label: field.field_name,
      description: `基本信息字段：${field.field_name}`,
      type: 'basic_field',
    }));

    // 属性变量
    const attributeVariables = (attributes || []).map((attr: any) => ({
      value: attr.code,
      label: attr.name,
      description: `商品属性：${attr.name}`,
      type: 'attribute',
    }));

    return NextResponse.json({
      data: {
        builtIn: builtInVariables,
        basicFields: basicFieldVariables,
        attributes: attributeVariables,
      },
    });
  } catch (error) {
    console.error('获取编码变量失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
