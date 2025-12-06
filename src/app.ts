import cors from 'cors';
import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import { TelegramWebhookController, WhatsAppWebhookController } from '@/api/controllers';
import { ProcessMessageHandler } from '@/business/handlers';
import type { IAIAgent, IEventBus, IMessagingService } from '@/core/interfaces';
import { CliAdapter, TelegramAdapter, WhatsAppAdapter } from '@/infrastructure';
import { InMemoryEventBus } from '@/infrastructure/events';
import { createAIAgentAdapter, createMessagingAdapter } from '@/infrastructure/factories';
import { CliManager } from '@/utils/cli-manager';
import config from '@/utils/config';
import logger from '@/utils/logger';

class Application {
  public app: express.Application;
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
    // Configure adapters via environment variables:
    // - MESSAGING_ADAPTER: 'whatsapp' | 'telegram' | 'cli'
    // - AGENT_ADAPTER: 'openai' | 'grpc' | 'mock' | 'oz'
    // ============================================================
    logger.info('📦 Adapters Configuration');

    // Create messaging adapter from configuration
    this.messagingAdapter = createMessagingAdapter(config.MESSAGING_ADAPTER);
    logger.info(`Messaging adapter: ${this.messagingAdapter.constructor.name}`);

    // Create agent adapter from configuration
    this.agentAdapter = createAIAgentAdapter(config.AGENT_ADAPTER);
    logger.info(`Agent adapter: ${this.agentAdapter.constructor.name}`);

    // ============================================================

    // Create event handlers (subscribe to events)
    new ProcessMessageHandler(this.eventBus, this.messagingAdapter, this.agentAdapter);

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initializes Express middleware for security, CORS, and request parsing.
   * Sets up helmet for security headers, CORS for cross-origin requests,
   * and JSON/URL-encoded body parsers with size limits.
   */
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

  /**
   * Initializes all HTTP routes for the application.
   * Sets up health check, root endpoint, platform-specific webhooks,
   * and a catch-all 404 handler.
   */
  private initializeRoutes(): void {
    this.app.get('/health', this.healthCheck);

    this.app.get('/', (_req, res) => {
      res.json({
        message: 'Messaging Gateway is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    });

    // Setup webhooks based on configured adapter
    this.setupWebhooks();

    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        path: req.originalUrl,
      });
    });
  }

  /**
   * Dynamically sets up webhook routes based on the configured messaging adapter.
   */
  private setupWebhooks(): void {
    if (this.messagingAdapter instanceof WhatsAppAdapter) {
      const controller = new WhatsAppWebhookController(this.eventBus);
      this.app.get('/webhook/whatsapp', controller.handleVerification);
      this.app.post('/webhook/whatsapp', controller.handleWebhook);
      logger.info('WhatsApp webhook routes registered');
    } else if (this.messagingAdapter instanceof TelegramAdapter) {
      const controller = new TelegramWebhookController(this.eventBus);
      this.app.post('/webhook/telegram', controller.handleWebhook);
      logger.info('Telegram webhook routes registered');
    }
    // CliAdapter doesn't need webhook routes
  }

  /**
   * Health check :)
   */
  private healthCheck = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'messaging-gateway',
        adapter: this.messagingAdapter.constructor.name,
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({ status: 'unhealthy' });
    }
  };

  /**
   * Initializes error handling for the application.
   * Sets up Express error middleware for handling HTTP errors,
   * and process-level handlers for uncaught exceptions, unhandled rejections,
   * and graceful shutdown signals (SIGTERM, SIGINT).
   */
  // TODO: Refactor this to be more robust and reusable.
  private initializeErrorHandling(): void {
    this.app.use(
      (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        logger.error('Unhandled error:', err instanceof Error ? err.message : 'An error occurred');

        // ? Might configure for dev ONLY...
        const isDevelopment = config.NODE_ENV === 'development';

        res.status(500).json({
          error: isDevelopment
            ? err instanceof Error
              ? err.message
              : 'An error occurred'
            : 'Internal Server Error',
          ...(isDevelopment && { stack: err instanceof Error ? err.stack : undefined }),
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
    // TODO: fix hostname
    const port = config.PORT;
    const host = '0.0.0.0';

    this.app.listen(port, host, () => {
      logger.info(`Messaging Gateway running on ${host}:${port}`);
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

  /**
   * Handles graceful shutdown when receiving termination signals.
   * Logs the shutdown event and exits the process cleanly.
   * Called on SIGTERM and SIGINT signals.
   *
   * @param signal - The termination signal received (SIGTERM or SIGINT)
   */
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
