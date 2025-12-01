import * as readline from 'readline';
import { IEventBus } from '@/core/interfaces';
import { MessageReceivedEvent } from '@/core/events';
import logger from '@/utils/logger';

// TODO: Add logger level option & more options
interface CliOptions {
  port: number;
}

export class CliManager {
  private rl: readline.Interface | null = null;

  constructor(
    private eventBus: IEventBus,
    private options: CliOptions
  ) {}

  start(): void {
    logger.level = 'warn'; // TODO: Add logger level option
    this.printBanner();

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.setupPrompt();
    this.setupCloseHandler();
  }

  stop(): void {
    console.log('\nGoodbye! 👋\n');
    this.rl?.close();
    this.rl = null;
    process.exit(0);
  }

  // TODO: Improve banner
  private printBanner(): void {
    console.log('');
    console.log('Pandora CLI - Messaging Gateway');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`✓ Server: http://0.0.0.0:${this.options.port}`);
    console.log('─────────────────────────────────────────────────────────────');
    console.log('Type your message and press Enter. Type "exit" to quit.');
    console.log('');
  }

  // TODO: Improve user prompt
  private setupPrompt(): void {
    const prompt = () => {
      this.rl?.question('You: ', async input => {
        const trimmed = input.trim();

        if (!trimmed) {
          prompt();
          return;
        }

        if (trimmed.toLowerCase() === 'exit') {
          this.stop();
          return;
        }

        await this.eventBus.publish(
          new MessageReceivedEvent({
            messageId: `cli_msg_${Date.now()}`,
            from: 'cli-user',
            platform: 'cli',
            content: trimmed,
            contactName: 'CLI User',
          })
        );

        setTimeout(prompt, 100);
      });
    };

    prompt();
  }

  private setupCloseHandler(): void {
    this.rl?.on('close', () => {
      this.stop();
    });
  }
}
