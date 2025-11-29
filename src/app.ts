import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as readline from 'readline';

import { WebhookController } from '@/api/controllers';
import { ProcessMessageHandler } from '@/business/handlers';
import { InMemoryEventBus } from '@/infrastructure/events';
import { IEventBus } from '@/core/interfaces';
import { WhatsAppAdapter, CliAdapter, OpenAIAgentAdapter } from '@/infrastructure';
import { MessageReceivedEvent } from '@/core/events';
import logger from '@/utils/logger';
import config from '@/utils/config';

class Application {
  public app: express.Application;
  private webhookController: WebhookController;
  private eventBus: IEventBus;
  private cliEnabled: boolean;

  constructor(options: { cli?: boolean } = {}) {
    this.app = express();
    this.cliEnabled = options.cli ?? false;

    // Create shared event bus
    this.eventBus = new InMemoryEventBus();

    // ============================================================
    // ADAPTERS CONFIGURATION
    // Change these to use different messaging platforms or AI agents
    // ============================================================

    // Messaging adapter: WhatsAppAdapter, TelegramAdapter, CliAdapter
    const messagingAdapter = this.cliEnabled ? new CliAdapter() : new WhatsAppAdapter();

    // AI Agent adapter: OpenAIAgentAdapter, GrpcAgentAdapter, HttpAgentAdapter, MockAgentAdapter
    const agentAdapter = new OpenAIAgentAdapter();

    // ============================================================

    // Create event handlers (subscribe to events)
    new ProcessMessageHandler(this.eventBus, messagingAdapter, agentAdapter);

    // Create controllers (publish events)
    this.webhookController = new WebhookController(this.eventBus);

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: true,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    this.app.set('trust proxy', 1);
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  }

  private initializeRoutes(): void {
    this.app.get('/health', this.webhookController.healthCheck);

    this.app.get('/', (_req, res) => {
      res.json({
        message: 'Messaging Gateway is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        cli: this.cliEnabled,
      });
    });

    this.app.get('/webhook', this.webhookController.handleVerification);
    this.app.post('/webhook', this.webhookController.handleWebhook);

    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        path: req.originalUrl,
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(
      (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        logger.error('Unhandled error:', err);

        const isDevelopment = config.NODE_ENV === 'development';

        res.status(err.statusCode || 500).json({
          error: isDevelopment ? err.message : 'Internal Server Error',
          ...(isDevelopment && { stack: err.stack }),
        });
      }
    );

    process.on('uncaughtException', error => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }

  private startCli(): void {
    // Suppress verbose logging for cleaner CLI
    logger.level = 'warn';

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              Pandora CLI - Messaging Gateway               ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  Server: http://0.0.0.0:${config.PORT}`.padEnd(61) + '║');
    console.log('║  Type your message and press Enter to send                 ║');
    console.log('║  Type "exit" or press Ctrl+C to quit                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    const prompt = () => {
      rl.question('You: ', async input => {
        const trimmed = input.trim();

        if (!trimmed) {
          prompt();
          return;
        }

        if (trimmed.toLowerCase() === 'exit') {
          console.log('\nGoodbye! 👋\n');
          rl.close();
          process.exit(0);
        }

        // Publish message event
        await this.eventBus.publish(
          new MessageReceivedEvent({
            messageId: `cli_msg_${Date.now()}`,
            from: 'cli-user',
            platform: 'cli',
            content: trimmed,
            contactName: 'CLI User',
          })
        );

        // Small delay to let the response print before next prompt
        setTimeout(prompt, 100);
      });
    };

    prompt();

    rl.on('close', () => {
      console.log('\nGoodbye! 👋\n');
      process.exit(0);
    });
  }

  public async start(): Promise<void> {
    const port = config.PORT;
    const host = '0.0.0.0';

    this.app.listen(port, host, () => {
      logger.info(`Messaging Gateway running on ${host}:${port}`);
      logger.info(`Webhook URL: http://${host}:${port}/webhook`);
      logger.info(`Health check: http://${host}:${port}/health`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });

    if (this.cliEnabled) {
      this.startCli();
    }
  }

  private gracefulShutdown(signal: string): void {
    logger.info(`Received ${signal}. Shutting down...`);
    process.exit(0);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cliEnabled = args.includes('--cli');

  try {
    logger.info('Starting Messaging Gateway...');

    const app = new Application({ cli: cliEnabled });
    await app.start();
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default Application;
