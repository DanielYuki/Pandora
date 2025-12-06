import type { MessageResult } from '@/core/entities';
import type { IMessagingService } from '@/core/interfaces/messaging-service.interface';
import logger from '@/utils/logger';

/**
 * CLI adapter for terminal-based messaging.
 * Outputs responses directly to the console.
 */
export class CliAdapter implements IMessagingService {
  async sendTextMessage(to: string, text: string): Promise<MessageResult> {
    logger.debug(`CLI message sent to ${to}`);
    console.log(`\nAgent: ${text}\n`);
    return { success: true, messageId: `cli_${Date.now()}` };
  }
}
