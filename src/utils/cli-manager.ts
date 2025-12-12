import * as readline from 'node:readline';
import { blue, bold, dim, green, red } from 'colorette';
import { MessageReceivedEvent } from '@/core/events';
import type { IEventBus } from '@/core/interfaces';
import logger from '@/utils/logger';

export class CliManager {
  private rl: readline.Interface | null = null;

  constructor(private eventBus: IEventBus) {}

  start(): void {
    logger.level = 'warn';
    this.printBanner();

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.setupPrompt();
    this.setupCloseHandler();
  }

  stop(): void {
    console.log(`\n${dim('Goodbye! 👋')}\n`);
    this.rl?.close();
    this.rl = null;
    process.exit(0);
  }

  // TODO: Improve banner
  private printBanner(): void {
    const line = dim('─'.repeat(57));
    console.log('');
    console.log(bold(blue('Pandora CLI - Messaging Gateway')));
    console.log(line);
    console.log(dim('Type your message and press Enter.'));
    console.log(dim('Commands: /help, /exit, /default <text>'));
    console.log('');
  }

  // TODO: Improve user prompt
  private setupPrompt(): void {
    const prompt = () => {
      this.rl?.question(green('CLI > '), async input => {
        const trimmed = input.trim();

        if (!trimmed) {
          prompt();
          return;
        }

        if (trimmed.startsWith('/')) {
          const handled = this.handleCommand(trimmed);
          if (handled === null) {
            prompt();
            return;
          }
          // handled contains a message to send
          await this.publishMessage(handled);
          prompt();
          return;
        }

        await this.publishMessage(trimmed);

        setTimeout(prompt, 100);
      });
    };

    prompt();
  }

  private handleCommand(input: string): string | null {
    const [command, ...rest] = input.split(' ');
    switch (command.toLowerCase()) {
      case '/help': {
        console.log(dim('Commands: /help, /exit, /default <text>'));
        return null;
      }
      case '/exit': {
        this.stop();
        return null;
      }
      case '/default': {
        const text = rest.join(' ').trim() || 'Thanks! I will get back to you shortly.';
        console.log(dim(`Using default reply: ${text}`));
        return text;
      }
      default: {
        console.log(red(`Unknown command: ${command}. Try /help.`));
        return null;
      }
    }
  }

  private async publishMessage(content: string): Promise<void> {
    await this.eventBus.publish(
      new MessageReceivedEvent({
        messageId: `cli_msg_${Date.now()}`,
        from: 'cli-user',
        platform: 'cli',
        content,
        contactName: 'CLI User',
      })
    );
    console.log(dim('Message sent.'));
  }

  private setupCloseHandler(): void {
    this.rl?.on('close', () => {
      this.stop();
    });
  }
}
