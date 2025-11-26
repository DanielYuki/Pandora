import { IMessagingService } from '@/core/interfaces/messaging-service.interface';
import { SendMessageResponse } from '@/types/whatsapp.types';
import logger from '@/utils/logger';

/**
 * Telegram adapter stub - implement when needed
 */
export class TelegramAdapter implements IMessagingService {
  constructor(private botToken?: string) {
    logger.warn('TelegramAdapter is a stub - implement when needed');
  }

  async sendTextMessage(
    to: string,
    text: string,
    _replyToMessageId?: string
  ): Promise<SendMessageResponse> {
    logger.info(`[Telegram Stub] Would send to ${to}: ${text}`);
    return { success: true, messageId: `telegram_${Date.now()}` };
  }

  async markAsRead(_messageId: string): Promise<SendMessageResponse> {
    return { success: true };
  }

  async startManagedTyping(_to: string, _messageId: string): Promise<void> {
    // Telegram typing indicator stub
  }

  stopManagedTyping(_to: string): void {
    // Telegram stop typing stub
  }
}

