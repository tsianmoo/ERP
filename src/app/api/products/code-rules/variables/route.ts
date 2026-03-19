import { NextResponse } from 'next/server';
import { codeRulesApi } from '@/lib/java-backend-client';

// GET /api/products/code-rules/variables - 获取可用的编码变量
export async function GET() {
  try {
    const result = await codeRulesApi.getVariables();
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
