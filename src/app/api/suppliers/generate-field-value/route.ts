import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// PostgreSQL 连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
});

// POST /api/suppliers/generate-field-value - 生成供应商字段值
// 实现编码生成逻辑，包括从 0001 开始递增的流水号
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code_rule_id, basic_field_values, attribute_values } = body;

    if (!code_rule_id) {
      return NextResponse.json(
        { success: false, error: 'code_rule_id 不能为空' },
        { status: 400 }
      );
    }

    // 获取编码规则
    const ruleResponse = await fetch(`${process.env.JAVA_BACKEND_URL || 'http://localhost:8080'}/api/suppliers/code-rules/${code_rule_id}`);
    const ruleResult = await ruleResponse.json();

    if (!ruleResult.data) {
      return NextResponse.json(
        { success: false, error: '编码规则不存在' },
        { status: 404 }
      );
    }

    const rule = ruleResult.data;
    const elements = rule.elements || [];

    // 按排序生成编码
    const sortedElements = [...elements]
      .filter((el: any) => el.enabled !== false)
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

    // 首先收集非流水号元素的值，用于生成前缀 key
    let prefixKey = '';
    let sequenceElement: any = null;
    
    for (const element of sortedElements) {
      if (element.type === 'variable' && element.value?.toLowerCase() === 'sequence') {
        sequenceElement = element;
        continue;  // 流水号最后处理
      }
      
      if (element.type === 'fixed') {
        prefixKey += element.value || '';
      } else if (element.type === 'variable') {
        const variableValue = resolveVariable(element.value, basic_field_values, attribute_values, element);
        prefixKey += variableValue;
      }
    }

    // 生成最终编码
    let result = '';
    for (const element of sortedElements) {
      if (element.type === 'fixed') {
        result += element.value || '';
      } else if (element.type === 'variable') {
        if (element.value?.toLowerCase() === 'sequence') {
          // 使用数据库获取并递增序列号
          const sequenceValue = await getNextSequence(code_rule_id, prefixKey, element);
          result += sequenceValue;
        } else {
          const variableValue = resolveVariable(element.value, basic_field_values, attribute_values, element);
          result += variableValue;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { value: result },
    });
  } catch (error) {
    console.error('生成供应商字段值失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

/**
 * 解析变量值
 */
function resolveVariable(
  variableName: string,
  basicFieldValues: Record<string, any>,
  attributeValues: Record<string, any>,
  element: any
): string {
  if (!variableName) return '';

  const lowerVarName = variableName.toLowerCase();

  // 特殊变量
  const now = new Date();
  switch (lowerVarName) {
    case 'year':
      return String(now.getFullYear());
    case 'month':
      return String(now.getMonth() + 1).padStart(2, '0');
    case 'day':
      return String(now.getDate()).padStart(2, '0');
    case 'sequence':
      return '';  // 流水号在主函数中处理
  }

  // 从属性值中查找（支持 supplier_ 前缀）
  if (attributeValues) {
    // 尝试带 supplier_ 前缀
    const supplierVarName = variableName.startsWith('supplier_') 
      ? variableName.substring(9) 
      : variableName;
    
    if (attributeValues[supplierVarName] !== undefined) {
      return String(attributeValues[supplierVarName] || '');
    }
    if (attributeValues[variableName] !== undefined) {
      return String(attributeValues[variableName] || '');
    }
  }

  // 从基本字段值中查找
  if (basicFieldValues) {
    if (basicFieldValues[variableName] !== undefined) {
      return String(basicFieldValues[variableName] || '');
    }
  }

  return '';
}

/**
 * 从数据库获取下一个序列号
 */
async function getNextSequence(ruleId: number, prefixKey: string, element: any): Promise<string> {
  const length = element?.sequence_length || 4;
  const excludedDigits = element?.sequence_excluded_digits || '';
  
  try {
    const client = await pool.connect();
    try {
      // 开始事务
      await client.query('BEGIN');
      
      // 获取当前序列号
      const selectResult = await client.query(
        'SELECT current_sequence FROM supplier_code_sequences WHERE rule_id = $1 AND prefix_key = $2',
        [ruleId, prefixKey]
      );
      
      let currentSequence = 0;
      if (selectResult.rows.length > 0) {
        currentSequence = selectResult.rows[0].current_sequence;
      }
      
      // 找下一个有效的序列号
      const nextSequence = findNextValidSequence(currentSequence, length, excludedDigits);
      
      // 更新或插入序列号
      await client.query(
        `INSERT INTO supplier_code_sequences (rule_id, prefix_key, current_sequence, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (rule_id, prefix_key) 
         DO UPDATE SET current_sequence = $3, updated_at = CURRENT_TIMESTAMP`,
        [ruleId, prefixKey, nextSequence]
      );
      
      // 提交事务
      await client.query('COMMIT');
      
      // 格式化为指定位数
      return String(nextSequence).padStart(length, '0');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取序列号失败:', error);
    // 如果数据库操作失败，返回一个模拟的序列号
    return String(1).padStart(length, '0');
  }
}

/**
 * 找下一个有效的序列号（排除指定数字）
 */
function findNextValidSequence(currentSequence: number, length: number, excludedDigits: string): number {
  const maxSequence = Math.pow(10, length) - 1;
  
  // 解析排除的数字
  const excludeSet = new Set<string>();
  if (excludedDigits && excludedDigits.trim()) {
    for (const digit of excludedDigits.split(',')) {
      const trimmed = digit.trim();
      if (trimmed) excludeSet.add(trimmed);
    }
  }
  
  // 从当前序列号 + 1 开始找
  let nextSequence = currentSequence + 1;
  
  // 如果序列号已经是 0 或更小，从 1 开始
  if (nextSequence < 1) {
    nextSequence = 1;
  }
  
  // 检查序列号是否包含排除的数字
  while (nextSequence <= maxSequence) {
    const sequenceStr = String(nextSequence).padStart(length, '0');
    let hasExcludedDigit = false;
    
    for (const digit of excludeSet) {
      if (sequenceStr.includes(digit)) {
        hasExcludedDigit = true;
        break;
      }
    }
    
    if (!hasExcludedDigit) {
      return nextSequence;
    }
    
    nextSequence++;
  }
  
  // 如果所有序列号都被排除，抛出异常
  throw new Error('序列号已用尽，请调整位数或排除数字设置');
}
