import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 检查补零后的字符串是否包含排除的数字
 */
function containsExcludedDigit(numStr: string, excludedDigits: number[]): boolean {
  for (const char of numStr) {
    if (excludedDigits.includes(parseInt(char))) {
      return true;
    }
  }
  return false;
}

/**
 * 计算可用流水号数量
 * @param length 位数
 * @param excludedDigits 排除的数字
 * @returns 可用数量
 */
function calculateAvailableCount(length: number, excludedDigits: number[]): number {
  if (excludedDigits.length === 0) {
    return Math.pow(10, length);
  }
  
  // 每位可用的数字数量
  const availableDigitsPerPosition = 10 - excludedDigits.length;
  return Math.pow(availableDigitsPerPosition, length);
}

/**
 * 生成符合规则的流水号
 * @param sequence 起始序号
 * @param length 流水号位数
 * @param excludedDigits 排除的数字数组
 * @returns 符合规则的流水号字符串，或 'OVERFLOW' 表示耗尽
 */
function generateSequenceNumber(
  sequence: number,
  length: number,
  excludedDigits: number[]
): string {
  const maxNumber = Math.pow(10, length) - 1; // 如4位最大9999
  
  // 从起始序号开始寻找下一个有效数字
  let currentNumber = sequence;
  const maxAttempts = Math.pow(10, length) + 1; // 最大尝试次数
  
  while (currentNumber <= maxNumber) {
    const paddedNumber = currentNumber.toString().padStart(length, '0');
    if (!containsExcludedDigit(paddedNumber, excludedDigits)) {
      return paddedNumber;
    }
    currentNumber++;
    
    // 防止无限循环
    if (currentNumber - sequence > maxAttempts) {
      break;
    }
  }
  
  // 流水号已耗尽
  return 'OVERFLOW';
}

/**
 * 从历史记录中提取最后一个流水号
 * @param historyCode 历史编码
 * @param sequenceLength 流水号位数
 * @returns 最后的流水号数字
 */
function extractLastSequence(historyCode: string, sequenceLength: number): number {
  if (!historyCode) return 0;

  // 从编码末尾提取指定位数的数字
  const match = historyCode.match(new RegExp(`(\\d{${sequenceLength}})$`));
  if (match) {
    return parseInt(match[1], 10);
  }

  // 如果没有匹配到位数相同的，尝试提取末尾所有数字
  const allDigitsMatch = historyCode.match(/(\d+)$/);
  if (allDigitsMatch) {
    return parseInt(allDigitsMatch[1], 10);
  }

  return 0;
}

// POST /api/products/generate-field-value - 生成字段值
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { dbFieldName, codeRuleId, basicFieldValues, attributeValues } = body;

    if (!codeRuleId) {
      return NextResponse.json({ error: '缺少编码规则ID' }, { status: 400 });
    }

    // 获取编码规则
    const { data: codeRule, error: ruleError } = await client
      .from('product_code_rules')
      .select('*')
      .eq('id', codeRuleId)
      .single();

    if (ruleError || !codeRule) {
      return NextResponse.json({ error: '编码规则不存在' }, { status: 404 });
    }

    // 获取编码历史中的最大序号
    const { data: historyData } = await client
      .from('product_code_history')
      .select('product_code')
      .eq('code_rule_id', codeRuleId)
      .order('generated_at', { ascending: false })
      .limit(1);

    // 查找流水号元素的配置
    const elements = codeRule.elements || [];
    const sequenceElement = elements.find(
      (el: any) => el.type === 'variable' && el.value === 'sequence' && el.enabled
    );

    // 获取流水号配置
    const sequenceLength = sequenceElement?.sequence_length || 3;
    const excludedDigitsStr = sequenceElement?.sequence_excluded_digits || '';
    const excludedDigits = excludedDigitsStr
      .split(',')
      .map((d: string) => parseInt(d.trim()))
      .filter((d: number) => !isNaN(d) && d >= 0 && d <= 9);

    // 计算初始序号
    let sequence = 1;
    if (historyData && historyData.length > 0) {
      const lastSequence = extractLastSequence(historyData[0].product_code, sequenceLength);
      if (lastSequence > 0) {
        sequence = lastSequence + 1;
      }
    }

    // 生成编码
    const enabledElements = elements
      .filter((el: any) => el.enabled)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);

    let generatedValue = '';
    const now = new Date();

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
            // 使用配置的位数和排除数字生成流水号
            const sequenceNumber = generateSequenceNumber(sequence, sequenceLength, excludedDigits);
            if (sequenceNumber === 'OVERFLOW') {
              const availableCount = calculateAvailableCount(sequenceLength, excludedDigits);
              return NextResponse.json({ 
                error: `流水号已耗尽，无法生成新的编码。当前设置：${sequenceLength}位流水号${excludedDigits.length > 0 ? `，排除数字${excludedDigits.join('、')}` : ''}，可用数量约${availableCount.toLocaleString()}个。请修改编码规则：增加流水号位数或减少排除数字。` 
              }, { status: 400 });
            }
            generatedValue += sequenceNumber;
            break;
          default:
            // 尝试从基本信息或属性中获取
            const value = basicFieldValues?.[element.value] || attributeValues?.[element.value] || '';
            generatedValue += value;
        }
      }
    }

    // 保存生成历史
    try {
      await client
        .from('product_code_history')
        .insert({
          product_code: generatedValue,
          db_field_name: dbFieldName,
          code_rule_id: codeRuleId,
        });
    } catch (historyError) {
      console.error('保存编码历史失败:', historyError);
      // 不影响返回结果
    }

    return NextResponse.json({
      success: true,
      data: { value: generatedValue },
    });
  } catch (error) {
    console.error('生成字段值失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
