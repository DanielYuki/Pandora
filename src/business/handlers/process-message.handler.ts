import { IEventBus, DomainEvent } from '@/core/interfaces/event-bus.interface';
import { IMessagingService } from '@/core/interfaces/messaging-service.interface';
import { IAIAgent } from '@/core/interfaces/ai-agent.interface';
import { IUserService } from '@/core/interfaces/user.interface';
import { MessageReceivedEvent } from '@/core/events/message-received.event';
import { MessageProcessedEvent } from '@/core/events/message-processed.event';
import { MessageFailedEvent } from '@/core/events/message-failed.event';
import logger from '@/utils/logger';

export class ProcessMessageHandler {
  constructor(
    private eventBus: IEventBus,
    private messagingService: IMessagingService,
    private aiAgent: IAIAgent,
    private userService: IUserService
  ) {
    this.eventBus.subscribe('message.received', this.handle.bind(this));
    logger.info('ProcessMessageHandler subscribed to message.received');
  }

  private async handle(event: DomainEvent): Promise<void> {
    const { payload } = event as MessageReceivedEvent;
    const { messageId, from, platform, content, contactName, replyTo } = payload;

    try {
      logger.info(`Processing message ${messageId} from ${from} (${platform})`);

      // Authenticate user
      const user = await this.userService.getUserByPhone(from);
      if (!user) {
        logger.warn(`Unauthorized access attempt from ${from}`);
        await this.sendUnauthorizedResponse(from, contactName);
        await this.publishProcessed(messageId, from, platform, true);
        return;
      }

      logger.debug(`User authenticated: ${user.name} (${user.email})`);

      // Process text message
      await this.processTextMessage(messageId, from, content, user, replyTo);

      // Publish success event
      await this.publishProcessed(messageId, from, platform, true);
    } catch (error) {
      logger.error(`Failed to process message ${messageId}:`, error);

      // Publish failure event
      await this.eventBus.publish(
        new MessageFailedEvent({
          messageId,
          from,
          platform,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        })
      );

      // Send fallback response
      try {
        await this.sendFallbackResponse(from, contactName);
      } catch (fallbackError) {
        logger.error('Failed to send fallback response:', fallbackError);
      }
    }
  }

  private async processTextMessage(
    messageId: string,
    from: string,
    content: string,
    user: { _id: string; name: string; email: string },
    replyTo?: string
  ): Promise<void> {
    try {
      await this.messagingService.startManagedTyping(from, messageId);

      logger.info(`Sending to AI Agent: "${content}"`);

      const response = await this.aiAgent.infer({
        userId: user._id,
        userEmail: user.email,
        userName: user.name,
        userInput: content,
      });

      this.messagingService.stopManagedTyping(from);

      if (response.success && response.answer) {
        await this.messagingService.sendTextMessage(from, response.answer, replyTo);
        logger.info('Response sent successfully');
      } else {
        logger.warn(`Agent error: ${response.errorMessage}`);
        await this.sendFallbackResponse(from);
      }
    } catch (error) {
      this.messagingService.stopManagedTyping(from);
      throw error;
    }
  }

  private async publishProcessed(
    messageId: string,
    from: string,
    platform: string,
    success: boolean,
    response?: string
  ): Promise<void> {
    await this.eventBus.publish(
      new MessageProcessedEvent({
        messageId,
        from,
        platform,
        success,
        response,
      })
    );
  }

  private async sendUnauthorizedResponse(to: string, contactName?: string): Promise<void> {
    await this.messagingService.sendTextMessage(
      to,
      `Hi ${contactName || 'there'}! You need to be registered to use this service.`
    );
  }

  private async sendFallbackResponse(to: string, contactName?: string): Promise<void> {
    await this.messagingService.sendTextMessage(
      to,
      `Hi ${contactName || 'there'}! I'm experiencing some technical difficulties. Please try again later.`
    );
  }
}

