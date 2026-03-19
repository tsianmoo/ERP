import { NextRequest, NextResponse } from 'next/server';
import { codeRulesApi } from '@/lib/java-backend-client';

// GET /api/products/code-rules - 获取编码规则列表
export async function GET() {
  try {
    const result = await codeRulesApi.list();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('获取编码规则列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/products/code-rules - 创建编码规则
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const javaRequest = {
      ruleName: body.ruleName,
      elements: body.elements || [],
      barcodeElements: body.barcodeElements || [],
      barcodeEnabled: body.barcodeEnabled ?? false,
      barcodeSuffix: body.barcodeSuffix || '',
      isActive: body.isActive ?? true,
    };

    const result = await codeRulesApi.create(javaRequest);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('创建编码规则失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
