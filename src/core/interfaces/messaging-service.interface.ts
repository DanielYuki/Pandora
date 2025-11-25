import { SendMessageResponse } from '@/types/whatsapp.types';

export interface IMessagingService {
  sendTextMessage(
    to: string,
    text: string,
    replyToMessageId?: string
  ): Promise<SendMessageResponse>;

  markAsRead(messageId: string): Promise<SendMessageResponse>;

  startManagedTyping(to: string, messageId: string): Promise<void>;

  stopManagedTyping(to: string): void;
}
