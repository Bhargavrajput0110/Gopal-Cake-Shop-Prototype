/**
 * WhatsAppProvider — V4 Architecture
 *
 * Concrete implementation of NotificationProvider for the Meta WhatsApp Cloud API.
 *
 * Responsibilities:
 *  - Upload images via Meta Resumable Upload API → returns media_id
 *  - Send pre-approved template messages (text-only or IMAGE-header)
 *  - Map all provider outcomes to ProviderResult (never throws)
 *  - Does NOT perform idempotency checks — that is the caller's responsibility
 */

import { LoggerService } from '@/services/LoggerService';
import type {
  NotificationProvider,
  SendTemplateParams,
  MediaUploadResult,
  ProviderResult,
} from './NotificationProvider';

const META_API_VERSION = 'v19.0';

export class WhatsAppProvider implements NotificationProvider {
  private readonly token: string;
  private readonly phoneNumberId: string;

  constructor(token: string, phoneNumberId: string) {
    this.token = token;
    this.phoneNumberId = phoneNumberId;
  }

  /**
   * Upload an image to Meta's servers.
   * Returns the providerMediaId to embed in an IMAGE-header template call.
   *
   * Meta docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media
   */
  async uploadMedia(imageUrl: string): Promise<MediaUploadResult> {
    // Step 1: Fetch the image binary
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`[WhatsAppProvider] Failed to fetch image for upload: ${imageUrl} (${imageResponse.status})`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Step 2: Upload to Meta
    const url = `https://graph.facebook.com/${META_API_VERSION}/${this.phoneNumberId}/media`;
    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('file', new Blob([imageBuffer], { type: contentType }), 'image.jpg');
    formData.append('type', contentType);

    const uploadResponse = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: formData,
    });

    const data = await uploadResponse.json();

    if (!uploadResponse.ok || !data.id) {
      throw new Error(
        `[WhatsAppProvider] Media upload failed: ${JSON.stringify(data)}`
      );
    }

    LoggerService.info(`[WhatsAppProvider] Media uploaded. media_id=${data.id}`);
    return { providerMediaId: data.id };
  }

  /**
   * Send a Meta-approved template message.
   * Never throws — maps all outcomes to ProviderResult.
   */
  async sendTemplate(params: SendTemplateParams): Promise<ProviderResult> {
    const { phone, templateName, language, variables, mediaId } = params;

    // Normalise phone: strip non-digits, ensure no leading +
    const formattedPhone = phone.replace(/\D/g, '');

    // Build components array — body parameters always present
    const components: object[] = [
      {
        type: 'body',
        parameters: variables.map((v) => ({ type: 'text', text: v })),
      },
    ];

    // If IMAGE header template, prepend header component with media_id
    if (mediaId) {
      components.unshift({
        type: 'header',
        parameters: [{ type: 'image', image: { id: mediaId } }],
      });
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components,
      },
    };

    const url = `https://graph.facebook.com/${META_API_VERSION}/${this.phoneNumberId}/messages`;

    let response: Response;
    let data: any;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000), // 15s timeout
      });
      data = await response.json();
    } catch (err: any) {
      // Network error or timeout — outcome unknown
      LoggerService.warn(`[WhatsAppProvider] Network/timeout error for template ${templateName}: ${err.message}`);
      return {
        success: false,
        error: err.message,
        retryable: undefined, // UNKNOWN — do not auto-retry
      };
    }

    if (response.ok && data?.messages?.[0]?.id) {
      const messageId = data.messages[0].id;
      LoggerService.info(
        `[WhatsAppProvider] Sent ${templateName} to ${formattedPhone}. wamid=${messageId}`
      );
      return { success: true, providerMessageId: messageId };
    }

    // Error response
    const errorMessage = data?.error?.message || response.statusText;
    const is4xx = response.status >= 400 && response.status < 500;
    LoggerService.error(
      `[WhatsAppProvider] Failed to send ${templateName}: ${errorMessage} (${response.status})`
    );
    return {
      success: false,
      error: errorMessage,
      retryable: !is4xx, // 4xx = permanent, 5xx = retryable
    };
  }
}

/**
 * Build a WhatsAppProvider from environment variables.
 * Returns null if credentials are not configured (notifications skipped gracefully).
 */
export function createWhatsAppProvider(): WhatsAppProvider | null {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return null;
  }

  return new WhatsAppProvider(token, phoneNumberId);
}
 */
export function createWhatsAppProvider(): WhatsAppProvider | null {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return null;
  }

  return new WhatsAppProvider(token, phoneNumberId);
}
