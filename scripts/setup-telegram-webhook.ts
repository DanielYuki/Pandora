#!/usr/bin/env tsx
/**
 * ! Telegram Webhook Setup Script
 *
 * This script registers your webhook URL with Telegram's Bot API.
 * Run this once after deploying your server or when changing the webhook URL.
 *
 * Usage:
 *   pnpm tsx scripts/setup-telegram-webhook.ts <webhook-url>
 *
 * Example:
 *   pnpm tsx scripts/setup-telegram-webhook.ts https://your-domain.com/webhook/telegram
 *
 * Requirements:
 *   - TELEGRAM_BOT_TOKEN must be set in your .env file
 *   - TELEGRAM_WEBHOOK_SECRET (optional) will be used if set in .env
 */

import axios from 'axios';
import config from '../src/utils/config';
import logger from '../src/utils/logger';

async function setupTelegramWebhook() {
  // Validate bot token
  if (!config.TELEGRAM_BOT_TOKEN) {
    logger.error('❌ TELEGRAM_BOT_TOKEN is required');
    logger.info('   Add TELEGRAM_BOT_TOKEN to your .env file');
    process.exit(1);
  }

  // Get webhook URL from command line argument (required)
  const webhookUrl = process.argv[2];

  if (!webhookUrl) {
    logger.error('❌ Webhook URL is required');
    logger.info('');
    logger.info('Usage:');
    logger.info('  pnpm tsx scripts/setup-telegram-webhook.ts <webhook-url>');
    logger.info('');
    logger.info('Example:');
    logger.info(
      '  pnpm tsx scripts/setup-telegram-webhook.ts https://your-domain.com/webhook/telegram'
    );
    process.exit(1);
  }

  // Validate URL format
  try {
    new URL(webhookUrl);
  } catch {
    logger.error('❌ Invalid webhook URL format');
    process.exit(1);
  }

  // Build request payload
  const payload: { url: string; secret_token?: string } = { url: webhookUrl };

  if (config.TELEGRAM_WEBHOOK_SECRET) {
    payload.secret_token = config.TELEGRAM_WEBHOOK_SECRET;
    logger.info('Using secret token for webhook security');
  }

  try {
    logger.info(`Setting Telegram webhook to: ${webhookUrl}`);

    const response = await axios.post(
      `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/setWebhook`,
      payload
    );

    if (response.data.ok) {
      logger.info('✅ Telegram webhook registered successfully');
      logger.info(`   URL: ${webhookUrl}`);
      if (response.data.description) {
        logger.info(`   Description: ${response.data.description}`);
      }
      process.exit(0);
    } else {
      logger.error(`❌ Failed to set Telegram webhook: ${response.data.description}`);
      process.exit(1);
    }
  } catch (error: any) {
    logger.error('❌ Error setting Telegram webhook:', error.message);
    if (error.response?.data) {
      logger.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

setupTelegramWebhook();
