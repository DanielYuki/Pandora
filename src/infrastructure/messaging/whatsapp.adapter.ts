import { IMessagingService } from '@/core/interfaces/messaging-service.interface';
import { WhatsAppService } from '@/services/whatsapp.service';
import { SendMessageResponse } from '@/types/whatsapp.types';

export class WhatsAppAdapter implements IMessagingService {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  async sendTextMessage(
    to: string,
    text: string,
    replyToMessageId?: string
  ): Promise<SendMessageResponse> {
    return this.whatsappService.sendTextMessage(to, text, replyToMessageId);
  }

  async markAsRead(messageId: string): Promise<SendMessageResponse> {
    return this.whatsappService.markAsRead(messageId);
  }

  async startManagedTyping(to: string, messageId: string): Promise<void> {
    return this.whatsappService.startManagedTyping(to, messageId);
  }

  stopManagedTyping(to: string): void {
    return this.whatsappService.stopManagedTyping(to);
  }
}
