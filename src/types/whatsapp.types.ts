// WhatsApp-specific Webhook Types

/**
 * WhatsApp Webhook Message object
 * Represents a single message received from WhatsApp
 */
export interface WhatsAppWebhookMessage {
  id: string;
  from: string;
  to: string;
  type: string;
  timestamp: string;
  text?: { body: string };
}

/**
 * WhatsApp Webhook Payload object
 * This is the top-level object sent by WhatsApp Cloud API to your webhook
 */
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
