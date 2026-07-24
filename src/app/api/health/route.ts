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

  // 1. Check database connection
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'unhealthy';
  }

  // 2. Check Redis/Upstash connection
  const redisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const redisStatus = redisConfigured ? 'configured' : 'missing';

  // 3. Check Cloudinary
  const cloudinaryConfigured = !!process.env.CLOUDINARY_URL;
  const cloudinaryStatus = cloudinaryConfigured ? 'configured' : 'missing';

  // 4. Check Razorpay
  const razorpayConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const razorpayStatus = razorpayConfigured ? 'configured' : 'missing';

  // 5. Check Maps Provider
  const mapsProvider = process.env.DISTANCE_PROVIDER || 'manual';
  const mapsStatus = mapsProvider === 'google' && !process.env.GOOGLE_MAPS_API_KEY 
    ? 'invalid_config' 
    : 'configured';

  const isHealthy = dbStatus === 'healthy';

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
      cloudinary: cloudinaryStatus,
      razorpay: razorpayStatus,
      maps: {
        provider: mapsProvider,
        status: mapsStatus
      }
    }
  }, { status: isHealthy ? 200 : 503 })
}

export const GET = withApiHandler(handler, true)
