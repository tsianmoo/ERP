import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST /api/products/codes/generate - 批量生成编码
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { basicFieldValues, attributeValues, count = 1 } = body;

    // 1. 获取启用的编码规则
    const { data: rules, error: rulesError } = await client
      .from('product_code_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError || !rules || rules.length === 0) {
      return NextResponse.json({ error: '没有可用的编码规则' }, { status: 400 });
    }

    // 使用第一个启用的规则
    const rule = rules[0];
    const elements = rule.elements || [];
    const enabledElements = elements
      .filter((el: any) => el.enabled)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);

    // 获取编码历史中的最大序号
    const { data: historyData } = await client
      .from('product_code_history')
      .select('product_code')
      .eq('code_rule_id', rule.id)
      .order('generated_at', { ascending: false })
      .limit(1);

    let sequence = 1;
    if (historyData && historyData.length > 0) {
      const lastCode = historyData[0].product_code;
      const match = lastCode.match(/(\d+)$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    const now = new Date();
    const generatedCodes: string[] = [];

    // 批量生成编码
    for (let i = 0; i < count; i++) {
      let generatedValue = '';
      const currentSequence = sequence + i;

      for (const element of enabledElements) {
        if (element.type === 'fixed') {
          generatedValue += element.value;
        } else {
          switch (element.value) {
            case 'year':
              generatedValue += now.getFullYear().toString().slice(-2);
              break;
            case 'month':
              generatedValue += (now.getMonth() + 1).toString().padStart(2, '0');
              break;
            case 'day':
              generatedValue += now.getDate().toString().padStart(2, '0');
              break;
            case 'sequence':
              generatedValue += currentSequence.toString().padStart(4, '0');
              break;
            default:
              const value = basicFieldValues?.[element.value] || attributeValues?.[element.value] || '';
              generatedValue += value;
          }
        }
      }

      generatedCodes.push(generatedValue);
    }

    // 批量保存生成历史
    if (generatedCodes.length > 0) {
      const historyRecords = generatedCodes.map(code => ({
        product_code: code,
        db_field_name: 'product_code',
        code_rule_id: rule.id,
      }));

      try {
        await client
          .from('product_code_history')
          .insert(historyRecords);
      } catch (historyError) {
        console.error('保存编码历史失败:', historyError);
      }
    }

    return NextResponse.json({
      success: true,
      data: generatedCodes,
    });
  } catch (error) {
    console.error('批量生成编码失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
