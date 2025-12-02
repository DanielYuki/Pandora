import { IMessagingService } from '@/core/interfaces/messaging-service.interface';
import { MessageResult } from '@/core/entities';
import axios, { AxiosInstance } from 'axios';
import config from '@/utils/config';
import logger from '@/utils/logger';

/**
 * Telegram adapter for sending messages via Telegram Bot API.
 * Implements IMessagingService interface for Clean Architecture compliance.
 */
export class TelegramAdapter implements IMessagingService {
  private client: AxiosInstance;

  constructor() {
    if (!config.TELEGRAM_BOT_TOKEN) {
      throw new Error('Telegram configuration missing: TELEGRAM_BOT_TOKEN is required');
    }

    this.client = axios.create({
      baseURL: `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async sendTextMessage(to: string, text: string): Promise<MessageResult> {
    try {
      const payload = {
        chat_id: to,
        text: text,
        parse_mode: 'HTML',
      };

      const response = await this.client.post('/sendMessage', payload);

      logger.debug(`Telegram message sent to ${to} | ${response.data.result.message_id}`);

      return {
        success: true,
        messageId: response.data.result.message_id?.toString(),
      };
    } catch (error: any) {
      logger.error(
        `Failed to send Telegram message to ${to}:`,
        error.response?.data || error.message
      );

      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }
}
