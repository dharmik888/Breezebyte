import { NextResponse } from 'next/server';
import { getMetricsSnapshot } from '@/lib/observability/metrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getMetricsSnapshot(), {
    headers: { 'cache-control': 'no-store' },
  });
}
