import { NextResponse } from 'next/server';
import { getState } from '@/lib/engine/dispatch';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = getState();
    return NextResponse.json(
      {
        status: 'ready',
        service: 'breezebyte',
        topology: {
          nodes: state.nodes.length,
          edges: state.edges.length,
          ambulances: state.ambulances.length,
          hospitals: state.hospitals.length,
        },
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ status: 'not_ready' }, { status: 503 });
  }
}
