import { DomainEvent } from '@/core/interfaces/event-bus.interface';

export interface MessageFailedPayload {
  messageId: string;
  from: string;
  platform: string;
  error: string;
  retryable: boolean;
}

export class MessageFailedEvent implements DomainEvent {
  readonly type = 'message.failed';
  readonly timestamp: Date;
  readonly id: string;

  constructor(public readonly payload: MessageFailedPayload) {
    this.timestamp = new Date();
    this.id = `fail_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

