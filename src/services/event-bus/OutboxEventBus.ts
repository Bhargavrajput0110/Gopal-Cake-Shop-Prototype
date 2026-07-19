import { Prisma } from '@prisma/client'
import { DomainEvent, EventBus } from './EventBus'

export class OutboxEventBus implements EventBus {
  /**
   * Publishes an event transactionally by writing it to the Outbox table
   * using the provided Prisma transaction client.
   * This guarantees that the event is only published if the parent transaction commits successfully.
   */
  async publishTransactionally(
    tx: Prisma.TransactionClient,
    eventType: string,
    aggregateId: string,
    correlationId: string | null,
    causationId: string | null,
    payload: any,
    actorId?: string
  ): Promise<void> {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await tx.outbox.create({
      data: {
        eventId,
        eventType,
        eventVersion: '1.0',
        aggregateId,
        correlationId,
        causationId,
        payload,
        actorId,
        occurredAt: new Date()
      }
    })
  }

  /**
   * Stub implementation for immediate publishing if not using transactions.
   * In a real system, this might push directly to Redis/Kafka, but in our Outbox pattern,
   * we still just write to the outbox via the global prisma instance.
   */
  async publish(event: DomainEvent): Promise<void> {
    const { prisma } = await import('@/lib/prisma')
    await prisma.outbox.create({
      data: {
        eventId: event.eventId,
        eventType: event.eventType,
        eventVersion: event.eventVersion,
        aggregateId: event.payload?.aggregateId || null,
        correlationId: event.correlationId || null,
        causationId: event.payload?.causationId || null,
        payload: event.payload,
        actorId: event.actorId || null,
        occurredAt: event.occurredAt
      }
    })
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    const { prisma } = await import('@/lib/prisma')
    await prisma.outbox.createMany({
      data: events.map(event => ({
        eventId: event.eventId,
        eventType: event.eventType,
        eventVersion: event.eventVersion,
        aggregateId: event.payload?.aggregateId || null,
        correlationId: event.correlationId || null,
        causationId: event.payload?.causationId || null,
        payload: event.payload,
        actorId: event.actorId || null,
        occurredAt: event.occurredAt
      }))
    })
  }
}
