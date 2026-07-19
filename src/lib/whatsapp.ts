import { LoggerService } from '@/services/LoggerService';

// The TemplateResolver mapping maps our internal logical template names to Meta template names.
export const NotificationTemplateMap: Record<string, string> = {
  ORDER_CONFIRMED: "order_confirmed",
  PAYMENT_RECEIVED: "payment_received", // e.g. for payments
  WAITING_FOR_CHEF: "order_chef_queue",
  MAKING: "order_in_production",
  READY_FOR_PICKUP: "order_ready",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "order_cancelled"
};

export type WhatsAppTemplate = keyof typeof NotificationTemplateMap;

export async function sendWhatsAppNotification(
  phone: string, 
  template: WhatsAppTemplate, 
  orderData: {
    id: string;
    customerName: string;
    items?: { name: string; qty: number }[];
    total?: number;
    branch?: string;
  }
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    LoggerService.error('[WhatsApp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID');
    // If not configured, we throw an error so Outbox marks it as failed
    throw new Error("WhatsApp credentials not configured");
  }

  // Format phone number to E.164 (without the +) as required by WhatsApp API
  // Simplistic format assuming Indian numbers mostly (+91)
  const formattedPhone = phone.replace(/\D/g, '');

  const metaTemplateName = NotificationTemplateMap[template];
  if (!metaTemplateName) {
    throw new Error(`Unmapped template name: ${template}`);
  }

  // Payload structure based on official WhatsApp Cloud API docs
  const payload = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "template",
    template: {
      name: metaTemplateName,
      language: {
        code: "en"
      },
      // Optional: Add parameters here if your templates in Meta require dynamic variables
      // components: [
      //   {
      //     type: "body",
      //     parameters: [
      //       { type: "text", text: orderData.customerName }
      //     ]
      //   }
      // ]
    }
  };

  try {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    
    // For local dev simulation without real API keys, we can intercept here if token === 'mock'
    if (token === 'mock') {
       LoggerService.info(`[WhatsApp MOCK] Sent ${metaTemplateName} to ${formattedPhone}`);
       return { success: true, mocked: true };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      LoggerService.error(`[WhatsApp] Delivery failed: ${JSON.stringify(data)}`);
      throw new Error(`WhatsApp API Error: ${data.error?.message || response.statusText}`);
    }

    LoggerService.info(`[WhatsApp] Successfully sent ${metaTemplateName} to ${formattedPhone}. MessageId: ${data.messages?.[0]?.id}`);
    return { success: true, messageId: data.messages?.[0]?.id };

  } catch (err: any) {
    LoggerService.error(`[WhatsApp] Exception during dispatch`, err);
    throw err;
  }
}
