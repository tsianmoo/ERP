import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/products/[id] - 获取单个商品详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    // 获取商品基本信息
    const { data: product, error } = await client
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: '商品不存在' },
        { status: 404 }
      );
    }

    // 获取商品的SKU（包含颜色别名等信息）
    const { data: skus } = await client
      .from('product_skus')
      .select(`
        id,
        product_id,
        color_id,
        size_id,
        color_alias,
        style_code,
        barcode,
        image_url,
        factory_color_code,
        supplier_id,
        color_values (
          id,
          name,
          code,
          hex_code,
          group_id
        ),
        size_values (
          id,
          name,
          code,
          group_id
        )
      `)
      .eq('product_id', id);

    // 提取唯一的颜色和尺码ID
    const colorIds = new Set(skus?.map(sku => sku.color_id).filter(Boolean) || []);
    const sizeIds = new Set(skus?.map(sku => sku.size_id).filter(Boolean) || []);

    // 获取颜色详细信息（包含色系组信息）
    const { data: colors } = colorIds.size > 0 ? await client
      .from('color_values')
      .select(`
        id,
        name,
        code,
        hex_code,
        group_id,
        color_groups (
          id,
          name,
          code
        )
      `)
      .in('id', Array.from(colorIds)) : { data: [] };

    // 获取尺码详细信息（包含尺码组信息）
    const { data: sizes } = sizeIds.size > 0 ? await client
      .from('size_values')
      .select(`
        id,
        name,
        code,
        group_id,
        size_groups (
          id,
          name,
          code
        )
      `)
      .in('id', Array.from(sizeIds)) : { data: [] };

    // 构建完整的颜色选择信息（ColorSelector 需要的格式）
    const selectedColorDetails: any[] = [];
    const processedColors = new Set<number>();
    
    skus?.forEach(sku => {
      if (sku.color_id && !processedColors.has(sku.color_id)) {
        processedColors.add(sku.color_id);
        const colorInfo = colors?.find(c => c.id === sku.color_id);
        if (colorInfo) {
          // color_groups 可能是对象或数组
          const colorGroup = Array.isArray(colorInfo.color_groups) 
            ? colorInfo.color_groups[0] 
            : colorInfo.color_groups;
          
          selectedColorDetails.push({
            id: Date.now() + sku.color_id, // 唯一ID
            colorValueId: colorInfo.id,
            groupId: colorInfo.group_id,
            groupName: colorGroup?.name || '',
            groupCode: colorGroup?.code || '',
            colorName: colorInfo.name,
            colorCode: colorInfo.code,
            colorAlias: sku.color_alias || colorInfo.name,
            hexCode: colorInfo.hex_code || '',
            factoryColorCode: sku.factory_color_code || '',
            styleCode: sku.style_code || '',
            supplierId: sku.supplier_id,
            supplierName: '', // 需要单独查询
            image: sku.image_url || '',
          });
        }
      }
    });

    // 获取供应商名称
    const supplierIds = new Set(skus?.map(sku => sku.supplier_id).filter(Boolean) || []);
    if (supplierIds.size > 0) {
      const { data: suppliers } = await client
        .from('suppliers')
        .select('id, supplier_name')
        .in('id', Array.from(supplierIds));
      
      if (suppliers) {
        selectedColorDetails.forEach(color => {
          if (color.supplierId) {
            const supplier = suppliers.find(s => s.id === color.supplierId);
            color.supplierName = supplier?.supplier_name || '';
          }
        });
      }
    }

    // 获取货号字段关联的编码规则（用于条码生成）
    const { data: basicFields } = await client
      .from('product_basic_fields')
      .select('code_rule_id')
      .eq('db_field_name', 'product_code')
      .single();

    let barcodeRule = null;
    if (basicFields?.code_rule_id) {
      const { data: codeRule } = await client
        .from('product_code_rules')
        .select('id, rule_name, barcode_enabled, barcode_elements')
        .eq('id', basicFields.code_rule_id)
        .single();
      
      if (codeRule && codeRule.barcode_enabled) {
        barcodeRule = {
          id: codeRule.id,
          ruleName: codeRule.rule_name,
          barcodeElements: codeRule.barcode_elements || [],
        };
      }
    }

    return NextResponse.json({
      data: {
        ...product,
        skus: skus || [],
        colors: colors || [],
        sizes: sizes || [],
        selectedColorDetails, // 完整的颜色选择信息
        selectedSizeIds: Array.from(sizeIds), // 选中的尺码ID列表
        colorAliases: {},
        barcodeRule,
      },
    });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - 更新商品
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    console.log('更新商品 - 接收到的数据:', JSON.stringify(body, null, 2));

    // 1. 更新商品基本信息
    const { data: product, error: productError } = await client
      .from('products')
      .update({
        basic_info: body.basicInfo,
        attribute_values: body.attributeValues,
        image_urls: body.imageUrls,
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (productError) {
      console.error('更新商品基本信息失败:', productError);
      return NextResponse.json(
        { error: productError.message },
        { status: 500 }
      );
    }

    // 2. 更新 SKU 的颜色信息（图片、供应商等）
    if (body.colors && body.colors.length > 0) {
      console.log('更新商品 - 更新 SKU 颜色信息，颜色数:', body.colors.length);
      
      for (const color of body.colors) {
        // 更新该颜色对应的所有 SKU
        const { error: skuError } = await client
          .from('product_skus')
          .update({
            color_alias: color.colorAlias || color.colorName,
            factory_color_code: color.factoryColorCode || '',
            supplier_id: color.supplierId || null,
            image_url: color.image || '',
            style_code: color.styleCode || '',
          })
          .eq('product_id', id)
          .eq('color_id', color.colorValueId);

        if (skuError) {
          console.error('更新 SKU 失败:', skuError, '颜色:', color.colorName);
        }
      }
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error('更新商品失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - 删除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { error } = await client
      .from('products')
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
