import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 常用词汇映射（中文到英文拼音）
const commonChineseMap: Record<string, string> = {
  '货号': 'product_code',
  '商品名称': 'product_name',
  '商品': 'product',
  '名称': 'name',
  '品牌': 'brand',
  '供应商': 'supplier',
  '颜色': 'color',
  '尺码': 'size',
  '规格': 'specification',
  '价格': 'price',
  '单价': 'unit_price',
  '数量': 'quantity',
  '库存': 'stock',
  '重量': 'weight',
  '长度': 'length',
  '宽度': 'width',
  '高度': 'height',
  '成本': 'cost',
  '折扣': 'discount',
  '分类': 'category',
  '类型': 'type',
  '状态': 'status',
  '备注': 'remark',
  '描述': 'description',
  '图片': 'image',
  '创建时间': 'created_at',
  '更新时间': 'updated_at',
  '生产厂家': 'manufacturer',
  '产地': 'origin',
  '材质': 'material',
  '款式': 'style',
  '系列': 'series',
  '季节': 'season',
  '年份': 'year',
  '款号': 'style_code',
  '条码': 'barcode',
  '上架时间': 'publish_date',
  '下架时间': 'unpublish_date',
  '零售价': 'retail_price',
  '批发价': 'wholesale_price',
  '建议零售价': 'msrp',
  '市场价': 'market_price',
}

// 自动生成数据库字段名
function generateDbFieldName(fieldName: string): string {
  if (!fieldName) return 'custom_field'
  
  let result = fieldName.trim()
  
  // 检查是否在常用映射表中
  for (const [chinese, english] of Object.entries(commonChineseMap)) {
    if (result === chinese) {
      return english
    }
    // 处理包含常用词的情况（如"商品名称" -> "product_name"）
    result = result.replace(new RegExp(chinese, 'g'), english)
  }
  
  // 转换为小写
  result = result.toLowerCase()
  
  // 将空格和特殊字符替换为下划线
  result = result.replace(/[\s\-–—]+/g, '_')
  
  // 只保留小写字母、数字和下划线
  result = result.replace(/[^a-z0-9_]/g, '_')
  
  // 将连续的下划线替换为单个下划线
  result = result.replace(/_{2,}/g, '_')
  
  // 去除开头和结尾的下划线
  result = result.replace(/^_+|_+$/g, '')
  
  // 确保不以数字开头
  if (/^[0-9]/.test(result)) {
    result = 'field_' + result
  }
  
  // 如果结果为空，使用默认值
  if (!result) {
    result = 'custom_field'
  }
  
  return result
}

// PUT /api/products/basic-fields/[id] - 更新基本字段
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    // 如果没有提供 db_field_name，则自动生成
    let dbFieldName = body.dbFieldName;
    if (!dbFieldName && body.fieldName) {
      dbFieldName = generateDbFieldName(body.fieldName);
    }

    const updateData: any = {
      field_name: body.fieldName,
      db_field_name: dbFieldName,
      field_type: body.fieldType,
      is_required: body.isRequired,
      options: body.options,
      updated_at: new Date().toISOString(),
    };

    // Only update if provided
    if (body.sortOrder !== undefined) {
      updateData.sort_order = body.sortOrder;
    }
    if (body.enabled !== undefined) {
      updateData.enabled = body.enabled;
    }
    if (body.group !== undefined) {
      updateData.group_id = body.group ? parseInt(body.group) : null;
    }
    if (body.autoGenerate !== undefined) {
      updateData.auto_generate = body.autoGenerate;
    }
    if (body.codeRuleId !== undefined) {
      updateData.code_rule_id = body.codeRuleId;
    }
    if (body.width !== undefined) {
      updateData.width = body.width;
    }
    if (body.columns !== undefined) {
      updateData.columns = body.columns;
    }
    if (body.columnWidth !== undefined) {
      updateData.column_width = body.columnWidth;
    }
    if (body.spacing !== undefined) {
      updateData.spacing = body.spacing;
    }
    if (body.rowIndex !== undefined) {
      updateData.row_index = body.rowIndex;
    }
    if (body.newRow !== undefined) {
      updateData.new_row = body.newRow;
    }
    if (body.groupSortOrder !== undefined) {
      updateData.group_sort_order = body.groupSortOrder;
    }

    const { data, error } = await client
      .from('product_basic_fields')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        product_field_groups (id, name)
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

// DELETE /api/products/basic-fields/[id] - 删除基本字段
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { error } = await client
      .from('product_basic_fields')
      .delete()
      .eq('id', id);

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
