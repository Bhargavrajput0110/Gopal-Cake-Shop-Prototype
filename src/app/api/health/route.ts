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

  // Check database connection
  await prisma.$queryRaw`SELECT 1`
  return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() })
}

export const GET = withApiHandler(handler, true)
