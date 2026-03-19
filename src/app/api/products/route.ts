import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/products - 获取商品列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');

    let query = client
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/products - 创建商品
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    console.log('创建商品 - 接收到的数据:', JSON.stringify(body, null, 2));

    // 后端验证：必填字段检查
    const { data: basicFields } = await client
      .from('product_basic_fields')
      .select('db_field_name, field_name, required, value_type, options')
      .eq('enabled', true);

    const validationErrors: string[] = [];

    if (basicFields) {
      const basicInfo = body.basicInfo || {};

      // 检查必填字段
      const requiredFields = basicFields.filter(f => f.required);
      for (const field of requiredFields) {
        const value = basicInfo[field.db_field_name];

        // 检查是否为空
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

        // 选择框验证
        if (field.value_type === 'select' && field.options) {
          const options = field.options.split(',');
          if (!options.includes(value)) {
            validationErrors.push(`"${field.field_name}"的值无效`);
          }
        }

        // 日期验证
        if (field.value_type === 'date') {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            validationErrors.push(`"${field.field_name}"必须是有效的日期`);
          }
        }
      }
    }

    // 检查颜色和尺码
    if (!body.colors || body.colors.length === 0) {
      validationErrors.push('请至少选择一个颜色');
    }

    if (!body.sizes || body.sizes.length === 0) {
      validationErrors.push('请至少选择一个尺码');
    }

    // 如果有验证错误，返回错误
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join('；') },
        { status: 400 }
      );
    }

    // 从 basic_info 中查找货号字段
    // 根据 db_field_name 为 'product_code' 的字段来确定货号
    let productCode = null;
    const basicInfo = body.basicInfo || {};

    console.log('创建商品 - basicInfo:', JSON.stringify(basicInfo, null, 2));

    // 查找 db_field_name 为 'product_code' 的字段
    if (basicFields) {
      // 找到 db_field_name 为 'product_code' 的字段
      const productCodeField = basicFields.find(f => f.db_field_name === 'product_code');
      
      if (productCodeField && productCodeField.db_field_name) {
        productCode = basicInfo[productCodeField.db_field_name];
        console.log(`创建商品 - 使用货号字段 ${productCodeField.field_name} (${productCodeField.db_field_name}), 值:`, productCode);
      } else {
        console.log('创建商品 - 未找到 db_field_name 为 product_code 的字段');
      }
    }

    // 如果没有找到货号字段，使用第一个值作为备用
    if (!productCode && Object.keys(basicInfo).length > 0) {
      const firstKey = Object.keys(basicInfo)[0];
      const firstValue = basicInfo[firstKey];
      if (firstValue) {
        productCode = String(firstValue);
        console.log('创建商品 - 使用第一个值作为货号（备用方案）:', firstKey, productCode);
      }
    }

    console.log('创建商品 - 准备插入商品数据:');
    console.log('  product_code:', productCode);
    console.log('  product_name:', null);
    console.log('  basic_info:', JSON.stringify(basicInfo));
    console.log('  attribute_values:', JSON.stringify(body.attributeValues || {}));
    console.log('  image_urls:', JSON.stringify(body.imageUrls || []));
    console.log('  status:', body.status || 'active');

    // 1. 创建商品
    const insertData = {
      product_code: productCode || null, // 可以为空
      product_name: null, // 也可以为空，所有信息都在 basic_info 中
      basic_info: basicInfo,
      attribute_values: body.attributeValues || {},
      image_urls: body.imageUrls || [],
      status: body.status || 'active',
    };

    console.log('创建商品 - insertData:', JSON.stringify(insertData, null, 2));

    const { data: product, error: productError } = await client
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (productError) {
      console.error('创建商品失败 - 数据库错误:', productError);
      return NextResponse.json(
        { error: productError.message },
        { status: 500 }
      );
    }

    console.log('创建商品 - 成功，商品ID:', product.id);

    // 2. 如果提供了颜色和尺码，创建 SKU
    if (body.colors && body.colors.length > 0 && body.sizes && body.sizes.length > 0 && productCode) {
      console.log('创建商品 - 开始创建 SKU，颜色数:', body.colors.length, '尺码数:', body.sizes.length);
      console.log('创建商品 - 颜色数据:', JSON.stringify(body.colors, null, 2));

      try {
        // 批量查询尺码信息
        const { data: sizeValues, error: sizesError } = await client
          .from('size_values')
          .select('*')
          .in('id', body.sizes);

        if (sizesError || !sizeValues) {
          console.error('查询尺码信息失败:', sizesError);
          throw new Error('查询尺码信息失败');
        }

        // 生成所有 SKU 数据
        const skuData: any[] = [];
        const barcodes: string[] = [];

        for (const color of body.colors) {
          console.log('创建商品 - 处理颜色:', JSON.stringify(color, null, 2));
          for (const sizeValue of sizeValues) {
            const barcode = `${productCode}${color.colorCode}${sizeValue.code}`;
            const sku_code = `${productCode}-${color.colorCode}-${sizeValue.code}`;

            skuData.push({
              product_id: product.id,
              color_id: color.colorValueId,
              size_id: sizeValue.id,
              barcode,
              sku_code,
              stock_quantity: 0,
              status: 'active',
              // 保存颜色的完整信息
              color_alias: color.colorAlias || color.colorName,
              style_code: color.styleCode || '',
              factory_color_code: color.factoryColorCode || '',
              supplier_id: color.supplierId || null,
              image_url: color.image || '',
            });
            barcodes.push(barcode);
          }
        }

        console.log('创建商品 - 生成的 SKU 数据:', JSON.stringify(skuData, null, 2));

        // 批量检查条码是否已存在
        const { data: existingSkus, error: existingSkusError } = await client
          .from('product_skus')
          .select('barcode')
          .in('barcode', barcodes);

        if (existingSkusError) {
          console.error('检查条码失败:', existingSkusError);
          throw new Error('检查条码失败');
        }

        // 过滤掉已存在的条码
        const existingBarcodeSet = new Set(existingSkus?.map(s => s.barcode) || []);
        const newSkus = skuData.filter(sku => !existingBarcodeSet.has(sku.barcode));

        console.log('创建商品 - 准备插入 SKU 数:', newSkus.length, '（跳过已存在的:', skuData.length - newSkus.length, '）');

        // 批量插入 SKU
        if (newSkus.length > 0) {
          const { error: skuError } = await client
            .from('product_skus')
            .insert(newSkus);

          if (skuError) {
            console.error('批量插入 SKU 失败:', skuError);
            throw new Error('SKU 创建失败：' + skuError.message);
          }
        }

        const skippedCount = skuData.length - newSkus.length;
        if (skippedCount > 0) {
          console.log('创建商品 - 已跳过', skippedCount, '个已存在的 SKU');
        }
      } catch (error) {
        console.error('创建 SKU 失败，执行回滚操作:', error);

        // 回滚：删除已创建的商品
        try {
          const { error: deleteError } = await client
            .from('products')
            .delete()
            .eq('id', product.id);

          if (deleteError) {
            console.error('回滚失败，无法删除商品:', deleteError);
          } else {
            console.log('回滚成功，已删除商品 ID:', product.id);
          }
        } catch (rollbackError) {
          console.error('回滚过程中发生错误:', rollbackError);
        }

        return NextResponse.json(
          { error: 'SKU 创建失败，已回滚商品创建：' + (error instanceof Error ? error.message : '未知错误') },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error('创建商品失败 - 服务器错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
