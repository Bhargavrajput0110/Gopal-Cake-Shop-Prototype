import { PrismaClient, Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '@/lib/prisma';

export class TimelineService {
  /**
   * Creates a timeline event and an outbox event in the same transaction.
   * If `tx` is provided, it uses the provided transaction.
   * Otherwise, it opens its own transaction.
   */
  static async create(
    params: Prisma.TimelineUncheckedCreateInput,
    tx?: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
  ) {
    const db = tx || defaultPrisma;

    if (!tx) {
      return defaultPrisma.$transaction(async (t) => {
        return this.createInner(params, t);
      });
    }

    return this.createInner(params, db);
  }

  private static async createInner(
    params: Prisma.TimelineUncheckedCreateInput,
    tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
  ) {
    // 1. Create the timeline event
    const timelineEvent = await tx.timeline.create({
      data: params
    });

    // 2. Create the outbox event for TIMELINE_CREATED
    // The eventId guarantees uniqueness and idempotency linking
    await tx.outbox.create({
      data: {
        eventId: timelineEvent.id, 
        eventType: 'TIMELINE_CREATED',
        eventVersion: '1.0',
        aggregateId: timelineEvent.orderId,
        actorId: timelineEvent.actorId,
        payload: timelineEvent as any, // Serialize timeline event as payload
        status: 'PENDING'
      }
    });

    return timelineEvent;
  }
}
