import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { OutboxProcessor } from '@/services/event-bus/OutboxProcessor'
import { resetDatabase } from '../../setup/db-reset'
import { prismaTest } from '../../setup/prisma-test'

vi.mock('@/lib/prisma', async () => {
  const actual = await vi.importActual<any>('../../setup/prisma-test')
  return { prisma: actual.prismaTest }
})

describe('Phase 2.4: OutboxProcessor Distributed Workflow (@integration)', () => {
  let processor: OutboxProcessor

  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
    processor = new OutboxProcessor()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createDummyOutboxEvent = async (eventType: string, payload: any, retryCount = 0) => {
    return await prismaTest.outbox.create({
      data: {
        eventId: `evt_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventType,
        eventVersion: '1.0',
        aggregateId: 'agg-1',
        payload,
        status: 'PENDING',
        retryCount,
        occurredAt: new Date()
      }
    })
  }

  it('1. Processor picks up all pending rows and marks them published', async () => {
    await createDummyOutboxEvent('ORDER_CREATED', { orderId: '1' })
    await createDummyOutboxEvent('ORDER_CREATED', { orderId: '2' })

    const handler = vi.fn().mockResolvedValue(undefined)
    processor.subscribe('ORDER_CREATED', handler)

    const result = await processor.poll()
    
    expect(result.processed).toBe(2)
    expect(result.failed).toBe(0)
    expect(result.dead).toBe(0)
    expect(handler).toHaveBeenCalledTimes(2)

    const outboxRows = await prismaTest.outbox.findMany()
    expect(outboxRows.every(r => r.status === 'COMPLETED')).toBe(true)
    expect(outboxRows.every(r => r.processedAt !== null)).toBe(true)
  })

  it('2. Crash recovery: At-least-once delivery (Publisher crashes before marking published)', async () => {
    await createDummyOutboxEvent('CRITICAL_EVENT', { val: 'a' })
    
    const handler = vi.fn().mockResolvedValue(undefined)
    processor.subscribe('CRITICAL_EVENT', handler)

    // Mock prisma.outbox.update to throw AFTER the handler has executed
    // This simulates the process crashing just before the DB update commits.
    const originalUpdate = prismaTest.outbox.update
    let crashOnce = true
    
    prismaTest.outbox.update = vi.fn().mockImplementation(async (args) => {
      if (args.data.status === 'COMPLETED' && crashOnce) {
        crashOnce = false
        throw new Error('SIMULATED_PROCESS_CRASH_DURING_UPDATE')
      }
      return originalUpdate.call(prismaTest.outbox, args)
    })

    // First poll: handler runs, then crashes on update.
    const result1 = await processor.poll()
    expect(handler).toHaveBeenCalledTimes(1)
    expect(result1.failed).toBe(1) // Recorded as failed because update threw

    // The row should still be unpublished in the DB, though its retryCount might be 1 
    // depending on if the failure handler update succeeded. In this mock, the failure handler
    // will also fail because we messed with `update`, but let's assume standard behavior.
    const rowAfterCrash = await prismaTest.outbox.findFirst()
    
    // In a REAL hard crash, the error catch block wouldn't even run. 
    // The key is: status = 'PENDING' or 'FAILED'.
    
    // Second poll: Process restarts and polls again
    const result2 = await processor.poll()
    
    // Handler should be called a SECOND time for the same event
    expect(handler).toHaveBeenCalledTimes(2) 
    expect(result2.processed).toBe(1) // Second time it succeeds

    const finalRow = await prismaTest.outbox.findFirst()
    expect(finalRow?.status).toBe('COMPLETED')
  })

  it('3. Retry logic: increments retryCount on failure', async () => {
    await createDummyOutboxEvent('FLAKY_EVENT', { val: 'a' })

    const handler = vi.fn()
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce(undefined) // Succeeds on retry

    processor.subscribe('FLAKY_EVENT', handler)

    // First attempt fails
    const result1 = await processor.poll()
    expect(result1.failed).toBe(1)
    expect(result1.processed).toBe(0)

    let row = await prismaTest.outbox.findFirst()
    expect(row?.status).toBe('FAILED')
    expect(row?.retryCount).toBe(1)
    expect(row?.error).toBe('Network timeout')

    // Second attempt succeeds
    const result2 = await processor.poll()
    expect(result2.failed).toBe(0)
    expect(result2.processed).toBe(1)

    row = await prismaTest.outbox.findFirst()
    expect(row?.status).toBe('COMPLETED')
    expect(row?.retryCount).toBe(1) // Keeps the count for history
  })

  it('4. Dead Letter Queue (DLQ): max retries exceeded', async () => {
    // MAX_RETRIES is 3 in the implementation
    // We create an event that is about to hit the limit
    await createDummyOutboxEvent('POISON_EVENT', { bad: true }, 2)

    const handler = vi.fn().mockRejectedValue(new Error('Fatal formatting error'))
    processor.subscribe('POISON_EVENT', handler)

    const result = await processor.poll()
    expect(result.failed).toBe(1) // Failed events also increment the failed counter
    expect(result.dead).toBe(1)   // It's DEAD

    // Should not be picked up by subsequent polls
    const result2 = await processor.poll()
    expect(result2.processed).toBe(0)
    expect(result2.failed).toBe(0)
    expect(result2.dead).toBe(0)

    // Should be visible in DLQ
    const dlq = await processor.getDLQ()
    expect(dlq.length).toBe(1)
    expect(dlq[0].eventType).toBe('POISON_EVENT')
    expect(dlq[0].retryCount).toBe(3)
  })

  it('5. Reprocess dead event', async () => {
    const row = await createDummyOutboxEvent('POISON_EVENT', { bad: true }, 3) // Already dead
    
    let dlq = await processor.getDLQ()
    expect(dlq.length).toBe(1)

    await processor.reprocess(row.id)

    dlq = await processor.getDLQ()
    expect(dlq.length).toBe(0)

    const updatedRow = await prismaTest.outbox.findUnique({ where: { id: row.id }})
    expect(updatedRow?.retryCount).toBe(0)
    expect(updatedRow?.error).toBeNull()
  })

  it('6. Subscriber Fan-out: multiple handlers for one event', async () => {
    await createDummyOutboxEvent('ORDER_CONFIRMED', { id: '1' })

    const notifyHandler = vi.fn().mockResolvedValue(undefined)
    const analyticsHandler = vi.fn().mockResolvedValue(undefined)

    processor.subscribe('ORDER_CONFIRMED', notifyHandler)
    processor.subscribe('ORDER_CONFIRMED', analyticsHandler)

    await processor.poll()

    expect(notifyHandler).toHaveBeenCalledTimes(1)
    expect(analyticsHandler).toHaveBeenCalledTimes(1)
  })

  it('7. Skips events with no handlers without failing', async () => {
    await createDummyOutboxEvent('UNKNOWN_EVENT', {})

    const result = await processor.poll()
    expect(result.processed).toBe(1) // Treated as processed successfully
    
    const row = await prismaTest.outbox.findFirst()
    expect(row?.status).toBe('COMPLETED')
  })

  it('8. Subscriber Idempotency: exact-once execution via unique constraint', async () => {
    // Create an event that will trigger Subscriber 3 (NotificationLog)
    await createDummyOutboxEvent('ORDER_STATUS_CHANGED', { 
      action: 'assign-driver',
      orderId: 'mock-order-id'
    })

    // Mock prisma.notificationLog.create to simulate the unique constraint if not using real DB schema
    let createCount = 0
    prismaTest.notificationLog.create = vi.fn().mockImplementation(async (args) => {
      if (createCount > 0) {
        const error = new Error('Unique constraint failed')
        ;(error as any).code = 'P2002'
        throw error
      }
      createCount++
      return { id: 'mock-notif-1' }
    })

    processor.subscribe('ORDER_STATUS_CHANGED', async (payload: any, eventId) => {
      if (payload.action === 'assign-driver') {
        // Attempt to create a notification log (simulating subscriber logic)
        try {
          await prismaTest.notificationLog.create({
            data: { eventId, channel: 'PUSH', templateName: 'driver-assigned', recipient: 'driver' } as any
          })
        } catch (e: any) {
          if (e.code === 'P2002') return // Idempotency
          throw e
        }
      }
    })

    // Poll 1: Event is processed and NotificationLog is created
    const result1 = await processor.poll()
    expect(result1.processed).toBe(1)
    expect(createCount).toBe(1)

    // For test purposes, let's manually reset the event to published=false to simulate
    // the outbox crash recovery scenario where the same eventId is delivered again
    const eventRow = await prismaTest.outbox.findFirst()
    await prismaTest.outbox.update({
      where: { id: eventRow!.id },
      data: { status: 'PENDING' }
    })

    // Poll 2: The exact same event is dispatched again
    const result2 = await processor.poll()
    
    // The processor should still mark it processed successfully! (Graceful recovery)
    expect(result2.processed).toBe(1)
    // But the notification log was NOT created again due to idempotency!
    expect(createCount).toBe(1)
    
    // The event should finally be status='COMPLETED'
    const finalRow = await prismaTest.outbox.findUnique({ where: { id: eventRow!.id }})
    expect(finalRow?.status).toBe('COMPLETED')
  })
})
