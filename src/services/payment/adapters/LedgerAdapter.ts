import { prisma } from '@/lib/prisma';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class LedgerAdapter {
  static async recordPayment(orderId: string, amount: number, paymentMethod: PaymentMethod, gatewayPaymentId: string) {
    // Determine the branch from the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { branchId: true }
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    return prisma.ledgerEntry.create({
      data: {
        orderId,
        type: 'PAYMENT',
        amount,
        currency: 'INR',
        method: paymentMethod,
        status: PaymentStatus.SUCCESS,
        referenceId: gatewayPaymentId,
        branchId: order.branchId,
        notes: `Automated payment record via ${paymentMethod}`
      }
    });
  }

  static async recordRefund(orderId: string, amount: number, paymentMethod: PaymentMethod, gatewayRefundId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { branchId: true }
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    return prisma.ledgerEntry.create({
      data: {
        orderId,
        type: 'REFUND',
        // Refunds are represented as negative amounts for simple summation later
        amount: -amount,
        currency: 'INR',
        method: paymentMethod,
        status: PaymentStatus.SUCCESS,
        referenceId: gatewayRefundId,
        branchId: order.branchId,
        notes: `Automated refund record via ${paymentMethod}`
      }
    });
  }
}
