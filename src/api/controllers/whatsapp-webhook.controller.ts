import type { Request, Response } from 'express';
import { MessageReceivedEvent } from '@/core/events/message-received.event';
import type { IEventBus } from '@/core/interfaces/event-bus.interface';
import type {
  WhatsAppWebhookContact,
  WhatsAppWebhookMessage,
  WhatsAppWebhookPayload,
} from '@/types/whatsapp.types';
import config from '@/utils/config';
import logger from '@/utils/logger';

/**
 * WhatsApp webhook controller for handling incoming WhatsApp updates.
 * Receives webhook requests, validates them, and publishes domain events.
 */
export class WhatsAppWebhookController {
  constructor(private eventBus: IEventBus) {}

  handleVerification = (req: Request, res: Response): void => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.WA_WEBHOOK_TOKEN) {
      logger.info('WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      logger.warn('WhatsApp webhook verification failed');
      res.status(403).send('Forbidden');
    }
  };

  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      // Acknowledge immediately (WhatsApp expects quick response)
      res.status(200).send('OK');

      // Process payload asynchronously
      setImmediate(() => {
        this.processPayload(req.body as WhatsAppWebhookPayload).catch((error: unknown) => {
          logger.error(
            'WhatsApp webhook processing error:',
            error instanceof Error ? error.message : 'An error occurred'
          );
        });
      });
    } catch (error: unknown) {
      logger.error(
        'WhatsApp webhook error:',
        error instanceof Error ? error.message : 'An error occurred'
      );
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  private async processPayload(payload: WhatsAppWebhookPayload): Promise<void> {
    if (!payload?.entry?.length) {
      logger.debug('No entries in webhook payload');
      return;
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages' && change.value.messages?.length) {
          await this.publishMessageEvents(change.value.messages, change.value.contacts || []);
        }
      }
    }
  }

  private async publishMessageEvents(
    messages: WhatsAppWebhookMessage[],
    contacts: WhatsAppWebhookContact[]
  ): Promise<void> {
    for (const message of messages) {
      // Only process text messages
      if (message.type !== 'text') {
        logger.debug(`Skipping non-text message: ${message.type}`);
        continue;
      }

      const contactName = contacts?.find(c => c.wa_id === message.from)?.profile?.name;
      const content = message.text?.body || '';

      logger.info(`[WhatsApp] Message from ${contactName || message.from}: ${content}`);

      await this.eventBus.publish(
        new MessageReceivedEvent({
          messageId: message.id,
          from: message.from,
          platform: 'whatsapp',
          content,
          contactName,
        })
      );
    }
  }

  healthCheck = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'messaging-gateway',
      });
    } catch (error: unknown) {
      logger.error(
        'Health check failed:',
        error instanceof Error ? error.message : 'An error occurred'
      );
      res.status(503).json({ status: 'unhealthy' });
    }
  };
}
