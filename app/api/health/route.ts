import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestId = request.headers.get('x-request-id') || undefined;
  return NextResponse.json(
    {
      status: 'ok',
      service: 'breezebyte',
      timestamp: new Date().toISOString(),
      requestId,
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
