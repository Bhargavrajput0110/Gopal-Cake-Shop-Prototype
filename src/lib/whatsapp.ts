/**
 * @deprecated
 * This file is a compatibility shim for legacy imports.
 *
 * The WhatsApp integration has been refactored under V4 architecture:
 *   src/services/notifications/providers/WhatsAppProvider.ts
 *   src/services/notifications/NotificationDataAggregator.ts
 *   src/services/notifications/WhatsAppTemplateService.ts
 *
 * Do not add new logic here. Use the provider abstraction layer directly.
 */

export { createWhatsAppProvider, WhatsAppProvider } from '@/services/notifications/providers/WhatsAppProvider';
