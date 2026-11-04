import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPieceOrNonWeightItem, formatItemWeight } from '@/lib/itemUtils';
import { PaymentMethod, PaymentType, PaymentStatus, OrderStatus } from '@prisma/client';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } }
) {
  try {
    const resolvedParams = await params;
    const { orderId } = resolvedParams;

    const body = await req.json();
    const { status, actorName, advancePaid } = body;

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderId }
        ]
      },
      include: {
        payments: true,
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const orderTotal = Number(order.totalAmount);
    const minAdvance = Math.ceil(orderTotal * 0.50);

    // Validate 50% minimum advance requirement on customer orders
    if (advancePaid !== undefined && advancePaid !== null) {
      const advanceNum = Number(advancePaid);
      if (advanceNum < minAdvance - 1) {
        return NextResponse.json({
          success: false,
          error: `Minimum 50% advance payment (₹${minAdvance}) is required to confirm this order.`
        }, { status: 400 });
      }

      // Record successful advance payment
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: advanceNum,
          method: PaymentMethod.RAZORPAY,
          type: advanceNum < orderTotal - 0.01 ? PaymentType.ADVANCE : PaymentType.FULL,
          status: PaymentStatus.SUCCESS,
          provider: 'RAZORPAY',
          verifiedAt: new Date()
        }
      });
    }

    const nextStatus = (status as OrderStatus) || OrderStatus.WAITING_FOR_CHEF;

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus
      },
      include: {
        customer: true,
        branch: true,
        items: true,
        payments: true,
        timeline: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Record timeline entry
    try {
      await prisma.timeline.create({
        data: {
          orderId: order.id,
          status: nextStatus,
          previousState: order.status,
          nextState: nextStatus,
          action: advancePaid
            ? `Advance payment of ₹${advancePaid} received online (min 50% confirmed)`
            : `Order updated by ${actorName || 'Customer'}`,
          role: 'CUSTOMER',
          systemGenerated: false
        }
      });
    } catch (timelineErr) {
      console.warn("Could not log timeline entry:", timelineErr);
    }

    // Format updated order matching order details page expectation
    const formattedOrder = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      orderType: updatedOrder.deliveryType.toLowerCase(),
      status: updatedOrder.status,
      customerName: updatedOrder.customer?.name || "Walk-in",
      customerPhone: updatedOrder.customer?.phone || "",
      branch: updatedOrder.branch?.name || "Main Branch",
      items: updatedOrder.items.map(item => ({
        name: item.productName || item.designName || "Custom Item",
        qty: item.quantity,
        weight: formatItemWeight(item) || "",
        flavour: isPieceOrNonWeightItem(item) ? "" : (item.flavor || "")
      })),
      subtotal: Number(updatedOrder.subtotal),
      discount: Number(updatedOrder.discount),
      tax: 0,
      deliveryCharge: Number(updatedOrder.deliveryCharge),
      grandTotal: Number(updatedOrder.totalAmount),
      advancePaid: updatedOrder.payments.filter(p => p.status === PaymentStatus.SUCCESS).reduce((acc, p) => acc + Number(p.amount), 0),
      pendingBalance: Number(updatedOrder.totalAmount) - updatedOrder.payments.filter(p => p.status === PaymentStatus.SUCCESS).reduce((acc, p) => acc + Number(p.amount), 0),
      priorityLevel: updatedOrder.isPriority ? "high" : "normal",
      isSurprise: false,
      timeTarget: updatedOrder.targetDate.toISOString(),
      createdAt: updatedOrder.createdAt.toISOString(),
      timeline: updatedOrder.timeline.map(t => ({
        event: t.action,
        actor: t.systemGenerated ? "System" : (t.actorId ? "Staff" : "Customer"),
        timestamp: t.createdAt.toISOString()
      }))
    };

    return NextResponse.json({
      success: true,
      message: "Order advance payment recorded and moved to kitchen queue successfully",
      order: formattedOrder
    }, { status: 200 });

  } catch (error: any) {
    console.error("Order status update API error:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal server error"
    }, { status: 500 });
  }
}

