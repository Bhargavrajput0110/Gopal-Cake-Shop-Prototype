import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withApiHandler } from '@/lib/withApiHandler';

export const GET = withApiHandler(async () => {
  const start = Date.now();
  let dbStatus = 'healthy';
  let dbLatency = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - start;
  } catch (error) {
    dbStatus = 'unhealthy';
  }

  const outboxMetrics = await prisma.outbox.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  const formattedOutbox = outboxMetrics.reduce((acc: any, curr) => {
    acc[curr.status] = curr._count.id;
    return acc;
  }, { PENDING: 0, PROCESSED: 0, FAILED: 0 });

  return NextResponse.json({
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatency
    },
    outbox: formattedOutbox,
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
  });
}, false, 'manage_settings');
