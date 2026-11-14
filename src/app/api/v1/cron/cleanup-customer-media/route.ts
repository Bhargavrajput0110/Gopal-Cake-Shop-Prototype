import { NextResponse } from 'next/server'
import { CustomerMediaRetentionService } from '@/services/CustomerMediaRetentionService'

/**
 * GET /api/v1/cron/cleanup-customer-media  (Vercel Cron uses GET)
 * POST /api/v1/cron/cleanup-customer-media (Manual trigger)
 *
 * Automatically deletes temporary customer-uploaded media from Cloudinary
 * (reference cake images & sugar-sheet photo print images) after 48 hours
 * from when the order was DELIVERED or CANCELLED.
 *
 * Configured in vercel.json to run on a scheduled cadence (e.g. daily or hourly).
 */

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET

  // If no secret is configured, allow all calls (development/early setup mode)
  if (!cronSecret) return true

  const authHeader = req.headers.get('authorization')
  const xCronSecret = req.headers.get('x-cron-secret')

  // Vercel Cron sends: Authorization: Bearer <secret>
  if (authHeader === `Bearer ${cronSecret}`) return true
  // Manual trigger can use X-Cron-Secret header
  if (xCronSecret === cronSecret) return true

  return false
}

async function handleCleanup(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(req.url)
    const hoursParam = url.searchParams.get('hours')
    const retentionHours = hoursParam ? parseInt(hoursParam, 10) : undefined

    const result = await CustomerMediaRetentionService.cleanupExpiredMedia({
      retentionHours
    })

    return NextResponse.json({
      success: result.success,
      retentionHours: retentionHours || CustomerMediaRetentionService.RETENTION_HOURS,
      processedOrders: result.processedOrders,
      deletedMediaCount: result.deletedMediaCount,
      failedMediaCount: result.failedMediaCount,
      ordersCleaned: result.ordersCleaned,
      errors: result.errors,
      timestamp: result.timestamp
    })
  } catch (err: any) {
    console.error('[Cron/CleanupCustomerMedia] Execution failed:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Vercel Cron calls GET
export async function GET(req: Request) {
  return handleCleanup(req)
}

// Allow manual POST triggers
export async function POST(req: Request) {
  return handleCleanup(req)
}

