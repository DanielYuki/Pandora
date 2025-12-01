import { IMessagingService } from '@/core/interfaces/messaging-service.interface';
import { MessageResult } from '@/core/entities';

/**
 * CLI adapter for terminal-based messaging.
 * Outputs responses directly to the console.
 */
export class CliAdapter implements IMessagingService {
  async sendTextMessage(to: string, text: string): Promise<MessageResult> {
    console.log(`\nAgent: ${text}\n`);
    return { success: true, messageId: `cli_${Date.now()}` };
  }
}
