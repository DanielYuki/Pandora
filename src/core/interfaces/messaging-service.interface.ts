import { SendMessageResponse } from '@/types/whatsapp.types';

export interface IMessagingService {
  sendTextMessage(to: string, text: string): Promise<SendMessageResponse>;
}
