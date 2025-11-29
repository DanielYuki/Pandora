import { IMessagingService } from '@/core/interfaces/messaging-service.interface';
import { MessageResult } from '@/core/entities';
import logger from '@/utils/logger';

/**
 * Telegram adapter stub - implement when needed
 */
export class TelegramAdapter implements IMessagingService {
  constructor(_botToken?: string) {
    logger.warn('TelegramAdapter is a stub - implement when needed');
  }

  async sendTextMessage(to: string, text: string): Promise<MessageResult> {
    logger.info(`[Telegram Stub] Would send to ${to}: ${text}`);
    return { success: true, messageId: `telegram_${Date.now()}` };
  }
}
