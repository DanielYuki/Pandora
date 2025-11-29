import { DomainEvent } from '@/core/interfaces/event-bus.interface';
import { ProcessedMessage } from '@/core/entities';

export class MessageProcessedEvent implements DomainEvent {
  readonly type = 'message.processed';
  readonly timestamp: Date;
  readonly id: string;

  constructor(public readonly payload: ProcessedMessage) {
    this.timestamp = new Date();
    this.id = `proc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
