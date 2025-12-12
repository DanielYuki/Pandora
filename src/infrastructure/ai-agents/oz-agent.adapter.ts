import * as readline from 'node:readline';
import { blue, bold, cyan, dim, green, red, yellow } from 'colorette';
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

  constructor() {
    logger.level = 'warn';
    this.printBanner();
  }

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
      this.printMessageCard(item.request);
      this.printStatusLine();
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
      if (this.queue.length > 0) {
        this.processQueue();
      } else {
        console.log(dim('\n⏸  waiting for more messages\n'));
      }
    }
  }

  private printMessageCard(request: AgentRequest): void {
    const border = dim('─'.repeat(50));
    console.log(`\n${border}`);
    console.log(
      `${bold(blue('User'))}: ${cyan(request.id)}  ${bold(blue('Time'))}: ${dim(new Date().toLocaleTimeString())}`
    );
    console.log(`${bold(blue('Content'))}:`);
    console.log(request.input);
    console.log(border);
  }

  private printStatusLine(): void {
    const pending = this.queue.length;
    const state = this.isProcessing ? 'active' : 'idle';
    const icon = pending > 0 ? '⏳ ' : '';
    console.log(dim(`${icon}Queue: ${pending} pending | State: ${state}`));
  }

  private printBanner(): void {
    const line = dim('─'.repeat(50));
    console.log('');
    console.log(bold(green('Oz Mode - Human-in-the-loop')));
    console.log(line);
    console.log(dim('Commands: /help, /exit, /skip'));
    console.log(dim('Local-only by default. Type your reply and press Enter.'));
    console.log(line);
  }

  private promptWizard(request: AgentRequest): Promise<string> {
    return new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const promptLabel = green('Oz > ');
      rl.question(`\n${promptLabel}`, answer => {
        rl.close();
        const cleaned = answer.trim();

        if (cleaned.startsWith('/')) {
          const handled = this.handleCommand(cleaned, request);
          if (handled !== null) {
            resolve(handled);
            return;
          }
          // If command was help/unknown, re-run the prompt
          this.printStatusLine();
          this.processQueue();
          return;
        }

        console.log(green('✓ sent'));
        resolve(cleaned);
      });
    });
  }

  private handleCommand(input: string, _request: AgentRequest): string | null {
    const [command] = input.split(' ');
    switch (command.toLowerCase()) {
      case '/help': {
        console.log(dim('Commands: /help, /exit, /skip'));
        return null;
      }
      case '/skip': {
        console.log(yellow('Skipped current message.'));
        // Resolve with a harmless default note
        return 'Skipped by operator.';
      }
      case '/exit': {
        console.log(yellow('Exiting Oz session.'));
        process.exit(0);
        return null;
      }
      default: {
        console.log(red(`Unknown command: ${command}. Try /help.`));
        return null;
      }
    }
  }
}
