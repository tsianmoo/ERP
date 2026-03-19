import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST /api/products/batch-update - 批量更新商品属性
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { productIds, attributeValues } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: '请选择要修改的商品' },
        { status: 400 }
      );
    }

    if (!attributeValues || Object.keys(attributeValues).length === 0) {
      return NextResponse.json(
        { error: '请选择要修改的属性值' },
        { status: 400 }
      );
    }

    // 获取要更新的商品
    const { data: products, error: fetchError } = await client
      .from('products')
      .select('id, attribute_values')
      .in('id', productIds);

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: '未找到要更新的商品' },
        { status: 404 }
      );
    }

    // 批量更新每个商品的属性值
    const updatePromises = products.map(async (product: any) => {
      const currentAttributeValues = product.attribute_values || {};
      const newAttributeValues = {
        ...currentAttributeValues,
        ...attributeValues,
      };

      return client
        .from('products')
        .update({ attribute_values: newAttributeValues })
        .eq('id', product.id);
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      success: true, 
      updatedCount: products.length 
    });
  } catch (error) {
    console.error('批量更新失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
