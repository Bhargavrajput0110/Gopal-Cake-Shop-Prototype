import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get('trackingId');
  const orderId = searchParams.get('orderId');
  const razorpayPaymentId = searchParams.get('razorpay_payment_id');
  const razorpayStatus = searchParams.get('razorpay_payment_link_status');

  console.log('[PaymentLinkCallback]', { trackingId, orderId, razorpayPaymentId, razorpayStatus });

  const baseUrl = new URL(req.url).origin;

  // ✅ SUCCESS — payment completed
  if (razorpayStatus === 'paid' && orderId && razorpayPaymentId) {
    try {
      // 1. Find the pending payment to get the amount
      const payment = await prisma.payment.findFirst({
        where: { orderId, status: 'PENDING', provider: 'RAZORPAY' },
        include: { order: true },
      });

      if (payment) {
        // 2. Update payment record to SUCCESS
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            gatewayPaymentId: razorpayPaymentId,
            status: 'SUCCESS',
            verifiedAt: new Date(),
          },
        });

        // 3. Create a LedgerEntry so FinancialService reflects this payment
        //    Use razorpayPaymentId as referenceId for idempotency
        const existingLedger = await prisma.ledgerEntry.findUnique({
          where: { referenceId: razorpayPaymentId },
        });
        if (!existingLedger) {
          await prisma.ledgerEntry.create({
            data: {
              orderId,
              type: 'PAYMENT',
              amount: payment.amount,
              method: 'RAZORPAY',
              status: 'SUCCESS',
              referenceId: razorpayPaymentId,
              notes: `Online payment via Razorpay (${razorpayPaymentId})`,
              actorId: payment.order.customerId || 'SYSTEM',
              branchId: payment.order.branchId,
            },
          });
        }

        // 4. Update order status from DRAFT to NEW since payment succeeded
        if (payment.order.status === 'DRAFT') {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'NEW' }
          });
          
          await prisma.timeline.create({
            data: {
              orderId,
              action: 'PAYMENT_RECEIVED',
              status: 'NEW',
              nextState: 'NEW',
              note: `Online payment received via Razorpay, order moved to NEW.`,
            }
          });
          
          // Emit socket event to notify Sales Desk
          const io = (global as any).io;
          if (io) {
            io.to(`branch_${payment.order.branchId}`).emit('order_created');
            io.to('admin_global').emit('order_created');
          }
        }
      } else {
        // Fallback: just mark by gateway ID if payment record not found
        await prisma.payment.updateMany({
          where: { orderId, status: 'PENDING', provider: 'RAZORPAY' },
          data: {
            gatewayPaymentId: razorpayPaymentId,
            status: 'SUCCESS',
            verifiedAt: new Date(),
          },
        });
      }
    } catch (err) {
      console.error('[PaymentLinkCallback] DB update failed:', err);
    }
    return NextResponse.redirect(new URL(`/track/${trackingId}`, baseUrl));
  }

  // ❌ FAILED / CANCELLED — send customer back to checkout to retry
  // Cart is NOT cleared (still in sessionStorage pending_payment)
  // We pass payment_failed=1 so checkout page can show a toast
  if (trackingId) {
    return NextResponse.redirect(new URL(`/checkout?payment_failed=1&orderId=${orderId || ''}`, baseUrl));
  }

  return NextResponse.redirect(new URL('/', baseUrl));
}
