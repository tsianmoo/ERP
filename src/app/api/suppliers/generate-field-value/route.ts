import { NextRequest, NextResponse } from 'next/server';

// POST /api/suppliers/generate-field-value - 生成供应商字段值
// 在前端实现编码生成逻辑，不依赖 Java 后端
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

    let result = '';
    for (const element of sortedElements) {
      const type = element.type;
      const value = element.value;

      if (type === 'fixed') {
        result += value || '';
      } else if (type === 'variable') {
        const variableValue = resolveVariable(value, basic_field_values, attribute_values, element);
        result += variableValue;
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
      return generateSequence(element);
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
 * 生成流水号
 */
function generateSequence(element: any): string {
  const length = element?.sequence_length || 4;
  // 简单实现：使用时间戳
  const timestamp = Date.now().toString();
  const sequence = timestamp.slice(-length);
  return sequence.padStart(length, '0');
}
