import { NextResponse } from 'next/server';
import { getTelemetry } from '@/lib/engine/dispatch';

export async function GET() {
  const data = getTelemetry();
  return NextResponse.json(data);
}
