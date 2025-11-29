import { DomainEvent } from '@/core/interfaces/event-bus.interface';
import { FailedMessage } from '@/core/entities';

export class MessageFailedEvent implements DomainEvent {
  readonly type = 'message.failed';
  readonly timestamp: Date;
  readonly id: string;

  constructor(public readonly payload: FailedMessage) {
    this.timestamp = new Date();
    this.id = `fail_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
