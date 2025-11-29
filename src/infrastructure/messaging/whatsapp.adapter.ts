import { IMessagingService } from '@/core/interfaces/messaging-service.interface';
import { WhatsAppService } from '@/services/whatsapp.service';
import { SendMessageResponse } from '@/types/whatsapp.types';

export class WhatsAppAdapter implements IMessagingService {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  async sendTextMessage(to: string, text: string): Promise<SendMessageResponse> {
    return this.whatsappService.sendTextMessage(to, text);
  }
}
