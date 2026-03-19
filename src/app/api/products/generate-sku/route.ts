import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取下一个流水号
async function getNextSequence(): Promise<number> {
  const client = getSupabaseClient();
  
  // 获取当前最大的流水号
  const { data } = await client
    .from('products')
    .select('product_code')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) {
    return 1;
  }

  // 从货号中提取流水号（假设最后4位是流水号）
  const lastCode = data[0].product_code;
  const lastSequence = parseInt(lastCode.slice(-4)) || 0;
  
  return lastSequence + 1;
}

// 生成货号
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attributeValues } = body;

    if (!attributeValues || typeof attributeValues !== 'object') {
      return NextResponse.json(
        { error: '缺少属性值参数' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 获取活跃的货号规则
    const { data: rules, error: rulesError } = await client
      .from('sku_rules')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (rulesError || !rules) {
      return NextResponse.json(
        { error: '未找到活跃的货号规则' },
        { status: 400 }
      );
    }

    // 获取所有属性配置
    const { data: attributes } = await client
      .from('product_attributes')
      .select('*');

    if (!attributes) {
      return NextResponse.json(
        { error: '未找到属性配置' },
        { status: 400 }
      );
    }

    // 构建货号前缀（根据规则中的属性代码）
    let prefix = '';
    for (const attrCode of rules.attribute_codes as string[]) {
      const attr = attributes.find(a => a.code === attrCode);
      if (attr) {
        const valueCode = attributeValues[attr.code];
        if (valueCode) {
          prefix += valueCode;
        }
      }
    }

    // 生成流水号
    const sequence = rules.use_sequence 
      ? await getNextSequence()
      : 1;

    // 格式化流水号（补零）
    const sequenceStr = sequence.toString().padStart(rules.sequence_length, '0');

    // 组合货号
    const skuCode = prefix + sequenceStr;

    return NextResponse.json({
      success: true,
      data: {
        skuCode,
        prefix,
        sequence,
      },
    });
  } catch (error) {
    console.error('生成货号失败:', error);
    return NextResponse.json(
      { error: '生成货号失败，请重试' },
      { status: 500 }
    );
  }
}
