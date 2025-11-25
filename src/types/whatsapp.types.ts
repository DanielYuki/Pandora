// === WHATSAPP WEBHOOK TYPES ===

export interface WhatsAppWebhookMessage {
  id: string;
  from: string;
  to: string;
  type: string;
  timestamp: string;
  text?: { body: string };
  context?: { message_id: string };
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: WhatsAppWebhookMessage[];
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

// === SERVICE RESPONSE TYPES ===

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface MessageProcessingResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
