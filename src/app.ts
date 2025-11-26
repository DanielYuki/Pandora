import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { WebhookController } from '@/api/controllers';
import { ProcessMessageHandler } from '@/business/handlers';
import { InMemoryEventBus } from '@/infrastructure/events';
import { WhatsAppAdapter, GrpcAgentAdapter, UserCacheAdapter } from '@/infrastructure';
import { RedisService } from '@/services/redis.service';
import logger from '@/utils/logger';
import config from '@/utils/config';

class Application {
  public app: express.Application;
  private webhookController: WebhookController;
  private redis: RedisService;

  constructor() {
    this.app = express();
    this.redis = RedisService.getInstance();

    // Create event bus
    const eventBus = new InMemoryEventBus();

    // Create adapters
    const whatsappAdapter = new WhatsAppAdapter();
    const agentAdapter = new GrpcAgentAdapter();
    const userCacheAdapter = new UserCacheAdapter();

    // Create event handlers (subscribe to events)
    new ProcessMessageHandler(eventBus, whatsappAdapter, agentAdapter, userCacheAdapter);

    // Create controllers (publish events)
    this.webhookController = new WebhookController(eventBus);

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

  public async start(): Promise<void> {
    const port = config.PORT;
    const host = '0.0.0.0';

    try {
      await this.redis.connect();
    } catch (error) {
      logger.warn('Redis connection failed, continuing without Redis features:', error);
    }

    this.app.listen(port, host, () => {
      logger.info(`Messaging Gateway running on ${host}:${port}`);
      logger.info(`Webhook URL: http://${host}:${port}/webhook`);
      logger.info(`Health check: http://${host}:${port}/health`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    try {
      await this.redis.disconnect();
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
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
