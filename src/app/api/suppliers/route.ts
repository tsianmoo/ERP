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

    // 返回格式统一为 { data: [...] }
    const data = result.data as any;
    if (data && data.data) {
      return NextResponse.json(data);
    }
    return NextResponse.json({ data: result.data });
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

    // 支持两种格式：
    // 1. { supplierCode, supplierName, basicInfo, status }
    // 2. { basicInfo: { ...field values }, attributes: { ...attr values } }
    
    let javaRequest: any;
    
    if (body.basicInfo && body.attributes) {
      // 新格式：从 basicInfo 和 attributes 构建
      const basicInfo = body.basicInfo;
      const attributes = body.attributes;
      
      // 获取供应商编码和名称
      const supplierCode = basicInfo['01'] || basicInfo.supplier_code || '';
      const supplierName = basicInfo['01'] || basicInfo.supplier_name || '';
      
      // 合并基本信息和属性到 basicInfo
      const mergedBasicInfo = {
        ...basicInfo,
        _attributes: attributes,
      };
      
      javaRequest = {
        supplier_code: supplierCode,
        supplier_name: supplierName,
        basic_info: mergedBasicInfo,
        status: 'active',
      };
    } else {
      // 旧格式：直接传递
      javaRequest = {
        supplier_code: body.supplierCode || body.supplier_code,
        supplier_name: body.supplierName || body.supplier_name,
        basic_info: body.basicInfo || body.basic_info,
        status: body.status || 'active',
      };
    }

    const result = await suppliersApi.create(javaRequest);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // 解包嵌套的 data.data 结构
    const data = result.data as any;
    if (data && data.data) {
      return NextResponse.json({ data: data.data }, { status: 201 });
    }
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error('创建供应商失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
