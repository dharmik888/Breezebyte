import { NextResponse } from 'next/server';
import { getGraphData } from '@/lib/engine/dispatch';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const full = url.searchParams.get('detail') === 'full';
  const data = getGraphData(!full);
  return NextResponse.json(data, {
    headers: {
      'cache-control': 'no-store',
      'x-topology-representation': data.metadata.representation,
    },
  });
}
