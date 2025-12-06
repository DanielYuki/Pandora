import axios, { type AxiosInstance } from 'axios';
import type { MessageResult } from '@/core/entities';
import type { IMessagingService } from '@/core/interfaces/messaging-service.interface';
import config from '@/utils/config';
import logger from '@/utils/logger';

/**
 * WhatsApp adapter for sending messages via WhatsApp Cloud API.
 * Implements IMessagingService interface for Clean Architecture compliance.
 */
export class WhatsAppAdapter implements IMessagingService {
  private client: AxiosInstance;

  constructor() {
    if (!config.WA_PHONE_NUMBER_ID || !config.CLOUD_API_ACCESS_TOKEN) {
      throw new Error(
        'WhatsApp configuration missing: WA_PHONE_NUMBER_ID and CLOUD_API_ACCESS_TOKEN are required'
      );
    }

    this.client = axios.create({
      baseURL: `https://graph.facebook.com/v22.0/${config.WA_PHONE_NUMBER_ID}`,
      headers: {
        Authorization: `Bearer ${config.CLOUD_API_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async sendTextMessage(to: string, text: string): Promise<MessageResult> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text },
      };

      const response = await this.client.post('/messages', payload);

      logger.debug(`Message sent to ${to} | ${response.data.messages?.[0]?.id}`);

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error: unknown) {
      logger.error(
        `Failed to send message to ${to}:`,
        error instanceof Error ? error.message : 'An error occurred'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}
