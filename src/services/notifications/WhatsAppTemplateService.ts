/**
 * WhatsAppTemplateService — V4 Architecture
 *
 * Given an OrderNotificationData DTO and a notification type,
 * selects the correct Meta template name (including _img variant)
 * and builds the exact ordered variable array.
 *
 * ALL variable arrays are verified against approved Meta templates.
 * Variable order must exactly match the Meta-approved template body.
 */

import type { OrderNotificationData } from './NotificationDataAggregator';

// ─── Template registry ────────────────────────────────────────────────────────

/** All approved Meta template names */
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
  | 'order_cancelled'
  | 'quote_created'
  | 'quote_created_pickup';

/** Notification types that map to templates */
export type NotificationType =
  | 'ORDER_APPROVED'
  | 'ORDER_READY'
  | 'OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_PICKED_UP'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_BALANCE_REMINDER'
  | 'QUOTE_CREATED';

/** Template version — increment when resubmitting to Meta */
export const TEMPLATE_VERSION = 'v1';
export const TEMPLATE_LANGUAGE = 'en';

// ─── Result type ─────────────────────────────────────────────────────────────

export interface TemplateSelection {
  templateName: WhatsAppTemplateName;
  templateVersion: string;
  language: string;
  variables: { name: string; text: string }[];
  /** If set, caller must upload this image and pass the media_id in the header */
  imageUrl?: string;
  imageType?: 'REFERENCE' | 'PRODUCT';
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class WhatsAppTemplateService {
  /**
   * Resolves the correct template name and variables for a given notification type.
   */
  static resolve(
    type: NotificationType,
    data: OrderNotificationData,
    /** Optional: pass a timestamp for events that need the actual completion time */
    eventTimestamp?: Date
  ): TemplateSelection {
    const { customer, order, customization, payment, fulfillment, _meta } = data;
    const isDelivery = fulfillment.type === 'DELIVERY';

    const timestamp = (eventTimestamp ?? new Date()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    switch (type) {

      // ── QUOTE_CREATED ───────────────────────────────────────────────────────
      // Triggered when sales sends a quote to customer
      case 'QUOTE_CREATED': {
        if (isDelivery) {
          // quote_created — 11 variables:
          // customer_name, order_id, order_date, order_details, message_on_cake,
          // special_instructions, order_total, amount_paid, payment_summary,
          // delivery_address, delivery_datetime
          return {
            templateName: 'quote_created',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              { name: 'customer_name', text: customer.name },
              { name: 'order_id', text: order.displayId },
              { name: 'order_date', text: order.date },
              { name: 'order_details', text: order.items },
              { name: 'message_on_cake', text: customization.messageOnCake || 'None' },{ name: 'special_instructions', text: customization.specialInstructions || 'None' },{ name: 'order_total', text: payment.total },
              { name: 'amount_paid', text: payment.amountPaid },
              { name: 'payment_summary', text: payment.paymentSummary },
              { name: 'delivery_address', text: fulfillment.deliveryAddress ?? 'TBD' },
              { name: 'delivery_datetime', text: fulfillment.deliveryDateTime ?? 'TBD' },
            ],
            imageUrl: _meta.selectedImageUrl || 'https://bhargavrajput0110.github.io/Gopal-Cake-Shop-Prototype/logo.png',
            imageType: _meta.selectedImageType,
          };
        } else {
          // quote_created_pickup — 12 variables:
          // customer_name, order_id, order_date, order_details, message_on_cake,
          // special_instructions, order_total, amount_paid, payment_summary,
          // store_name, store_address, pickup_datetime
          return {
            templateName: 'quote_created_pickup',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              { name: 'customer_name', text: customer.name },
              { name: 'order_id', text: order.displayId },
              { name: 'order_date', text: order.date },
              { name: 'order_details', text: order.items },
              { name: 'message_on_cake', text: customization.messageOnCake || 'None' },{ name: 'special_instructions', text: customization.specialInstructions || 'None' },{ name: 'order_total', text: payment.total },
              { name: 'amount_paid', text: payment.amountPaid },
              { name: 'payment_summary', text: payment.paymentSummary },
              { name: 'store_name', text: fulfillment.storeName ?? 'Gopal Cake Shop' },
              { name: 'store_address', text: fulfillment.storeAddress ?? 'TBD' },
              { name: 'pickup_datetime', text: fulfillment.pickupDateTime ?? 'TBD' },
            ],
            imageUrl: _meta.selectedImageUrl || 'https://bhargavrajput0110.github.io/Gopal-Cake-Shop-Prototype/logo.png',
            imageType: _meta.selectedImageType,
          };
        }
      }

      // ── ORDER_APPROVED ─────────────────────────────────────────────────────
      case 'ORDER_APPROVED': {
        if (isDelivery) {
          // order_approved_delivery — 11 variables:
          // customer_name, order_id, order_date, order_details, message_on_cake,
          // special_instructions, order_total, amount_paid, payment_summary,
          // delivery_address, delivery_datetime
          return {
            templateName: 'order_approved_delivery',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              { name: 'customer_name', text: customer.name },
              { name: 'order_id', text: order.displayId },
              { name: 'order_date', text: order.date },
              { name: 'order_details', text: order.items },
              { name: 'message_on_cake', text: customization.messageOnCake || 'None' },{ name: 'special_instructions', text: customization.specialInstructions || 'None' },{ name: 'order_total', text: payment.total },
              { name: 'amount_paid', text: payment.amountPaid },
              { name: 'payment_summary', text: payment.paymentSummary },
              { name: 'delivery_address', text: fulfillment.deliveryAddress ?? 'TBD' },
              { name: 'delivery_datetime', text: fulfillment.deliveryDateTime ?? 'TBD' },
            ],
            imageUrl: _meta.selectedImageUrl || 'https://bhargavrajput0110.github.io/Gopal-Cake-Shop-Prototype/logo.png',
            imageType: _meta.selectedImageType,
          };
        } else {
          // order_approved_pickup — 12 variables:
          // customer_name, order_id, order_date, order_details, message_on_cake,
          // special_instructions, order_total, amount_paid, payment_summary,
          // store_name, store_address, pickup_datetime
          return {
            templateName: 'order_approved_pickup',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              { name: 'customer_name', text: customer.name },
              { name: 'order_id', text: order.displayId },
              { name: 'order_date', text: order.date },
              { name: 'order_details', text: order.items },
              { name: 'message_on_cake', text: customization.messageOnCake || 'None' },{ name: 'special_instructions', text: customization.specialInstructions || 'None' },{ name: 'order_total', text: payment.total },
              { name: 'amount_paid', text: payment.amountPaid },
              { name: 'payment_summary', text: payment.paymentSummary },
              { name: 'store_name', text: fulfillment.storeName ?? 'Gopal Cake Shop' },
              { name: 'store_address', text: fulfillment.storeAddress ?? 'TBD' },
              { name: 'pickup_datetime', text: fulfillment.pickupDateTime ?? 'TBD' },
            ],
            imageUrl: _meta.selectedImageUrl || 'https://bhargavrajput0110.github.io/Gopal-Cake-Shop-Prototype/logo.png',
            imageType: _meta.selectedImageType,
          };
        }
      }

      // ── ORDER_READY ────────────────────────────────────────────────────────
      case 'ORDER_READY': {
        if (isDelivery) {
          // order_ready_delivery — 9 variables:
          // customer_name, order_id, order_details, message_on_cake,
          // special_instructions, order_total, payment_summary,
          // delivery_address, delivery_datetime
          return {
            templateName: 'order_ready_delivery',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              { name: 'customer_name', text: customer.name },
              { name: 'order_id', text: order.displayId },
              { name: 'order_details', text: order.items },
              { name: 'message_on_cake', text: customization.messageOnCake || 'None' },{ name: 'special_instructions', text: customization.specialInstructions || 'None' },{ name: 'order_total', text: payment.total },
              { name: 'payment_summary', text: payment.paymentSummary },
              { name: 'delivery_address', text: fulfillment.deliveryAddress ?? 'TBD' },
              { name: 'delivery_datetime', text: fulfillment.deliveryDateTime ?? 'TBD' },
            ],
            imageUrl: _meta.selectedImageUrl || 'https://bhargavrajput0110.github.io/Gopal-Cake-Shop-Prototype/logo.png',
          };
        } else {
          // order_ready_pickup — 10 variables:
          // customer_name, order_id, order_details, message_on_cake,
          // special_instructions, order_total, payment_summary,
          // store_name, store_address, pickup_datetime
          return {
            templateName: 'order_ready_pickup',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              { name: 'customer_name', text: customer.name },
              { name: 'order_id', text: order.displayId },
              { name: 'order_details', text: order.items },
              { name: 'message_on_cake', text: customization.messageOnCake || 'None' },{ name: 'special_instructions', text: customization.specialInstructions || 'None' },{ name: 'order_total', text: payment.total },
              { name: 'payment_summary', text: payment.paymentSummary },
              { name: 'store_name', text: fulfillment.storeName ?? 'Gopal Cake Shop' },
              { name: 'store_address', text: fulfillment.storeAddress ?? 'TBD' },
              { name: 'pickup_datetime', text: fulfillment.pickupDateTime ?? 'TBD' },
            ],
            imageUrl: _meta.selectedImageUrl || 'https://bhargavrajput0110.github.io/Gopal-Cake-Shop-Prototype/logo.png',
          };
        }
      }

      // ── OUT_FOR_DELIVERY ───────────────────────────────────────────────────
      // order_out_for_delivery — 9 variables:
      // customer_name, order_id, order_details, message_on_cake,
      // special_instructions, order_total, payment_summary,
      // delivery_address, estimated_arrival
      case 'OUT_FOR_DELIVERY': {
        return {
          templateName: 'order_out_for_delivery',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            { name: 'customer_name', text: customer.name },
            { name: 'order_id', text: order.displayId },
            { name: 'order_details', text: order.items },
            { name: 'message_on_cake', text: customization.messageOnCake || 'None' },{ name: 'special_instructions', text: customization.specialInstructions || 'None' },{ name: 'order_total', text: payment.total },
            { name: 'payment_summary', text: payment.paymentSummary },
            { name: 'delivery_address', text: fulfillment.deliveryAddress ?? 'TBD' },
            { name: 'estimated_arrival', text: fulfillment.estimatedArrival ?? 'Shortly' },
          ],
            imageUrl: _meta.selectedImageUrl || 'https://bhargavrajput0110.github.io/Gopal-Cake-Shop-Prototype/logo.png',
        };
      }

      // ── ORDER_DELIVERED ────────────────────────────────────────────────────
      // order_delivered — 9 variables:
      // customer_name, order_id, order_details, message_on_cake,
      // special_instructions, order_total, payment_summary,
      // delivery_address, delivered_datetime
      case 'ORDER_DELIVERED': {
        return {
          templateName: 'order_delivered',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            { name: 'customer_name', text: customer.name },
            { name: 'order_id', text: order.displayId },
            { name: 'order_details', text: order.items },
            { name: 'message_on_cake', text: customization.messageOnCake || 'None' },{ name: 'special_instructions', text: customization.specialInstructions || 'None' },{ name: 'order_total', text: payment.total },
            { name: 'payment_summary', text: payment.paymentSummary },
            { name: 'delivery_address', text: fulfillment.deliveryAddress ?? 'Your address' },
            { name: 'delivered_datetime', text: timestamp },
          ],
            imageUrl: _meta.selectedImageUrl || 'https://bhargavrajput0110.github.io/Gopal-Cake-Shop-Prototype/logo.png',
        };
      }

      // ── ORDER_PICKED_UP ────────────────────────────────────────────────────
      // order_picked_up — 9 variables:
      // customer_name, order_id, order_details, message_on_cake,
      // special_instructions, order_total, payment_summary,
      // store_name, picked_up_datetime
      case 'ORDER_PICKED_UP': {
        return {
          templateName: 'order_picked_up',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            { name: 'customer_name', text: customer.name },
            { name: 'order_id', text: order.displayId },
            { name: 'order_details', text: order.items },
            { name: 'message_on_cake', text: customization.messageOnCake || 'None' },{ name: 'special_instructions', text: customization.specialInstructions || 'None' },{ name: 'order_total', text: payment.total },
            { name: 'payment_summary', text: payment.paymentSummary },
            { name: 'store_name', text: fulfillment.storeName ?? 'Gopal Cake Shop' },
            { name: 'picked_up_datetime', text: timestamp },
          ],
            imageUrl: _meta.selectedImageUrl || 'https://bhargavrajput0110.github.io/Gopal-Cake-Shop-Prototype/logo.png',
        };
      }

      // ── ORDER_CANCELLED ────────────────────────────────────────────────────
      // order_cancelled — 4 variables:
      // customer_name, order_id, order_date, order_details
      case 'ORDER_CANCELLED': {
        return {
          templateName: 'order_cancelled',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            { name: 'customer_name', text: customer.name },
            { name: 'order_id', text: order.displayId },
            { name: 'order_date', text: order.date },
            { name: 'order_details', text: order.items },
          ],
            imageUrl: _meta.selectedImageUrl || 'https://bhargavrajput0110.github.io/Gopal-Cake-Shop-Prototype/logo.png',
        };
      }

      // ── PAYMENT_BALANCE_REMINDER ───────────────────────────────────────────
      // payment_balance_reminder — 9 variables:
      // customer_name, business_name (customer name used), order_id, order_date,
      // order_total, amount_paid, balance_due, payment_method, order_details
      case 'PAYMENT_BALANCE_REMINDER': {
        return {
          templateName: 'payment_balance_reminder',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            { name: 'customer_name', text: customer.name },
            { name: 'business_name', text: customer.name },
            { name: 'order_id', text: order.displayId },
            { name: 'order_date', text: order.date },
            { name: 'order_total', text: payment.total },
            { name: 'amount_paid', text: payment.amountPaid },
            { name: 'balance_due', text: payment.balanceDue },
            { name: 'payment_method', text: payment.paymentMethod },
            { name: 'order_details', text: order.items },
          ],
            imageUrl: _meta.selectedImageUrl || 'https://bhargavrajput0110.github.io/Gopal-Cake-Shop-Prototype/logo.png',
        };
      }

      default: {
        throw new Error(`[WhatsAppTemplateService] Unknown notification type: ${type}`);
      }
    }
  }
}
