import { Prisma } from '@prisma/client'
import { OutboxEventBus } from '@/services/event-bus/OutboxEventBus'

const eventBus = new OutboxEventBus()

export const OutboxService = {
  async publish(eventType: string, aggregateId: string, payload: any, tx: Prisma.TransactionClient) {
    await eventBus.publishTransactionally(
      tx,
      eventType,
      aggregateId,
      null, // correlationId
      null, // causationId
      payload,
      payload?.createdById // actorId
    )
  }
}
