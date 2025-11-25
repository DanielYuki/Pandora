import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['production', 'development']).default('development'),
  PORT: z.coerce.number().default(8080),

  // WhatsApp Configuration
  CLOUD_API_ACCESS_TOKEN: z.string(),
  CLOUD_API_VERSION: z.string().default('v19.0'),
  WA_PHONE_NUMBER_ID: z.string(),
  WA_WEBHOOK_TOKEN: z.string(),

  // Server Configuration
  AGENT_SERVER_ADDRESS: z.string().default('localhost:50051'),

  // Redis Configuration
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('debug'),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables.');
}

export const config = _env.data;

export default config;
