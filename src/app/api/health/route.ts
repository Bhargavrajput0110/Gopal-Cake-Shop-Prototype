import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      version: '1.1.0-rc1',
    },
    { status: 200 }
  );
}
