export interface IncomingMessage {
  id: string;
  from: string;
  platform: string;
  content: string;
  contactName?: string;
  replyTo?: string;
  timestamp: Date;
}

export interface OutgoingMessage {
  to: string;
  content: string;
  replyTo?: string;
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

