import { IAIAgent, AgentRequest, AgentResponse } from '@/core/interfaces/ai-agent.interface';
import axios from 'axios';
import logger from '@/utils/logger';

export class HttpAgentAdapter implements IAIAgent {
  constructor(private endpoint: string) {}

  async infer(request: AgentRequest): Promise<AgentResponse> {
    try {
      const response = await axios.post<AgentResponse>(this.endpoint, {
        id: request.id,
        input: request.input,
      });

      return {
        success: response.data.success,
        answer: response.data.answer,
        errorMessage: response.data.errorMessage,
      };
    } catch (error: any) {
      logger.error('HTTP Agent error:', error.message);
      return {
        success: false,
        errorMessage: error.message || 'HTTP request failed',
      };
    }
  }
}
