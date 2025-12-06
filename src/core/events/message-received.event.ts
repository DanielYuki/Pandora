import type { IncomingMessage } from '@/core/entities';
import type { DomainEvent } from '@/core/interfaces/event-bus.interface';

export class MessageReceivedEvent implements DomainEvent {
  readonly type = 'message.received';
  readonly timestamp: Date;
  readonly id: string;

  constructor(public readonly payload: IncomingMessage) {
    this.timestamp = new Date();
    this.id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
