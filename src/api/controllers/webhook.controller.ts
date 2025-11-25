import { Request, Response } from 'express';
import { WhatsAppWebhookPayload, WhatsAppWebhookMessage } from '@/types/whatsapp.types';
import { ProcessMessageService } from '@/business/process-message.service';
import logger from '@/utils/logger';
import config from '@/utils/config';

export class WebhookController {
  constructor(private processMessageService: ProcessMessageService) {}

  handleVerification = (req: Request, res: Response): void => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.WA_WEBHOOK_TOKEN) {
      logger.info('🔐 Webhook verified');
      res.status(200).send(challenge);
    } else {
      logger.warn('🚫 Webhook verification failed');
      res.status(403).send('Forbidden');
    }
  };

  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      // Acknowledge immediately
      res.status(200).send('OK');

      setImmediate(() => {
        this.processPayload(req.body as WhatsAppWebhookPayload).catch(error => {
          logger.error('❌ Webhook processing error:', error);
        });
      });
    } catch (error) {
      logger.error('❌ Webhook error:', error);
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
          await this.processMessages(change.value.messages, change.value.contacts || []);
        }
      }
    }
  }

  private async processMessages(
    messages: WhatsAppWebhookMessage[],
    contacts: any[]
  ): Promise<void> {
    for (const message of messages) {
      const contactName = contacts?.find(c => c.wa_id === message.from)?.profile?.name;

      logger.info(`💬 ${contactName || message.from}: ${message.text?.body || `[${message.type}]`}`);

      try {
        const result = await this.processMessageService.execute(message, contactName);

        if (result.error) {
          logger.error(`❌ Processing failed: ${result.error}`);
        } else {
          logger.info(`✅ Processed ${result.messageId}`);
        }
      } catch (error) {
        logger.error(`💥 Failed to process ${message.id}:`, error);
      }
    }
  }

  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'messaging-gateway',
      });
    } catch (error) {
      logger.error('💔 Health check failed:', error);
      res.status(503).json({ status: 'unhealthy' });
    }
  };
}
