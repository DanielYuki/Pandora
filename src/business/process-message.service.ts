import { IMessagingService, IAIAgent, IUserService } from '@/core/interfaces';
import { User } from '@/core/entities';
import { WhatsAppWebhookMessage, MessageProcessingResult } from '@/types/whatsapp.types';
import logger from '@/utils/logger';

export class ProcessMessageService {
  constructor(
    private messagingService: IMessagingService,
    private aiAgent: IAIAgent,
    private userService: IUserService
  ) {}

  async execute(
    message: WhatsAppWebhookMessage,
    contactName?: string
  ): Promise<MessageProcessingResult> {
    try {
      logger.info(`📨 Processing ${message.id} from ${message.from}`);

      // Get user details
      const user = await this.userService.getUserByPhone(message.from);
      if (!user) {
        logger.warn(`🚫 Unauthorized access attempt from ${message.from}`);
        await this.sendUnauthorizedResponse(message.from, contactName);
        return { success: true, messageId: message.id };
      }

      logger.debug(`👤 User authenticated: ${user.name} (${user.email})`);

      // Only process text messages
      if (message.type !== 'text') {
        await this.sendUnsupportedTypeResponse(message.from, contactName);
        return { success: true, messageId: message.id };
      }

      await this.handleTextMessage(message, contactName, user);

      return { success: true, messageId: message.id };
    } catch (error) {
      logger.error(`❌ Failed to process message ${message.id}:`, error);

      try {
        await this.sendFallbackResponse(message.from, contactName);
      } catch (fallbackError) {
        logger.error('Failed to send fallback response:', fallbackError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async handleTextMessage(
    message: WhatsAppWebhookMessage,
    contactName?: string,
    user?: User
  ): Promise<void> {
    const content = message.text?.body || '';

    try {
      await this.messagingService.startManagedTyping(message.from, message.id);

      logger.info(`🤖 Sending to AI Agent: "${content}"`);

      const response = await this.aiAgent.infer({
        userId: user?._id || message.from,
        userEmail: user?.email || '',
        userName: user?.name || contactName || 'Unknown',
        userInput: content,
      });

      this.messagingService.stopManagedTyping(message.from);

      if (response.success && response.answer) {
        await this.messagingService.sendTextMessage(message.from, response.answer, message.id);
        logger.info(`✅ Response sent`);
      } else {
        logger.warn(`⚠️ Agent error: ${response.errorMessage}`);
        await this.sendFallbackResponse(message.from, contactName);
      }
    } catch (error) {
      this.messagingService.stopManagedTyping(message.from);
      logger.error(`💥 Failed to process text message:`, error);
      await this.sendFallbackResponse(message.from, contactName);
    }
  }

  private async sendUnsupportedTypeResponse(to: string, contactName?: string): Promise<void> {
    await this.messagingService.sendTextMessage(
      to,
      `Hi ${contactName || 'there'}! I can only process text messages at the moment. Please send your message as text.`
    );
  }

  private async sendFallbackResponse(to: string, contactName?: string): Promise<void> {
    await this.messagingService.sendTextMessage(
      to,
      `Hi ${contactName || 'there'}! I'm experiencing some technical difficulties. Please try again later.`
    );
  }

  private async sendUnauthorizedResponse(to: string, contactName?: string): Promise<void> {
    await this.messagingService.sendTextMessage(
      to,
      `Hi ${contactName || 'there'}! You need to be registered to use this service.`
    );
  }
}
