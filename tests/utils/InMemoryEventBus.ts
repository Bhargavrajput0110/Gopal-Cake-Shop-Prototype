import { EventBus, DomainEvent } from '@/services/event-bus/EventBus'

export class InMemoryEventBus implements EventBus {
  public publishedEvents: DomainEvent[] = []

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event)
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    this.publishedEvents.push(...events)
  }

  clear() {
    this.publishedEvents = []
  }

  getEventsByType(eventType: string) {
    return this.publishedEvents.filter(e => e.eventType === eventType)
  }
}
