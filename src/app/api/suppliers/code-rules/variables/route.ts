import { NextResponse } from 'next/server';
import { supplierCodeRulesApi } from '@/lib/java-backend-client';

// 禁用缓存，确保数据实时性
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/suppliers/code-rules/variables - 获取可用的编码变量
export async function GET() {
  try {
    const result = await supplierCodeRulesApi.getVariables();
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
