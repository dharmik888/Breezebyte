import { NextResponse } from 'next/server';
import { injectRequest } from '@/lib/engine/dispatch';
import type { DispatchRequest } from '@/lib/engine/types';
import { incrementCounter } from '@/lib/observability/metrics';

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  incrementCounter('http_requests_total');
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    incrementCounter('http_errors_total');
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }

  try {
    const body = (await request.json()) as Partial<DispatchRequest>;
    const fields = ['requestId', 'villageId', 'urgency', 'specialty'] as const;
    const valid = fields.every((field) => typeof body[field] === 'string' && body[field]!.length > 0 && body[field]!.length <= 128);
    if (!valid) {
      incrementCounter('http_errors_total');
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    const result = injectRequest(body as DispatchRequest);
    return NextResponse.json(result);
  } catch (error) {
    incrementCounter('http_errors_total');
    const message = error instanceof Error ? error.message : 'Dispatch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
