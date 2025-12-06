import type { IAIAgent } from '@/core/interfaces/ai-agent.interface';
import type { IMessagingService } from '@/core/interfaces/messaging-service.interface';
import {
  GrpcAgentAdapter,
  MockAgentAdapter,
  OpenAIAgentAdapter,
  OzAgentAdapter,
} from '@/infrastructure/ai-agents';
import { CliAdapter, TelegramAdapter, WhatsAppAdapter } from '@/infrastructure/messaging';

// ! In case we implement more features in this factory, might instantiate it as a class.

/**
 * Creates a messaging adapter based on the configured platform.
 * @param platform - The messaging platform identifier ('whatsapp', 'telegram', or 'cli')
 * @returns An instance of IMessagingService
 * @throws Error if the platform is unknown
 */
export function createMessagingAdapter(platform: string): IMessagingService {
  switch (platform) {
    case 'whatsapp':
      return new WhatsAppAdapter();
    case 'telegram':
      return new TelegramAdapter();
    case 'cli':
      return new CliAdapter();
    default:
      throw new Error(
        `Unknown messaging platform: ${platform}. Valid options are: whatsapp, telegram, cli`
      );
  }
}

/**
 * Creates an AI agent adapter based on the configured agent type.
 * @param agentType - The AI agent type identifier
 * @returns An instance of IAIAgent
 * @throws Error if the agent type is unknown or required configuration is missing
 */
export function createAIAgentAdapter(agentType: string): IAIAgent {
  switch (agentType) {
    case 'openai':
      return new OpenAIAgentAdapter();
    case 'grpc':
      return new GrpcAgentAdapter();
    case 'mock':
      return new MockAgentAdapter();
    case 'oz':
      return new OzAgentAdapter();
    default:
      throw new Error(
        `Unknown AI agent type: ${agentType}. Valid options are: openai, grpc, mock, oz`
      );
  }
}
