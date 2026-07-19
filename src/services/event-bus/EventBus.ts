export interface DomainEvent {
  eventId: string
  eventType: string
  eventVersion: string
  occurredAt: Date
  payload: any
  correlationId?: string
  actorId?: string
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>
  publishBatch(events: DomainEvent[]): Promise<void>
  publishTransactionally?(
    tx: any,
    eventType: string,
    aggregateId: string,
    correlationId: string | null,
    causationId: string | null,
    payload: any,
    actorId?: string
  ): Promise<void>
}
