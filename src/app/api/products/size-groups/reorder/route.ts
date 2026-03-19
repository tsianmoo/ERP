import { NextRequest, NextResponse } from 'next/server';
import { sizeGroupsApi } from '@/lib/java-backend-client';

// POST /api/products/size-groups/reorder - 尺码组排序
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await sizeGroupsApi.reorder(body.groupIds || body);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
