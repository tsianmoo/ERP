import { NextRequest, NextResponse } from 'next/server';
import { supplierCodeRulesApi } from '@/lib/java-backend-client';

// 禁用缓存，确保数据实时性
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/suppliers/code-rules/[id] - 获取单个编码规则
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await supplierCodeRulesApi.get(parseInt(id));
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// PUT /api/suppliers/code-rules/[id] - 更新编码规则
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // 支持camelCase和snake_case两种格式
    const ruleName = body.ruleName || body.rule_name;
    const elements = body.elements;
    const isActive = body.isActive ?? body.is_active;
    
    // 转换为snake_case格式（Java后端使用snake_case命名策略）
    const javaRequest = {
      rule_name: ruleName,
      elements: elements,
      is_active: isActive,
    };
    
    const result = await supplierCodeRulesApi.update(parseInt(id), javaRequest);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE /api/suppliers/code-rules/[id] - 删除编码规则
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await supplierCodeRulesApi.delete(parseInt(id));
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
