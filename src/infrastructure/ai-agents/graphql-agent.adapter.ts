import { IAIAgent, AgentRequest, AgentResponse } from '@/core/interfaces/ai-agent.interface';
import axios from 'axios';
import logger from '@/utils/logger';

export class GraphQLAgentAdapter implements IAIAgent {
  constructor(private endpoint: string) {}

  async infer(request: AgentRequest): Promise<AgentResponse> {
    try {
      const query = `
        mutation Infer($input: InferInput!) {
          infer(input: $input) {
            success
            answer
            errorMessage
          }
        }
      `;

      const response = await axios.post(this.endpoint, {
        query,
        variables: {
          input: {
            id: request.id,
            input: request.input,
          },
        },
      });

      const data = response.data?.data?.infer;
      if (!data) {
        return {
          success: false,
          errorMessage: 'Invalid GraphQL response',
        };
      }

      return {
        success: data.success,
        answer: data.answer,
        errorMessage: data.errorMessage,
      };
    } catch (error: any) {
      logger.error('GraphQL Agent error:', error.message);
      return {
        success: false,
        errorMessage: error.message || 'GraphQL request failed',
      };
    }
  }
}
