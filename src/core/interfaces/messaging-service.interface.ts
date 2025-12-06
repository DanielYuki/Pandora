import type { MessageResult } from '@/core/entities';

export interface IMessagingService {
  sendTextMessage(to: string, text: string): Promise<MessageResult>;
}
