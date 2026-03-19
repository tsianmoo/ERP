import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 生成商品条码
 * 格式：货号 + 色系编码 + 颜色编码 + 尺码编码 + 固定字符
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, colorCode, sizeCode, suffix = '' } = body;

    if (!productId || !colorCode || !sizeCode) {
      return NextResponse.json(
        { error: '缺少必要参数：productId、colorCode、sizeCode' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 1. 获取商品信息（包含货号）
    const { data: product, error: productError } = await client
      .from('products')
      .select('product_code')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: '商品不存在' },
        { status: 404 }
      );
    }

    if (!product.product_code) {
      return NextResponse.json(
        { error: '商品货号不存在，请先生成货号' },
        { status: 400 }
      );
    }

    // 2. 生成条码
    const barcode = `${product.product_code}${colorCode}${sizeCode}${suffix}`;

    // 3. 检查条码是否已存在
    const { data: existingSku, error: skuError } = await client
      .from('product_skus')
      .select('id')
      .eq('barcode', barcode)
      .single();

    if (existingSku) {
      return NextResponse.json(
        { error: '条码已存在，请检查商品信息' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        barcode,
        product_code: product.product_code,
        color_code: colorCode,
        size_code: sizeCode,
      },
    });
  } catch (error) {
    console.error('生成条码失败:', error);
    return NextResponse.json(
      { error: '生成条码失败' },
      { status: 500 }
    );
  }
}

/**
 * 批量生成条码
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: '缺少 productId 参数' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 获取商品信息
    const { data: product } = await client
      .from('products')
      .select('product_code, color_group_id, size_group_id')
      .eq('id', productId)
      .single();

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }

    // 获取颜色组信息
    const { data: colorGroup } = await client
      .from('color_groups')
      .select('color_values(*)')
      .eq('id', product.color_group_id)
      .single();

    // 获取尺码组信息
    const { data: sizeGroup } = await client
      .from('size_groups')
      .select('size_values(*)')
      .eq('id', product.size_group_id)
      .single();

    if (!colorGroup?.color_values || !sizeGroup?.size_values) {
      return NextResponse.json(
        { error: '商品的颜色或尺码信息不完整' },
        { status: 400 }
      );
    }

    // 生成所有 SKU 的条码
    const barcodes = [];
    for (const color of colorGroup.color_values) {
      for (const size of sizeGroup.size_values) {
        const barcode = `${product.product_code}${color.code}${size.code}`;
        barcodes.push({
          color_code: color.code,
          size_code: size.code,
          color_name: color.name,
          size_name: size.name,
          barcode,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        product_code: product.product_code,
        barcodes,
      },
    });
  } catch (error) {
    console.error('批量生成条码失败:', error);
    return NextResponse.json({ error: '批量生成条码失败' }, { status: 500 });
  }
}
