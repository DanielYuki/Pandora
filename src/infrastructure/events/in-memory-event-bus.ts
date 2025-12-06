import type { DomainEvent, EventHandler, IEventBus } from '@/core/interfaces';
import logger from '@/utils/logger';

export class InMemoryEventBus implements IEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  async publish(event: DomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.type);

    if (!eventHandlers || eventHandlers.size === 0) {
      logger.debug(`No handlers for event: ${event.type}`);
      return;
    }

    logger.debug(`Publishing event: ${event.type} (${event.id})`);

    const handlerPromises = Array.from(eventHandlers).map(async handler => {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`Handler error for ${event.type}:`, error);
      }
    });

    await Promise.all(handlerPromises);
  }

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)?.add(handler);
    logger.debug(`Subscribed to event: ${eventType}`);
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(eventType);
    if (eventHandlers) {
      eventHandlers.delete(handler);
    }
  }
}
