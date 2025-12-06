import type { ProcessedMessage } from '@/core/entities';
import type { DomainEvent } from '@/core/interfaces/event-bus.interface';

export class MessageProcessedEvent implements DomainEvent {
  readonly type = 'message.processed';
  readonly timestamp: Date;
  readonly id: string;

  constructor(public readonly payload: ProcessedMessage) {
    this.timestamp = new Date();
    this.id = `proc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
