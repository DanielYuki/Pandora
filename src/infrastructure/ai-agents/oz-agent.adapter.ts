import * as readline from 'node:readline';
import type { AgentRequest, AgentResponse, IAIAgent } from '@/core/interfaces/ai-agent.interface';
import logger from '@/utils/logger';

/**
 * Allows a human operator to answer messages via the terminal.
 * Implements internal queuing to handle concurrent requests sequentially.
 */
export class OzAgentAdapter implements IAIAgent {
  private queue: Array<{
    request: AgentRequest;
    resolve: (value: AgentResponse) => void;
  }> = [];
  private isProcessing = false;

  async infer(request: AgentRequest): Promise<AgentResponse> {
    return new Promise<AgentResponse>(resolve => {
      this.queue.push({ request, resolve });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const item = this.queue.shift();

    if (!item) {
      this.isProcessing = false;
      return;
    }

    try {
      const answer = await this.promptWizard(item.request);
      item.resolve({
        success: true,
        answer,
      });
    } catch (error: unknown) {
      logger.error('Oz Agent error:', error);
      item.resolve({
        success: false,
        errorMessage: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      this.isProcessing = false;
      // Process next item if any
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  // TODO: Improve terminal UX
  private promptWizard(request: AgentRequest): Promise<string> {
    return new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      console.log('\n');
      console.log('='.repeat(50));
      console.log(`User Input (${request.id}):`);
      console.log(`"${request.input}"`);
      console.log('='.repeat(50));

      rl.question('\nOz > ', answer => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }
}
