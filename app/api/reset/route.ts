import { NextResponse } from 'next/server';
import { resetState } from '@/lib/engine/dispatch';

export async function POST() {
  resetState();
  return NextResponse.json({ success: true });
}
