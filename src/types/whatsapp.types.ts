// WhatsApp Webhook Types

export interface WhatsAppWebhookMessage {
  id: string;
  from: string;
  to: string;
  type: string;
  timestamp: string;
  text?: { body: string };
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
      };
      field: string;
    }>;
  }>;
}

// Generic Response Types

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
