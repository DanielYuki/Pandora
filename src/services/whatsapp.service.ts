import axios, { AxiosInstance } from 'axios';
import config from '@/utils/config';
import logger from '@/utils/logger';
import { SendMessageResponse } from '@/types/whatsapp.types';

export class WhatsAppService {
  private client: AxiosInstance;
  private phoneNumberId: string;
  private typingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private typingCounts: Map<string, number> = new Map();
  private readonly TYPING_DURATION = 25000; // 25 seconds
  private readonly TYPING_CYCLES_BEFORE_MESSAGE = 3;

  constructor() {
    this.phoneNumberId = config.WA_PHONE_NUMBER_ID;

    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${config.CLOUD_API_VERSION}/${this.phoneNumberId}`,
      headers: {
        Authorization: `Bearer ${config.CLOUD_API_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async sendTextMessage(
    to: string,
    text: string,
    replyToMessageId?: string
  ): Promise<SendMessageResponse> {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text },
      };

      if (replyToMessageId) {
        payload.context = { message_id: replyToMessageId };
      }

      const response = await this.client.post('/messages', payload);

      logger.debug(`💬 Text sent to ${to} | ${response.data.messages?.[0]?.id}`);

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error: any) {
      logger.error(`💬 Failed to send text to ${to}:`, error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async markAsRead(messageId: string): Promise<SendMessageResponse> {
    try {
      await this.client.post('/messages', {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      });

      logger.debug(`👀 Marked as read: ${messageId}`);

      return { success: true };
    } catch (error: any) {
      logger.error(`👀 Failed to mark as read ${messageId}:`, error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async sendTypingIndicator(to: string, messageId: string): Promise<SendMessageResponse> {
    try {
      await this.client.post('/messages', {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
        typing_indicator: { type: 'text' },
      });

      logger.debug(`⌨️ Typing indicator sent to ${to}`);

      return { success: true };
    } catch (error: any) {
      logger.debug(`⌨️ Failed to send typing to ${to}:`, error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async startManagedTyping(to: string, messageId: string): Promise<void> {
    this.stopManagedTyping(to);
    this.typingCounts.set(to, 0);

    await this.sendTypingIndicator(to, messageId);
    logger.debug(`⌨️ Started typing cycle for ${to}`);

    const interval = setInterval(async () => {
      try {
        const currentCount = this.typingCounts.get(to) || 0;
        const newCount = currentCount + 1;
        this.typingCounts.set(to, newCount);

        if (newCount === this.TYPING_CYCLES_BEFORE_MESSAGE) {
          await this.sendTextMessage(to, 'Please wait, still processing your message... 🤖');
          this.typingCounts.set(to, 0);
        } else {
          await this.sendTypingIndicator(to, messageId);
        }
      } catch (error) {
        logger.error(`⌨️ Typing cycle error for ${to}:`, error);
      }
    }, this.TYPING_DURATION);

    this.typingIntervals.set(to, interval);
  }

  stopManagedTyping(to: string): void {
    const interval = this.typingIntervals.get(to);
    if (interval) {
      clearInterval(interval);
      this.typingIntervals.delete(to);
      this.typingCounts.delete(to);
      logger.debug(`⌨️ Stopped typing cycle for ${to}`);
    }
  }

  cleanup(): void {
    this.typingIntervals.forEach(interval => clearInterval(interval));
    this.typingIntervals.clear();
    this.typingCounts.clear();
    logger.info('🧹 WhatsAppService cleaned up');
  }
}
