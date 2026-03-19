import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST /api/products/draft - 保存商品草稿
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    console.log('保存草稿 - 接收到的数据:', JSON.stringify(body, null, 2));

    // 草稿模式下，不进行必填验证，直接保存
    const basicInfo = body.basicInfo || {};

    // 从 basic_info 中查找货号字段
    let productCode = null;
    const { data: basicFields } = await client
      .from('product_basic_fields')
      .select('db_field_name, field_name')
      .eq('enabled', true);

    if (basicFields) {
      const productCodeField = basicFields.find(f => f.db_field_name === 'product_code');
      if (productCodeField) {
        productCode = basicInfo[productCodeField.db_field_name];
      }
    }

    // 如果没有找到货号，使用第一个值作为备用
    if (!productCode && Object.keys(basicInfo).length > 0) {
      const firstKey = Object.keys(basicInfo)[0];
      const firstValue = basicInfo[firstKey];
      if (firstValue) {
        productCode = String(firstValue);
      }
    }

    // 检查是否已有草稿（通过 draft_id 判断）
    const draftId = body.draftId;

    let product;

    if (draftId) {
      // 更新现有草稿
      const { data: existingProduct, error: updateError } = await client
        .from('products')
        .update({
          product_code: productCode || null,
          basic_info: basicInfo,
          attribute_values: body.attributeValues || {},
          image_urls: body.imageUrls || [],
          colors_data: body.colors || [],
          sizes_data: body.sizes || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', draftId)
        .eq('status', 'draft')
        .select()
        .single();

      if (updateError) {
        console.error('更新草稿失败:', updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
      product = existingProduct;
    } else {
      // 创建新草稿
      const { data: newProduct, error: insertError } = await client
        .from('products')
        .insert({
          product_code: productCode || null,
          product_name: null,
          basic_info: basicInfo,
          attribute_values: body.attributeValues || {},
          image_urls: body.imageUrls || [],
          colors_data: body.colors || [],
          sizes_data: body.sizes || [],
          status: 'draft',
        })
        .select()
        .single();

      if (insertError) {
        console.error('创建草稿失败:', insertError);
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
      product = newProduct;
    }

    console.log('保存草稿成功，商品ID:', product?.id);

    return NextResponse.json({
      success: true,
      data: product,
      message: '草稿保存成功',
    });
  } catch (error) {
    console.error('保存草稿异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// PUT /api/products/draft - 将草稿转为正式商品
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { draftId } = body;

    if (!draftId) {
      return NextResponse.json(
        { error: '缺少草稿ID' },
        { status: 400 }
      );
    }

    // 获取草稿数据
    const { data: draft, error: fetchError } = await client
      .from('products')
      .select('*')
      .eq('id', draftId)
      .eq('status', 'draft')
      .single();

    if (fetchError || !draft) {
      return NextResponse.json(
        { error: '草稿不存在' },
        { status: 404 }
      );
    }

    // 后端验证：必填字段检查
    const { data: basicFields } = await client
      .from('product_basic_fields')
      .select('db_field_name, field_name, required, value_type, options')
      .eq('enabled', true);

    const validationErrors: string[] = [];

    if (basicFields) {
      const basicInfo = draft.basic_info || {};

      // 检查必填字段
      const requiredFields = basicFields.filter(f => f.required);
      for (const field of requiredFields) {
        const value = basicInfo[field.db_field_name];

        if (value === undefined || value === null || value === '') {
          validationErrors.push(`请填写"${field.field_name}"`);
          continue;
        }

        // 类型验证
        if (field.value_type === 'number') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            validationErrors.push(`"${field.field_name}"必须是有效的数字`);
          }
        }
      }
    }

    // 检查颜色和尺码
    const colors = draft.colors_data || [];
    const sizes = draft.sizes_data || [];

    if (colors.length === 0) {
      validationErrors.push('请至少选择一个颜色');
    }

    if (sizes.length === 0) {
      validationErrors.push('请至少选择一个尺码');
    }

    // 如果有验证错误，返回错误
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join('；') },
        { status: 400 }
      );
    }

    // 更新状态为 active
    const { data: product, error: updateError } = await client
      .from('products')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // 创建 SKU
    if (colors.length > 0 && sizes.length > 0 && draft.product_code) {
      // 批量查询尺码信息
      const { data: sizeValues } = await client
        .from('size_values')
        .select('*')
        .in('id', sizes);

      if (sizeValues && sizeValues.length > 0) {
        const skuData: any[] = [];
        const barcodes: string[] = [];

        for (const color of colors) {
          for (const sizeValue of sizeValues) {
            const barcode = `${draft.product_code}${color.colorCode}${sizeValue.code}`;
            const sku_code = `${draft.product_code}-${color.colorCode}-${sizeValue.code}`;

            skuData.push({
              product_id: draftId,
              color_id: color.colorValueId,
              size_id: sizeValue.id,
              barcode,
              sku_code,
              stock_quantity: 0,
              status: 'active',
              color_alias: color.colorAlias || color.colorName,
              style_code: color.styleCode || '',
              factory_color_code: color.factoryColorCode || '',
              supplier_id: color.supplierId || null,
              image_url: color.image || '',
            });
            barcodes.push(barcode);
          }
        }

        // 检查条码是否已存在
        const { data: existingSkus } = await client
          .from('product_skus')
          .select('barcode')
          .in('barcode', barcodes);

        const existingBarcodeSet = new Set(existingSkus?.map(s => s.barcode) || []);
        const newSkus = skuData.filter(sku => !existingBarcodeSet.has(sku.barcode));

        if (newSkus.length > 0) {
          await client.from('product_skus').insert(newSkus);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: '商品发布成功',
    });
  } catch (error) {
    console.error('发布草稿异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
