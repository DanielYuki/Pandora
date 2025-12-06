import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['production', 'development']).default('development'),
  PORT: z.coerce.number().default(8080),

  // Adapter Configuration
  MESSAGING_ADAPTER: z.enum(['whatsapp', 'telegram', 'cli']).default('cli'),
  AGENT_ADAPTER: z.enum(['openai', 'grpc', 'mock', 'oz']).default('mock'),

  // WhatsApp Configuration
  CLOUD_API_ACCESS_TOKEN: z.string().optional(),
  WA_PHONE_NUMBER_ID: z.string().optional(),
  WA_WEBHOOK_TOKEN: z.string().optional(),

  // Telegram Configuration
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),

  // Agent Configuration
  AGENT_SERVER_ADDRESS: z.string().default('localhost:50051'),
  OPENAI_API_KEY: z.string().optional(),

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
