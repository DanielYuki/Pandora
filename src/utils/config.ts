import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['production', 'development']).default('development'),
  PORT: z.coerce.number().default(8080),

  // WhatsApp Configuration
  CLOUD_API_ACCESS_TOKEN: z.string().optional(),
  CLOUD_API_VERSION: z.string().default('v19.0'),
  WA_PHONE_NUMBER_ID: z.string().optional(),
  WA_WEBHOOK_TOKEN: z.string().optional(),

  // Telegram Configuration
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),

  // AI Agent Configuration
  AGENT_SERVER_ADDRESS: z.string().default('localhost:50051'),
  OPENAI_API_KEY: z.string().optional(),
  AI_AGENT_HTTP_ENDPOINT: z.string().optional(),
  AI_AGENT_GRAPHQL_ENDPOINT: z.string().optional(),

  // Adapter Configuration
  MESSAGING_PLATFORM: z.enum(['whatsapp', 'telegram', 'cli']).default('cli'),
  AI_AGENT_TYPE: z.enum(['openai', 'grpc', 'http', 'graphql', 'mock', 'oz']).default('mock'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('debug'),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error('Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables.');
}

export const config = _env.data;

export default config;
