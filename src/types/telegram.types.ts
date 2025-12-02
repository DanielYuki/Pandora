// Telegram-specific Webhook Types

/**
 * Telegram User object
 * Represents a Telegram user or bot
 */
export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

/**
 * Telegram Chat object
 * Represents a chat (private, group, supergroup, or channel)
 */
export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Telegram Message object
 * Represents a message received from Telegram
 */
export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  // Additional message types can be added later:
  // photo?: TelegramPhotoSize[];
  // document?: TelegramDocument;
  // audio?: TelegramAudio;
}

/**
 * Telegram Update object (webhook payload)
 * This is the top-level object sent by Telegram to your webhook
 */
export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  // Additional update types can be added later:
  // callback_query?: TelegramCallbackQuery;
  // inline_query?: TelegramInlineQuery;
}
