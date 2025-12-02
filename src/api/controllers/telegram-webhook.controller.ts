import { Request, Response } from 'express';
import { IEventBus } from '@/core/interfaces/event-bus.interface';
import { MessageReceivedEvent } from '@/core/events/message-received.event';
import logger from '@/utils/logger';

/**
 * Telegram webhook controller stub - implement when needed
 */
export class TelegramWebhookController {
  constructor(private eventBus: IEventBus) {}

  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      // Acknowledge immediately
      res.status(200).send('OK');

      setImmediate(() => {
        this.processPayload(req.body).catch(error => {
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

  private async processPayload(payload: any): Promise<void> {
    // TODO: Implement Telegram webhook payload parsing
    // Telegram Update object structure:
    // {
    //   update_id: number,
    //   message?: {
    //     message_id: number,
    //     from: { id: number, first_name: string, ... },
    //     chat: { id: number, type: string, ... },
    //     date: number,
    //     text?: string,
    //   }
    // }

    const message = payload.message;
    if (!message || !message.text) {
      logger.debug('No text message in Telegram payload');
      return;
    }

    const chatId = message.chat?.id?.toString();
    const content = message.text;
    const contactName = message.from?.first_name;

    logger.info(`[Telegram] Message from ${contactName || chatId}: ${content}`);

    await this.eventBus.publish(
      new MessageReceivedEvent({
        messageId: message.message_id?.toString() || `tg_${Date.now()}`,
        from: chatId,
        platform: 'telegram',
        content,
        contactName,
      })
    );
  }
}

