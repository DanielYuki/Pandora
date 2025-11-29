import { IMessagingService } from '@/core/interfaces/messaging-service.interface';
import { MessageResult } from '@/core/entities';
import { WhatsAppService } from '@/services/whatsapp.service';

export class WhatsAppAdapter implements IMessagingService {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  async sendTextMessage(to: string, text: string): Promise<MessageResult> {
    return this.whatsappService.sendTextMessage(to, text);
  }
}
