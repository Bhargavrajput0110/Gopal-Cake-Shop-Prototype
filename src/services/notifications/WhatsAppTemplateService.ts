/**
 * WhatsAppTemplateService — V4 Architecture
 *
 * Given an OrderNotificationData DTO and a notification type,
 * selects the correct Meta template name (including _img variant)
 * and builds the exact ordered variable array.
 *
 * All 11 approved Meta templates are mapped here.
 * Variable order must exactly match the Meta-approved template body.
 */

import type { OrderNotificationData } from './NotificationDataAggregator';

// ─── Template registry ────────────────────────────────────────────────────────

/** All 11 approved Meta template names */
export type WhatsAppTemplateName =
  | 'order_approved_delivery'
  | 'order_approved_delivery_img'
  | 'order_approved_pickup'
  | 'order_approved_pickup_img'
  | 'order_ready_delivery'
  | 'order_ready_pickup'
  | 'order_out_for_delivery'
  | 'order_delivered'
  | 'order_picked_up'
  | 'payment_balance_reminder'
  | 'order_cancelled';

/** Notification types that map to templates */
export type NotificationType =
  | 'ORDER_APPROVED'
  | 'ORDER_READY'
  | 'OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_PICKED_UP'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_BALANCE_REMINDER';

/** Template version — increment when resubmitting to Meta */
export const TEMPLATE_VERSION = 'v1';
export const TEMPLATE_LANGUAGE = 'en';

// ─── Result type ─────────────────────────────────────────────────────────────

export interface TemplateSelection {
  templateName: WhatsAppTemplateName;
  templateVersion: string;
  language: string;
  variables: string[];
  /** If set, caller must upload this image and pass the media_id in the header */
  imageUrl?: string;
  imageType?: 'REFERENCE' | 'PRODUCT';
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class WhatsAppTemplateService {
  /**
   * Resolves the correct template name and variables for a given notification type.
   *
   * IMAGE-header (_img) variants are selected when:
   *   1. referenceImages[] is non-empty (use referenceImages[0])
   *   2. OR productImages[] is non-empty (use productImages[0])
   *
   * Text-only variants are used when no image is available.
   */
  static resolve(
    type: NotificationType,
    data: OrderNotificationData,
    /** Optional: pass a timestamp for events that need the actual completion time */
    eventTimestamp?: Date
  ): TemplateSelection {
    const { customer, order, customization, payment, fulfillment, _meta } = data;
    const isDelivery = fulfillment.type === 'DELIVERY';
    const hasImage = !!_meta.selectedImageUrl;

    const timestamp = (eventTimestamp ?? new Date()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    switch (type) {
      // ── ORDER_APPROVED ─────────────────────────────────────────────────────
      case 'ORDER_APPROVED': {
        if (isDelivery) {
          const templateName: WhatsAppTemplateName = hasImage
            ? 'order_approved_delivery_img'
            : 'order_approved_delivery';

          // 13 variables: {{1}}–{{13}}
          const variables = [
            customer.name,                               // {{1}}
            order.displayId,                             // {{2}}
            order.date,                                  // {{3}}
            order.items,                                 // {{4}}
            customization.specialInstructions,           // {{5}}
            customization.referenceDescription,          // {{6}}
            payment.total,                               // {{7}}
            payment.amountPaid,                          // {{8}}
            payment.paymentMethod,                       // {{9}}
            payment.paymentSummary,                      // {{10}}
            fulfillment.deliveryAddress ?? 'TBD',        // {{11}}
            fulfillment.deliveryDateTime ?? 'TBD',       // {{12}}
          ];

          return {
            templateName,
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables,
            imageUrl: _meta.selectedImageUrl,
            imageType: _meta.selectedImageType,
          };
        } else {
          const templateName: WhatsAppTemplateName = hasImage
            ? 'order_approved_pickup_img'
            : 'order_approved_pickup';

          // 14 variables: {{1}}–{{14}}
          const variables = [
            customer.name,                               // {{1}}
            order.displayId,                             // {{2}}
            order.date,                                  // {{3}}
            order.items,                                 // {{4}}
            customization.specialInstructions,           // {{5}}
            customization.referenceDescription,          // {{6}}
            payment.total,                               // {{7}}
            payment.amountPaid,                          // {{8}}
            payment.paymentMethod,                       // {{9}}
            payment.paymentSummary,                      // {{10}}
            fulfillment.storeName ?? 'Store',            // {{11}}
            fulfillment.storeAddress ?? 'Address TBD',  // {{12}}
            fulfillment.pickupDateTime ?? 'TBD',         // {{13}}
          ];

          return {
            templateName,
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables,
            imageUrl: _meta.selectedImageUrl,
            imageType: _meta.selectedImageType,
          };
        }
      }

      // ── ORDER_READY ────────────────────────────────────────────────────────
      case 'ORDER_READY': {
        if (isDelivery) {
          // 10 variables
          return {
            templateName: 'order_ready_delivery',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              customer.name,                             // {{1}}
              order.displayId,                           // {{2}}
              order.items,                               // {{3}}
              customization.specialInstructions,         // {{4}}
              payment.total,                             // {{5}}
              payment.amountPaid,                        // {{6}}
              payment.paymentSummary,                    // {{7}}
              fulfillment.deliveryAddress ?? 'TBD',      // {{8}}
              fulfillment.deliveryDateTime ?? 'TBD',     // {{9}}
            ],
          };
        } else {
          // 11 variables
          return {
            templateName: 'order_ready_pickup',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              customer.name,                             // {{1}}
              order.displayId,                           // {{2}}
              order.items,                               // {{3}}
              customization.specialInstructions,         // {{4}}
              payment.total,                             // {{5}}
              payment.amountPaid,                        // {{6}}
              payment.paymentSummary,                    // {{7}}
              fulfillment.storeName ?? 'Store',          // {{8}}
              fulfillment.storeAddress ?? 'Address TBD',// {{9}}
              fulfillment.pickupDateTime ?? 'TBD',       // {{10}}
            ],
          };
        }
      }

      // ── OUT_FOR_DELIVERY ───────────────────────────────────────────────────
      case 'OUT_FOR_DELIVERY': {
        // 9 variables
        return {
          templateName: 'order_out_for_delivery',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            customer.name,                               // {{1}}
            order.displayId,                             // {{2}}
            order.items,                                 // {{3}}
            payment.total,                               // {{4}}
            payment.amountPaid,                          // {{5}}
            payment.paymentSummary,                      // {{6}}
            fulfillment.deliveryAddress ?? 'TBD',        // {{7}}
            fulfillment.estimatedArrival ?? 'Shortly',   // {{8}}
          ],
        };
      }

      // ── ORDER_DELIVERED ────────────────────────────────────────────────────
      case 'ORDER_DELIVERED': {
        // 9 variables
        return {
          templateName: 'order_delivered',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            customer.name,                               // {{1}}
            order.displayId,                             // {{2}}
            order.items,                                 // {{3}}
            payment.total,                               // {{4}}
            payment.amountPaid,                          // {{5}}
            payment.paymentSummary,                      // {{6}}
            fulfillment.deliveryAddress ?? 'Your address',// {{7}}
            timestamp,                                    // {{8}} actual delivery time
          ],
        };
      }

      // ── ORDER_PICKED_UP ────────────────────────────────────────────────────
      case 'ORDER_PICKED_UP': {
        // 9 variables
        return {
          templateName: 'order_picked_up',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            customer.name,                               // {{1}}
            order.displayId,                             // {{2}}
            order.items,                                 // {{3}}
            payment.total,                               // {{4}}
            payment.amountPaid,                          // {{5}}
            payment.paymentSummary,                      // {{6}}
            fulfillment.storeName ?? 'Store',            // {{7}}
            timestamp,                                    // {{8}} actual pickup time
          ],
        };
      }

      // ── ORDER_CANCELLED ────────────────────────────────────────────────────
      case 'ORDER_CANCELLED': {
        // 5 variables
        return {
          templateName: 'order_cancelled',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            customer.name,     // {{1}}
            order.displayId,   // {{2}}
            order.date,        // {{3}}
            order.items,       // {{4}}
          ],
        };
      }

      // ── PAYMENT_BALANCE_REMINDER ───────────────────────────────────────────
      case 'PAYMENT_BALANCE_REMINDER': {
        // 8 variables — only called when balanceDue > 0
        return {
          templateName: 'payment_balance_reminder',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            customer.name,           // {{1}}
            order.displayId,         // {{2}}
            payment.total,           // {{3}}
            payment.amountPaid,      // {{4}}
            payment.balanceDue,      // {{5}}
            payment.paymentMethod,   // {{6}}
            order.date,              // {{7}}
            order.items,             // {{8}}
          ],
        };
      }

      default: {
        throw new Error(`[WhatsAppTemplateService] Unknown notification type: ${type}`);
      }
    }
  }
}
v('payment_summary', payment.paymentSummary),
  v('delivery_address', fulfillment.deliveryAddress ?? 'Your address'),
  v('delivered_datetime', eventTime),
          ],
          ...imageResult,
        };
      }

      // ── ORDER_PICKED_UP ────────────────────────────────────────────────────
      case 'ORDER_PICKED_UP': {
  return {
    templateName: 'order_picked_up',
    templateVersion: TEMPLATE_VERSION,
    language: TEMPLATE_LANGUAGE,
    variables: [
      ...coreVars,
      v('payment_summary', payment.paymentSummary),
      v('store_name', fulfillment.storeName ?? 'Gopal Cake Shop'),
      v('picked_up_datetime', eventTime),
    ],
    ...imageResult,
  };
}

      // ── ORDER_CANCELLED ────────────────────────────────────────────────────
      case 'ORDER_CANCELLED': {
  return {
    templateName: 'order_cancelled',
    templateVersion: TEMPLATE_VERSION,
    language: TEMPLATE_LANGUAGE,
    variables: [
      v('customer_name', customer.name),
      v('order_id', order.displayId),
      v('order_date', order.date),
      v('order_details', order.items),
    ],
  };
}

      // ── PAYMENT_BALANCE_REMINDER ───────────────────────────────────────────
      case 'PAYMENT_BALANCE_REMINDER': {
  return {
    templateName: 'payment_balance_reminder',
    templateVersion: TEMPLATE_VERSION,
    language: TEMPLATE_LANGUAGE,
    variables: [
      v('customer_name', customer.name),
      v('business_name', customer.name),   // same as customer name for B2C
      v('order_id', order.displayId),
      v('order_date', order.date),
      v('order_total', payment.total),
      v('amount_paid', payment.amountPaid),
      v('balance_due', payment.balanceDue),
      v('payment_method', payment.paymentMethod),
      v('order_details', order.items),
    ],
  };
}

      default: {
  throw new Error(`[WhatsAppTemplateService] Unknown notification type: ${type}`);
}
    }
  }
}
