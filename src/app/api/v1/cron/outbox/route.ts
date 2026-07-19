import { NextResponse } from 'next/server'
import { outboxProcessor } from '@/services/event-bus/OutboxProcessor'
import { registerSubscribers } from '@/services/event-bus/EventSubscribers'

/**
 * POST /api/v1/cron/outbox
 * 
 * Triggered by Vercel Cron (vercel.json) or Railway cron on a schedule.
 * Must be secured — only internal callers with the CRON_SECRET header may invoke it.
 * 
 * Runs one poll cycle of the OutboxProcessor and returns a summary.
 */
export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Ensure handlers are attached (idempotent in production if using a long-lived worker,
    // but necessary here since serverless functions can boot up cold)
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
