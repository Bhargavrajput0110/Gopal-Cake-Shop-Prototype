import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { prisma } from '@/lib/prisma'

import { HandlerContext } from '@/lib/withApiHandler'

const handler = async (ctx: HandlerContext) => {
  const forceError = ctx.req.nextUrl.searchParams.get('force-error')
  if (forceError === 'zod') {
    const { ZodError, ZodIssueCode } = require('zod')
    throw new ZodError([{ code: ZodIssueCode.custom, path: ['testField'], message: 'Zod test error' }])
  }
  if (forceError === 'standard') {
    const err = new Error('Standard test error') as any
    err.code = 'TEST_ERROR'
    err.status = 400
    throw err
  }

  // 0. Check Graceful Shutdown State
  if ((global as any).isShuttingDown) {
    return NextResponse.json({
      status: 'shutting_down',
      database: 'disconnected',
    }, { status: 503 })
  }

  // 1. Check database connection
  let dbStatus = 'connected';
  let isReady = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'disconnected';
    isReady = false;
  }

  // NOTE: When Redis is added, perform a ping here and update isReady accordingly.

  return NextResponse.json({
    status: isReady ? 'ready' : 'unavailable',
    database: dbStatus,
  }, { status: isReady ? 200 : 503 })
}

export const GET = withApiHandler(handler, true)
