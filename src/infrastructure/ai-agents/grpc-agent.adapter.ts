import { IAIAgent, AgentRequest, AgentResponse } from '@/core/interfaces/ai-agent.interface';
import { InferenceClient } from '@/lib/inference-client';
import config from '@/utils/config';

export class GrpcAgentAdapter implements IAIAgent {
  private client: InferenceClient;

  constructor() {
    this.client = new InferenceClient(config.AGENT_SERVER_ADDRESS);
  }

  async infer(request: AgentRequest): Promise<AgentResponse> {
    try {
      const response = await this.client.infer({
        userId: request.userId,
        userEmail: request.userEmail,
        userName: request.userName,
        userInput: request.userInput,
      });

      return {
        success: response.success,
        answer: response.answer,
        errorMessage: response.errorMessage,
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.message || 'Unknown error during inference',
      };
    }
  }
}
