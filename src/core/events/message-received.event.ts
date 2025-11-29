import { DomainEvent } from '@/core/interfaces/event-bus.interface';

export interface MessageReceivedPayload {
  messageId: string;
  from: string;
  platform: string;
  content: string;
  contactName?: string;
}

export class MessageReceivedEvent implements DomainEvent {
  readonly type = 'message.received';
  readonly timestamp: Date;
  readonly id: string;

  constructor(public readonly payload: MessageReceivedPayload) {
    this.timestamp = new Date();
    this.id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
