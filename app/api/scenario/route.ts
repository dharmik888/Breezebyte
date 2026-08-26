import { NextResponse } from 'next/server';
import { blockEdge, unblockEdge, resetState } from '@/lib/engine/dispatch';

export async function POST(request: Request) {
  const body = await request.json();
  const { action, edgeId } = body as { action: string; edgeId?: string };

  if (action === 'block' && edgeId) {
    blockEdge(edgeId);
  } else if (action === 'unblock' && edgeId) {
    unblockEdge(edgeId);
  } else if (action === 'reset') {
    resetState();
  }

  return NextResponse.json({ success: true });
}
