/**
 * WhatsAppTemplateService — V4 Architecture
 *
 * Given an OrderNotificationData DTO and a notification type,
 * selects the correct Meta template name (including _img variant)
 * and builds the exact ordered variable array.
 *
 * ALL variable arrays are verified against approved Meta templates.
 * Variable order must exactly match the Meta-approved template body.
 *
 * ⚠️  IMPORTANT — Meta template update required for contact_info:
 * Each template's last static line must be replaced with {{contact_info}}.
 * e.g. change:
 *   "For any further queries, please contact Gopal Cake Shop at +91 97126 32132."
 * to:
 *   {{contact_info}}
 *
 * Then code will inject:
 *   - POS orders  → branch phone + Rishi Bhai on separate lines
 *   - Online      → the original standard Gopal Cake Shop line
 */

import type { OrderNotificationData } from './NotificationDataAggregator';

// ─── Template registry ────────────────────────────────────────────────────────

/** All approved Meta template names */
export type WhatsAppTemplateName =
  | 'order_approved_delivery'
  | 'order_approved_pickup'
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
  /** Dynamic URL parameter for template buttons (e.g. orderId / orderNumber) */
  buttonUrlParam?: string;
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

    // ─── contact_info variable ────────────────────────────────────────────────
    // Replaces the hardcoded static footer line in each Meta template.
    // POS / SALES / non-website → branch phone + Rishi Bhai on separate clean lines
    // Online (WEBSITE)          → original standard contact line, unchanged
    const isPosOrder = ['POS', 'SALES', 'ADMIN', 'WHATSAPP', 'INSTAGRAM', 'PHONE'].includes(_meta.orderSource);
    const contactInfo = isPosOrder
      ? `For any further queries:\n📞 Branch (${_meta.branchShortName}): ${_meta.branchPhone}\n📞 Owner Rishi Bhai: ${_meta.ownerPhone}`
      : `For any further queries, please contact Gopal Cake Shop at ${_meta.ownerPhone}.`;

    switch (type) {

      // ── QUOTE_CREATED ───────────────────────────────────────────────────────
      case 'QUOTE_CREATED': {
        if (isDelivery) {
          return {
            templateName: 'quote_created',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              { name: 'customer_name',        text: customer.name },
              { name: 'order_id',             text: order.displayId },
              { name: 'order_date',           text: order.date },
              { name: 'order_details',        text: order.items },
              { name: 'message_on_cake',      text: customization.messageOnCake || 'None' },
              { name: 'special_instructions', text: customization.specialInstructions || 'None' },
              { name: 'order_total',          text: payment.total },
              { name: 'amount_paid',          text: payment.amountPaid },
              { name: 'payment_summary',      text: payment.paymentSummary },
              { name: 'delivery_address',     text: fulfillment.deliveryAddress ?? 'TBD' },
              { name: 'delivery_datetime',    text: fulfillment.deliveryDateTime ?? 'TBD' },
              { name: 'contact_info',         text: contactInfo },
            ],
            imageUrl: _meta.selectedImageUrl,
            imageType: _meta.selectedImageType,
            buttonUrlParam: order.displayId,
          };
        } else {
          return {
            templateName: 'quote_created_pickup',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              { name: 'customer_name',        text: customer.name },
              { name: 'order_id',             text: order.displayId },
              { name: 'order_date',           text: order.date },
              { name: 'order_details',        text: order.items },
              { name: 'message_on_cake',      text: customization.messageOnCake || 'None' },
              { name: 'special_instructions', text: customization.specialInstructions || 'None' },
              { name: 'order_total',          text: payment.total },
              { name: 'amount_paid',          text: payment.amountPaid },
              { name: 'payment_summary',      text: payment.paymentSummary },
              { name: 'store_name',           text: fulfillment.storeName ?? 'Gopal Cake Shop' },
              { name: 'store_address',        text: fulfillment.storeAddress ?? 'TBD' },
              { name: 'pickup_datetime',      text: fulfillment.pickupDateTime ?? 'TBD' },
              { name: 'contact_info',         text: contactInfo },
            ],
            imageUrl: _meta.selectedImageUrl,
            imageType: _meta.selectedImageType,
            buttonUrlParam: order.displayId,
          };
        }
      }

      // ── ORDER_APPROVED ─────────────────────────────────────────────────────
      case 'ORDER_APPROVED': {
        if (isDelivery) {
          return {
            templateName: 'order_approved_delivery',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              { name: 'customer_name',        text: customer.name },
              { name: 'order_id',             text: order.displayId },
              { name: 'order_date',           text: order.date },
              { name: 'order_details',        text: order.items },
              { name: 'message_on_cake',      text: customization.messageOnCake || 'None' },
              { name: 'special_instructions', text: customization.specialInstructions || 'None' },
              { name: 'order_total',          text: payment.total },
              { name: 'amount_paid',          text: payment.amountPaid },
              { name: 'payment_summary',      text: payment.paymentSummary },
              { name: 'delivery_address',     text: fulfillment.deliveryAddress ?? 'TBD' },
              { name: 'delivery_datetime',    text: fulfillment.deliveryDateTime ?? 'TBD' },
              { name: 'contact_info',         text: contactInfo },
            ],
            imageUrl: _meta.selectedImageUrl,
            imageType: _meta.selectedImageType,
          };
        } else {
          return {
            templateName: 'order_approved_pickup',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              { name: 'customer_name',        text: customer.name },
              { name: 'order_id',             text: order.displayId },
              { name: 'order_date',           text: order.date },
              { name: 'order_details',        text: order.items },
              { name: 'message_on_cake',      text: customization.messageOnCake || 'None' },
              { name: 'special_instructions', text: customization.specialInstructions || 'None' },
              { name: 'order_total',          text: payment.total },
              { name: 'amount_paid',          text: payment.amountPaid },
              { name: 'payment_summary',      text: payment.paymentSummary },
              { name: 'store_name',           text: fulfillment.storeName ?? 'Gopal Cake Shop' },
              { name: 'store_address',        text: fulfillment.storeAddress ?? 'TBD' },
              { name: 'pickup_datetime',      text: fulfillment.pickupDateTime ?? 'TBD' },
              { name: 'contact_info',         text: contactInfo },
            ],
            imageUrl: _meta.selectedImageUrl,
            imageType: _meta.selectedImageType,
          };
        }
      }

      // ── ORDER_READY ────────────────────────────────────────────────────────
      case 'ORDER_READY': {
        if (isDelivery) {
          return {
            templateName: 'order_ready_delivery',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              { name: 'customer_name',        text: customer.name },
              { name: 'order_id',             text: order.displayId },
              { name: 'order_details',        text: order.items },
              { name: 'message_on_cake',      text: customization.messageOnCake || 'None' },
              { name: 'special_instructions', text: customization.specialInstructions || 'None' },
              { name: 'order_total',          text: payment.total },
              { name: 'payment_summary',      text: payment.paymentSummary },
              { name: 'delivery_address',     text: fulfillment.deliveryAddress ?? 'TBD' },
              { name: 'delivery_datetime',    text: fulfillment.deliveryDateTime ?? 'TBD' },
              { name: 'contact_info',         text: contactInfo },
            ],
            imageUrl: _meta.selectedImageUrl,
          };
        } else {
          return {
            templateName: 'order_ready_pickup',
            templateVersion: TEMPLATE_VERSION,
            language: TEMPLATE_LANGUAGE,
            variables: [
              { name: 'customer_name',        text: customer.name },
              { name: 'order_id',             text: order.displayId },
              { name: 'order_details',        text: order.items },
              { name: 'message_on_cake',      text: customization.messageOnCake || 'None' },
              { name: 'special_instructions', text: customization.specialInstructions || 'None' },
              { name: 'order_total',          text: payment.total },
              { name: 'payment_summary',      text: payment.paymentSummary },
              { name: 'store_name',           text: fulfillment.storeName ?? 'Gopal Cake Shop' },
              { name: 'store_address',        text: fulfillment.storeAddress ?? 'TBD' },
              { name: 'pickup_datetime',      text: fulfillment.pickupDateTime ?? 'TBD' },
              { name: 'contact_info',         text: contactInfo },
            ],
            imageUrl: _meta.selectedImageUrl,
          };
        }
      }

      // ── OUT_FOR_DELIVERY ───────────────────────────────────────────────────
      case 'OUT_FOR_DELIVERY': {
        return {
          templateName: 'order_out_for_delivery',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            { name: 'customer_name',        text: customer.name },
            { name: 'order_id',             text: order.displayId },
            { name: 'order_details',        text: order.items },
            { name: 'message_on_cake',      text: customization.messageOnCake || 'None' },
            { name: 'special_instructions', text: customization.specialInstructions || 'None' },
            { name: 'order_total',          text: payment.total },
            { name: 'payment_summary',      text: payment.paymentSummary },
            { name: 'delivery_address',     text: fulfillment.deliveryAddress ?? 'TBD' },
            { name: 'estimated_arrival',    text: fulfillment.estimatedArrival ?? 'Shortly' },
            { name: 'contact_info',         text: contactInfo },
          ],
          imageUrl: _meta.selectedImageUrl,
        };
      }

      // ── ORDER_DELIVERED ────────────────────────────────────────────────────
      case 'ORDER_DELIVERED': {
        return {
          templateName: 'order_delivered',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            { name: 'customer_name',        text: customer.name },
            { name: 'order_id',             text: order.displayId },
            { name: 'order_details',        text: order.items },
            { name: 'message_on_cake',      text: customization.messageOnCake || 'None' },
            { name: 'special_instructions', text: customization.specialInstructions || 'None' },
            { name: 'order_total',          text: payment.total },
            { name: 'payment_summary',      text: payment.paymentSummary },
            { name: 'delivery_address',     text: fulfillment.deliveryAddress ?? 'Your address' },
            { name: 'delivered_datetime',   text: timestamp },
            { name: 'contact_info',         text: contactInfo },
          ],
          imageUrl: _meta.selectedImageUrl,
        };
      }

      // ── ORDER_PICKED_UP ────────────────────────────────────────────────────
      case 'ORDER_PICKED_UP': {
        return {
          templateName: 'order_picked_up',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            { name: 'customer_name',        text: customer.name },
            { name: 'order_id',             text: order.displayId },
            { name: 'order_details',        text: order.items },
            { name: 'message_on_cake',      text: customization.messageOnCake || 'None' },
            { name: 'special_instructions', text: customization.specialInstructions || 'None' },
            { name: 'order_total',          text: payment.total },
            { name: 'payment_summary',      text: payment.paymentSummary },
            { name: 'store_name',           text: fulfillment.storeName ?? 'Gopal Cake Shop' },
            { name: 'picked_up_datetime',   text: timestamp },
            { name: 'contact_info',         text: contactInfo },
          ],
          imageUrl: _meta.selectedImageUrl,
        };
      }

      // ── ORDER_CANCELLED ────────────────────────────────────────────────────
      case 'ORDER_CANCELLED': {
        return {
          templateName: 'order_cancelled',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            { name: 'customer_name',  text: customer.name },
            { name: 'order_id',       text: order.displayId },
            { name: 'order_date',     text: order.date },
            { name: 'order_details',  text: order.items },
          ],
          // NOTE: order_cancelled template has NO image header — do not pass imageUrl
        };
      }

      // ── PAYMENT_BALANCE_REMINDER ───────────────────────────────────────────
      case 'PAYMENT_BALANCE_REMINDER': {
        return {
          templateName: 'payment_balance_reminder',
          templateVersion: TEMPLATE_VERSION,
          language: TEMPLATE_LANGUAGE,
          variables: [
            { name: 'customer_name',  text: customer.name },
            { name: 'business_name',  text: customer.name },
            { name: 'order_id',       text: order.displayId },
            { name: 'order_date',     text: order.date },
            { name: 'order_total',    text: payment.total },
            { name: 'amount_paid',    text: payment.amountPaid },
            { name: 'balance_due',    text: payment.balanceDue },
            { name: 'payment_method', text: payment.paymentMethod },
            { name: 'order_details',  text: order.items },
            { name: 'contact_info',   text: contactInfo },
          ],
          imageUrl: _meta.selectedImageUrl,
        };
      }

      default: {
        throw new Error(`[WhatsAppTemplateService] Unknown notification type: ${type}`);
      }
    }
  }
}
