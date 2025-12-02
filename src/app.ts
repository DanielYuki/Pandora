import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { WhatsAppWebhookController, TelegramWebhookController } from '@/api/controllers';
import { ProcessMessageHandler } from '@/business/handlers';
import { InMemoryEventBus } from '@/infrastructure/events';
import { IEventBus, IMessagingService, IAIAgent } from '@/core/interfaces';
import { WhatsAppAdapter, CliAdapter, OpenAIAgentAdapter } from '@/infrastructure';
import logger from '@/utils/logger';
import config from '@/utils/config';
import { CliManager } from '@/utils/cli-manager';

class Application {
  public app: express.Application;
  private whatsappWebhookController: WhatsAppWebhookController;
  private telegramWebhookController: TelegramWebhookController;
  private eventBus: IEventBus;
  private messagingAdapter: IMessagingService;
  private agentAdapter: IAIAgent;
  private cliManager: CliManager | null = null;

  constructor() {
    this.app = express();

    // Create shared event bus
    this.eventBus = new InMemoryEventBus();

    // ============================================================
    // ! ADAPTERS CONFIGURATION
    // Change these to use different messaging platforms or AI agents
    // ============================================================
    logger.info('📦 Adapters Configuration');

    // Messaging adapter: WhatsAppAdapter, TelegramAdapter, CliAdapter
    this.messagingAdapter = new CliAdapter(); // ? WHATSAPP, TELEGRAM, OR CLI ADAPTER
    logger.info(`Messaging adapter: ${this.messagingAdapter.constructor.name}`);

    // AI Agent adapter: OpenAIAgentAdapter, GrpcAgentAdapter, HttpAgentAdapter, MockAgentAdapter
    this.agentAdapter = new OpenAIAgentAdapter(); // ? OPENAI, GRPC, HTTP, MOCK AGENT ADAPTER
    logger.info(`Agent adapter: ${this.agentAdapter.constructor.name}`);

    // ============================================================

    // Create event handlers (subscribe to events)
    new ProcessMessageHandler(this.eventBus, this.messagingAdapter, this.agentAdapter);

    // Create controllers (publish events)
    this.whatsappWebhookController = new WhatsAppWebhookController(this.eventBus);
    this.telegramWebhookController = new TelegramWebhookController(this.eventBus);

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
    this.app.get('/health', this.whatsappWebhookController.healthCheck);

    this.app.get('/', (_req, res) => {
      res.json({
        message: 'Messaging Gateway is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    });

    // WhatsApp webhook routes
    this.app.get('/webhook/whatsapp', this.whatsappWebhookController.handleVerification);
    this.app.post('/webhook/whatsapp', this.whatsappWebhookController.handleWebhook);

    // Telegram webhook routes
    this.app.post('/webhook/telegram', this.telegramWebhookController.handleWebhook);

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

  public async start(): Promise<void> {
    const port = config.PORT;
    const host = '0.0.0.0';

    this.app.listen(port, host, () => {
      logger.info(`Messaging Gateway running on ${host}:${port}`);
      logger.info(`WhatsApp Webhook: http://${host}:${port}/webhook/whatsapp`);
      logger.info(`Telegram Webhook: http://${host}:${port}/webhook/telegram`);
      logger.info(`Health check: http://${host}:${port}/health`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });

    // CLI startup only if the messaging adapter is a CliAdapter
    if (this.messagingAdapter instanceof CliAdapter) {
      this.cliManager = new CliManager(this.eventBus, {
        port: config.PORT,
      });
      this.cliManager.start();
    }
  }

  private gracefulShutdown(signal: string): void {
    logger.info(`Received ${signal}. Shutting down...`);
    process.exit(0);
  }
}

async function main() {
  try {
    logger.info('Starting Messaging Gateway...');

    const app = new Application();
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
