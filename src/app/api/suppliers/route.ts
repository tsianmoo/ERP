import { NextRequest, NextResponse } from 'next/server';
import { suppliersApi } from '@/lib/java-backend-client';

// GET /api/suppliers - 获取所有供应商
export async function GET() {
  try {
    const result = await suppliersApi.list();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('获取供应商列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/suppliers - 创建供应商
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const javaRequest = {
      supplierCode: body.supplierCode,
      supplierName: body.supplierName,
      basicInfo: body.basicInfo,
      status: body.status || 'active',
    };

    const result = await suppliersApi.create(javaRequest);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('创建供应商失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
