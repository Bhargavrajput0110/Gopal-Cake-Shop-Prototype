import { prisma } from '@/lib/prisma'
import { LoggerService } from '@/services/LoggerService'

/** Maximum delivery attempts before an event is moved to DLQ (dead) */
const MAX_RETRIES = 3

/** Poll batch size — avoid overloading on large backlogs */
const BATCH_SIZE = 50

/**
 * OutboxProcessor
 *
 * Implements the Transactional Outbox pattern's background publisher.
 * Polls for unpublished Outbox rows and dispatches them to subscribers.
 *
 * Design guarantees:
 *  - At-least-once delivery: if the process crashes after sending but before
 *    marking published=true, the row will be retried on the next poll cycle.
 *  - Idempotency is the subscriber's responsibility (via eventId dedup).
 *  - Events that exceed MAX_RETRIES are flagged as dead and moved to DLQ log.
 *
 * In production, this runs as a cron job or background worker (e.g. Vercel Cron,
 * Railway worker, or a separate Node process).
 */
export class OutboxProcessor {
  private handlers: Map<string, ((payload: any, eventId: string) => Promise<void>)[]> = new Map()

  /**
   * Register a handler for a specific eventType.
   * Multiple handlers can be registered per eventType (fan-out).
   */
  subscribe(eventType: string, handler: (payload: any, eventId: string) => Promise<void>): void {
    const existing = this.handlers.get(eventType) || []
    this.handlers.set(eventType, [...existing, handler])
  }

  /**
   * Poll for unpublished Outbox rows and dispatch them.
   * Should be called on a recurring schedule (e.g. every 5s or via cron).
   *
   * Returns the number of events successfully processed.
   */
  async poll(): Promise<{ processed: number; failed: number; dead: number }> {
    const rows = await prisma.outbox.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        retryCount: { lt: MAX_RETRIES }
      },
      orderBy: { occurredAt: 'asc' },
      take: BATCH_SIZE
    })

    let processed = 0
    let failed = 0
    let dead = 0

    for (const row of rows) {
      try {
        await this.dispatch(row)

        // Mark published atomically — if this crashes before writing, the row
        // remains unpublished and will be retried (at-least-once delivery).
        await prisma.outbox.update({
          where: { id: row.id },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
            error: null
          }
        })

        processed++
        LoggerService.info(`[OutboxProcessor] Published: ${row.eventType} (${row.eventId})`)
      } catch (err: any) {
        failed++
        const nextRetry = row.retryCount + 1
        const isDead = nextRetry >= MAX_RETRIES

        await prisma.outbox.update({
          where: { id: row.id },
          data: {
            retryCount: { increment: 1 },
            error: err?.message || 'Unknown error',
            status: 'FAILED'
          }
        })

        if (isDead) {
          dead++
          LoggerService.error(`[OutboxProcessor] DLQ: ${row.eventType} (${row.eventId}) exceeded MAX_RETRIES`, { error: err?.message })
        } else {
          LoggerService.warn(`[OutboxProcessor] Retry ${nextRetry}/${MAX_RETRIES}: ${row.eventType} (${row.eventId})`, { error: err?.message })
        }
      }
    }

    return { processed, failed, dead }
  }

  /**
   * Retrieve events that have exceeded MAX_RETRIES (Dead Letter Queue).
   */
  async getDLQ(): Promise<any[]> {
    return prisma.outbox.findMany({
      where: {
        status: 'FAILED',
        retryCount: { gte: MAX_RETRIES }
      },
      orderBy: { occurredAt: 'desc' }
    })
  }

  /**
   * Manually reprocess a dead event (resets retryCount so it can be retried).
   */
  async reprocess(outboxId: string): Promise<void> {
    await prisma.outbox.update({
      where: { id: outboxId },
      data: {
        retryCount: 0,
        error: null,
        status: 'PENDING'
      }
    })
    LoggerService.info(`[OutboxProcessor] Requeued dead event: ${outboxId}`)
  }

  /**
   * Internal dispatcher — calls all registered handlers for the event's type.
   * Throws if any handler fails (triggering the retry path in poll()).
   */
  private async dispatch(row: {
    eventId: string
    eventType: string
    payload: any
    eventVersion: string
  }): Promise<void> {
    const handlers = this.handlers.get(row.eventType)

    if (!handlers || handlers.length === 0) {
      // No subscriber registered — log and treat as successfully processed
      // (avoids infinite retry for intentionally unsubscribed event types)
      LoggerService.info(`[OutboxProcessor] No handler for eventType: ${row.eventType} — skipping`)
      return
    }

    // Fan-out: all handlers run concurrently, any failure throws
    await Promise.all(handlers.map(h => h(row.payload, row.eventId)))
  }
}

/** Singleton for use in background worker / cron route */
export const outboxProcessor = new OutboxProcessor()
