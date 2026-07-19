import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Outbox counts to ensure processor isn't completely backed up
    const pendingCount = await prisma.outbox.count({
      where: { status: 'PENDING' }
    });

    const isReady = pendingCount < 5000; // Arbitrary threshold

    if (!isReady) {
      return NextResponse.json({
        status: 'not_ready',
        reason: 'Outbox queue backlogged',
        metrics: { pendingCount }
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'not_ready',
      error: error.message
    }, { status: 503 });
  }
}
