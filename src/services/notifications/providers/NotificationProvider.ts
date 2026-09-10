/**
 * NotificationProvider — V4 Architecture
 *
 * Abstract interface for notification delivery providers.
 * The rest of the application interacts with this interface only.
 * Concrete implementations (e.g. WhatsAppProvider) are injected at dispatch time.
 */

export interface SendTemplateParams {
  /** Recipient phone number in E.164 format (e.g. "919712632132") */
  phone: string;
  /** Exact Meta-approved template name (e.g. "order_approved_delivery_img") */
  templateName: string;
  /** Template version for logging (e.g. "v1") */
  templateVersion: string;
  /** BCP-47 language code (e.g. "en") */
  language: string;
  /** Ordered variable values matching {{1}}, {{2}}, ... in the template body */
  variables: string[];
  /** Pre-uploaded Meta media_id — only for IMAGE-header template variants */
  mediaId?: string;
}

export interface MediaUploadResult {
  /** Meta's media_id returned after upload — used in IMAGE header of a template */
  providerMediaId: string;
}

export interface ProviderResult {
  success: boolean;
  /** Meta's wamid — only present on success */
  providerMessageId?: string;
  /** Raw error detail from the provider */
  error?: string;
  /**
   * Retry guidance:
   *   true  = 5xx / transient — safe to retry (max 2 retries)
   *   false = 4xx / permanent — do not retry
   *   undefined = outcome unknown (timeout) — do NOT auto-retry
   */
  retryable?: boolean;
}

export interface NotificationProvider {
  /**
   * Send a pre-approved Meta template message.
   * Must never throw — return a ProviderResult instead.
   */
  sendTemplate(params: SendTemplateParams): Promise<ProviderResult>;

  /**
   * Upload an image to Meta's servers and return its media_id.
   * Required before sending IMAGE-header templates.
   */
  uploadMedia(imageUrl: string): Promise<MediaUploadResult>;
}

