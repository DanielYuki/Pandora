import type { Request, Response } from 'express';
import { MessageReceivedEvent } from '@/core/events/message-received.event';
import type { IEventBus } from '@/core/interfaces/event-bus.interface';
import type { TelegramUpdate } from '@/types/telegram.types';
import config from '@/utils/config';
import logger from '@/utils/logger';

/**
 * Telegram webhook controller for handling incoming Telegram updates.
 * Receives webhook requests, validates them, and publishes domain events.
 */
export class TelegramWebhookController {
  constructor(private eventBus: IEventBus) {}

  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      // Verify secret token if configured
      if (config.TELEGRAM_WEBHOOK_SECRET) {
        const secretToken = req.headers['x-telegram-bot-api-secret-token'];
        if (secretToken !== config.TELEGRAM_WEBHOOK_SECRET) {
          logger.warn('Telegram webhook secret token mismatch');
          res.status(403).send('Forbidden');
          return;
        }
      }

      // Acknowledge immediately (Telegram expects quick response)
      res.status(200).send('OK');

      // Process payload asynchronously
      setImmediate(() => {
        this.processPayload(req.body as TelegramUpdate).catch(error => {
          logger.error('Telegram webhook processing error:', error);
        });
      });
    } catch (error) {
      logger.error('Telegram webhook error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  private async processPayload(update: TelegramUpdate): Promise<void> {
    // Telegram sends one update per webhook (unlike WhatsApp which can send multiple)
    const message = update.message || update.edited_message;

    if (!message) {
      logger.debug('No message in Telegram update');
      return;
    }

    // Only process text messages for now
    if (!message.text) {
      logger.debug(`Skipping non-text message: ${message.message_id}`);
      return;
    }

    // Extract user information
    const chatId = message.chat.id.toString();
    const content = message.text;
    const contactName =
      message.from?.first_name ||
      (message.from?.username ? `@${message.from.username}` : undefined);

    logger.info(`[Telegram] Message from ${contactName || chatId}: ${content}`);

    await this.eventBus.publish(
      new MessageReceivedEvent({
        messageId: message.message_id.toString(),
        from: chatId,
        platform: 'telegram',
        content,
        contactName,
      })
    );
  }
}
