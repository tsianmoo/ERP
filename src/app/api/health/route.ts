import { NextRequest, NextResponse } from 'next/server';

// GET /api/health - 健康检查代理
export async function GET(request: NextRequest) {
  try {
    const javaBackendUrl = process.env.JAVA_BACKEND_URL || 'http://localhost:8080';
    
    const response = await fetch(`${javaBackendUrl}/api/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          status: 'DOWN',
          error: `Backend returned ${response.status}`,
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'DOWN',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
