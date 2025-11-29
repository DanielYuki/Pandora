import { IAIAgent, AgentRequest, AgentResponse } from '@/core/interfaces/ai-agent.interface';
import OpenAI from 'openai';
import logger from '@/utils/logger';
import config from '@/utils/config';

export class OpenAIAgentAdapter implements IAIAgent {
  private client: OpenAI;
  private model: string;

  constructor(model: string = 'gpt-4o-mini') {
    this.client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
    this.model = model;
  }

  async infer(request: AgentRequest): Promise<AgentResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: request.input,
          },
        ],
      });

      const answer = completion.choices[0]?.message?.content;

      if (!answer) {
        return {
          success: false,
          errorMessage: 'No response from OpenAI',
        };
      }

      return {
        success: true,
        answer,
      };
    } catch (error: any) {
      logger.error('OpenAI Agent error:', error.message);
      return {
        success: false,
        errorMessage: error.message || 'OpenAI request failed',
      };
    }
  }
}
