import { MessageFailedEvent } from '@/core/events/message-failed.event';
import { MessageProcessedEvent } from '@/core/events/message-processed.event';
import type { MessageReceivedEvent } from '@/core/events/message-received.event';
import type { IAIAgent } from '@/core/interfaces/ai-agent.interface';
import type { DomainEvent, IEventBus } from '@/core/interfaces/event-bus.interface';
import type { IMessagingService } from '@/core/interfaces/messaging-service.interface';
import logger from '@/utils/logger';

export class ProcessMessageHandler {
  constructor(
    private eventBus: IEventBus,
    private messagingService: IMessagingService,
    private aiAgent: IAIAgent
  ) {
    this.eventBus.subscribe('message.received', this.handle.bind(this));
    logger.info('ProcessMessageHandler subscribed to message.received');
  }

  private async handle(event: DomainEvent): Promise<void> {
    const { payload } = event as MessageReceivedEvent;
    const { messageId, from, platform, content, contactName } = payload;

    try {
      logger.info(`Processing message ${messageId} from ${from} (${platform})`);

      // Send to AI agent
      const response = await this.aiAgent.infer({
        id: from,
        input: content,
      });

      if (response.success && response.answer) {
        await this.messagingService.sendTextMessage(from, response.answer);
        logger.info('Response sent successfully');
      } else {
        logger.warn(`Agent error: ${response.errorMessage}`);
        await this.sendFallbackResponse(from, contactName);
      }

      // Publish success event
      await this.eventBus.publish(
        new MessageProcessedEvent({
          messageId,
          from,
          platform,
          success: true,
          response: response.answer,
        })
      );
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

  private async sendFallbackResponse(to: string, contactName?: string): Promise<void> {
    await this.messagingService.sendTextMessage(
      to,
      `Hi ${contactName || 'there'}! I'm experiencing some technical difficulties. Please try again later.`
    );
  }
}
