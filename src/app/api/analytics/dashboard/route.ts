import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    stats: {},
    productivity: {},
  });
}
