import type { AgentRequest, AgentResponse, IAIAgent } from '@/core/interfaces/ai-agent.interface';
import logger from '@/utils/logger';

/**
 * Mock AI Agent Adapter for testing without a real agent server
 * Returns predefined responses based on user input
 */
export class MockAgentAdapter implements IAIAgent {
  async infer(request: AgentRequest): Promise<AgentResponse> {
    logger.info(`[MOCK AGENT] Received request from ${request.id}`);
    logger.info(`[MOCK AGENT] Input: "${request.input}"`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return mock responses based on input
    const input = request.input.toLowerCase().trim();

    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return {
        success: true,
        answer: `Hello! This is a mock response. The agent is not running, but I'm here to help you test the messaging gateway.`,
      };
    }

    if (input.includes('test')) {
      return {
        success: true,
        answer:
          'Test successful! The messaging gateway is working correctly. This is a mock agent response.',
      };
    }

    if (input.includes('error')) {
      return {
        success: false,
        errorMessage: 'Mock error: This simulates an agent failure scenario.',
      };
    }

    // Default echo response
    return {
      success: true,
      answer: `You said: "${request.input}". This is a mock response from the test agent adapter.`,
    };
  }
}
