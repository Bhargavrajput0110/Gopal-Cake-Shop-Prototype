import { NextResponse } from 'next/server'
import { outboxProcessor } from '@/services/event-bus/OutboxProcessor'
import { registerSubscribers } from '@/services/event-bus/EventSubscribers'

/**
 * GET /api/v1/cron/outbox  (Vercel Cron uses GET by default)
 * POST /api/v1/cron/outbox (manual trigger)
 *
 * Triggered automatically by Vercel Cron every minute (configured in vercel.json).
 * Vercel automatically sends Authorization: Bearer <CRON_SECRET> when invoking crons.
 *
 * Runs one poll cycle of the OutboxProcessor to process pending outbox events
 * (notifications, etc.) that were queued by API actions like order approval.
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

async function handleCron(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Register event handlers — idempotent, safe to call every time
    registerSubscribers()

    const result = await outboxProcessor.poll()

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      dead: result.dead,
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    console.error('[Cron/Outbox] Poll failed:', err)
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 })
  }
}

// Vercel Cron invokes GET requests
export async function GET(req: Request) {
  return handleCron(req)
}

// Allow manual POST triggers too
export async function POST(req: Request) {
  return handleCron(req)
}
