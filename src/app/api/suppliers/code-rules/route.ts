import { NextRequest, NextResponse } from 'next/server';
import { supplierCodeRulesApi } from '@/lib/java-backend-client';

// 禁用缓存，确保数据实时性
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/suppliers/code-rules - 获取编码规则列表
export async function GET() {
  try {
    const result = await supplierCodeRulesApi.list();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('获取供应商编码规则列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/suppliers/code-rules - 创建编码规则
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 支持camelCase和snake_case两种格式
    const ruleName = body.ruleName || body.rule_name;
    const elements = body.elements || [];
    const isActive = body.isActive ?? body.is_active ?? true;

    // 转换为snake_case格式（Java后端使用snake_case命名策略）
    const javaRequest = {
      rule_name: ruleName,
      elements: elements,
      is_active: isActive,
    };

    const result = await supplierCodeRulesApi.create(javaRequest);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('创建供应商编码规则失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
