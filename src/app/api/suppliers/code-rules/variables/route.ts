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
    
    // Java 后端已经返回 { data: {...} } 格式，这里需要解包
    let data = result.data as any;
    
    // 如果是嵌套的 data.data 结构，解包一层
    if (data && data.data) {
      data = data.data;
    }
    
    // 如果数据中没有 productAttributes，则手动添加
    if (data && !data.productAttributes) {
      // 从商品属性 API 获取数据
      try {
        const attrsResponse = await fetch(`${process.env.JAVA_BACKEND_URL || 'http://localhost:8080'}/api/products/attributes`);
        if (attrsResponse.ok) {
          const attrsData = await attrsResponse.json();
          const attributes = attrsData.data || attrsData;
          
          data.productAttributes = attributes.map((attr: any) => ({
            value: `product_${attr.code}`,
            label: attr.name,
            description: `商品属性：${attr.name}`
          }));
        }
      } catch (e) {
        console.warn('Failed to fetch product attributes:', e);
        data.productAttributes = [];
      }
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
