/**
 * Represents a message received from any messaging platform.
 * This is a platform-agnostic representation of an incoming message.
 */
export interface IncomingMessage {
  /** Unique message ID from the source platform */
  messageId: string;
  /** Sender identifier (phone number, user ID, etc.) */
  from: string;
  /** Source platform (whatsapp, telegram, etc.) */
  platform: string;
  /** Text content of the message */
  content: string;
  /** Optional display name of the sender */
  contactName?: string;
}

/**
 * Represents the result of processing a message.
 */
export interface ProcessedMessage {
  /** Original message ID that was processed */
  messageId: string;
  /** Who the message was from */
  from: string;
  /** Platform where the message originated */
  platform: string;
  /** Whether processing was successful */
  success: boolean;
  /** The response that was sent (if any) */
  response?: string;
}

/**
 * Represents a failed message processing attempt.
 */
export interface FailedMessage {
  /** Original message ID that failed */
  messageId: string;
  /** Who the message was from */
  from: string;
  /** Platform where the message originated */
  platform: string;
  /** Error description */
  error: string;
  /** Whether this failure can be retried */
  retryable: boolean;
}

/**
 * Represents the result of a messaging operation (e.g., sending a message).
 */
export interface MessageResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Message ID assigned by the platform (if successful) */
  messageId?: string;
  /** Error message (if failed) */
  error?: string;
}
