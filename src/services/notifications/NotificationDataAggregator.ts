/**
 * NotificationDataAggregator — V4 Architecture
 *
 * Performs a single, comprehensive database fetch for a given order
 * and returns the canonical OrderNotificationData DTO.
 *
 * Every WhatsApp template consumes fields from this DTO.
 * No template-specific DB queries are permitted outside this aggregator.
 */

import { prisma } from '@/lib/prisma';
import { LoggerService } from '@/services/LoggerService';

// ─── Canonical DTO ────────────────────────────────────────────────────────────

export interface OrderNotificationData {
  customer: {
    name: string;
    phone: string;
  };
  order: {
    displayId: string;       // orderNumber (human-readable)
    date: string;            // formatted "DD MMM YYYY"
    /**
     * Comma-separated item summary. No newlines (Meta API restriction).
     * e.g. "1x Chocolate Truffle - 1kg, 2x Venom Cake - 2kg"
     */
    items: string;
  };
  customization: {
    messageOnCake: string;             // "None" when empty
    specialInstructions: string;       // "None" when empty
    /**
     * Natural language reference description:
     *   "Design Reference Attached"  — when referenceImages is non-empty
     *   "No Design Reference"        — when empty
     */
    referenceDescription: string;
    media: {
      productImages: string[];         // Product thumbnail URLs from catalog
      referenceImages: string[];       // Customer-uploaded reference/design images
    };
  };
  payment: {
    total: string;                     // Formatted integer string, e.g. "1500"
    amountPaid: string;                // Sum of all SUCCESS payments
    balanceDue: string;                // total - amountPaid
    paymentMethod: string;             // e.g. "RAZORPAY", "CASH"
    /**
     * Single inline string (no newlines — Meta API restriction):
     *   "Paid in Full"           — when balanceDue == 0
     *   "Balance Due: Rs. 1000" — when balanceDue > 0
     */
    paymentSummary: string;
  };
  fulfillment: {
    type: 'DELIVERY' | 'PICKUP';
    deliveryAddress?: string;
    deliveryDateTime?: string;
    estimatedArrival?: string;
    storeName?: string;
    storeAddress?: string;
    pickupDateTime?: string;
  };
  /**
   * Internal metadata used by WhatsAppTemplateService to pick template variant.
   * Never sent to the customer.
   */
  _meta: {
    /** Resolved from referenceImages[0] ?? productImages[0] — undefined if none */
    selectedImageUrl?: string;
    selectedImageType?: 'REFERENCE' | 'PRODUCT';
  };
}

// ─── Aggregator ───────────────────────────────────────────────────────────────

export class NotificationDataAggregator {
  /**
   * Fetch all order data required for WhatsApp notifications in a single query.
   * Returns null if the order or customer is not found.
   */
  static async build(orderId: string): Promise<OrderNotificationData | undefined> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        branch: true,
        items: {
          include: {
            product: {
              select: { thumbnail: true, mediumImage: true },
            },
            media: true,  // OrderItemMedia — includes REFERENCE type images
          },
        },
        payments: {
          where: { status: 'SUCCESS' },
        },
      },
    });

    if (!order || !order.customer) {
      LoggerService.warn(`[NotificationDataAggregator] Order ${orderId} or customer not found`);
      return undefined;
    }

    // ── Customer ─────────────────────────────────────────────────────────────
    const customer = {
      name: order.customer.name || 'Customer',
      phone: order.customer.phone || '',
    };

    // ── Order display ─────────────────────────────────────────────────────────
    const date = order.createdAt.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }); // "27 Aug 2026"

    const items = order.items
      .map((item) => {
        const parts: string[] = [`${item.quantity}x ${item.productName}`];
        if (item.weight) parts.push(`${item.weight}kg`);
        if (item.variant) parts.push(item.variant);
        return parts.join(' - ');
      })
      .join(', ');

    // ── Media ─────────────────────────────────────────────────────────────────
    const referenceImages: string[] = [];
    const productImages: string[] = [];

    for (const item of order.items) {
      // Reference images from OrderItemMedia (type = REFERENCE)
      for (const m of item.media) {
        if (m.type === 'REFERENCE' && m.url) {
          referenceImages.push(m.url);
        }
      }
      // Product images from catalog
      const imgUrl = item.product?.thumbnail || item.product?.mediumImage || item.image;
      if (imgUrl && !productImages.includes(imgUrl)) {
        productImages.push(imgUrl);
      }
    }

    const referenceDescription =
      referenceImages.length > 0 ? 'Design Reference Attached' : 'No Design Reference';

    // Resolve selected image (reference first, then product)
    const selectedImageUrl = referenceImages[0] ?? productImages[0] ?? undefined;
    const selectedImageType = referenceImages[0]
      ? 'REFERENCE'
      : productImages[0]
      ? 'PRODUCT'
      : undefined;

    // ── Payment ───────────────────────────────────────────────────────────────
    const totalNum = Number(order.totalAmount.toString());
    const paidNum = order.payments.reduce(
      (sum, p) => sum + Number(p.amount.toString()),
      0
    );
    const balanceNum = Math.max(totalNum - paidNum, 0);

    const total = Math.round(totalNum).toString();
    const amountPaid = Math.round(paidNum).toString();
    const balanceDue = Math.round(balanceNum).toString();
    const paymentMethod =
      order.payments[0]?.method?.toString() || 'N/A';

    const paymentSummary =
      balanceNum === 0
        ? 'Paid in Full'
        : `Balance Due: Rs. ${balanceDue}`;

    // ── Fulfillment ───────────────────────────────────────────────────────────
    const targetDateFormatted = order.targetDate
      ? order.targetDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'To be confirmed';

    const fulfillment: OrderNotificationData['fulfillment'] =
      order.deliveryType === 'DELIVERY'
        ? {
            type: 'DELIVERY',
            deliveryAddress: order.deliveryAddress || 'Address not provided',
            deliveryDateTime: targetDateFormatted,
            estimatedArrival: targetDateFormatted,
          }
        : {
            type: 'PICKUP',
            storeName: order.branch.name,
            storeAddress: order.branch.address,
            pickupDateTime: targetDateFormatted,
          };

    return {
      customer,
      order: {
        displayId: order.orderNumber,
        date,
        items,
      },
      customization: {
        messageOnCake: order.items.map(i => i.messageOnCake).filter(Boolean).join(', ') || 'None',
        specialInstructions: order.customerNotes || 'None',
        referenceDescription,
        media: { productImages, referenceImages },
      },
      payment: {
        total,
        amountPaid,
        balanceDue,
        paymentMethod,
        paymentSummary,
      },
      fulfillment,
      _meta: {
        selectedImageUrl,
        selectedImageType: selectedImageType as 'REFERENCE' | 'PRODUCT' | undefined,
      },
    };
  }
}
