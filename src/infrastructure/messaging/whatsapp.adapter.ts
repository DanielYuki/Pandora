import { IMessagingService } from '@/core/interfaces/messaging-service.interface';
import { MessageResult } from '@/core/entities';
import axios, { AxiosInstance } from 'axios';
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
      baseURL: `https://graph.facebook.com/${config.CLOUD_API_VERSION}/${config.WA_PHONE_NUMBER_ID}`,
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
    } catch (error: any) {
      logger.error(`Failed to send message to ${to}:`, error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }
}
