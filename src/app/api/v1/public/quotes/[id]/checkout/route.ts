import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OutboxService } from '@/lib/events/OutboxService';
import { OrderStatus, OrderItemStatus } from '@prisma/client';

export async function POST(
  req: Request,
  { params }: { params: any }
) {
  try {
    const { id: orderNumber } = await params;
    const body = await req.json();
    const { deliveryAddress, paymentMethod = 'UPI' } = body;

    // 1. Fetch the quote
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, branch: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (order.status !== OrderStatus.QUOTE_DRAFT && order.status !== OrderStatus.QUOTE_SENT) {
      return NextResponse.json({ error: 'Quote has already been processed or expired' }, { status: 400 });
    }

    // 2. Perform the Checkout Transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update Order
      const newOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.NEW, // Convert to live order
          deliveryAddress: deliveryAddress || order.deliveryAddress,
          payments: {
            create: {
              amount: order.totalAmount,
              method: paymentMethod,
              type: 'FULL',
              status: 'SUCCESS'
            }
          },
          ledgerEntries: {
            create: {
              amount: order.totalAmount,
              method: paymentMethod,
              type: 'PAYMENT',
              status: 'SUCCESS',
              branchId: order.branchId,
              notes: 'Full payment completed via Quote Link'
            }
          }
        },
        include: { items: true, customer: true, branch: true }
      });

      // Update Order Items to Waiting for Chef
      await tx.orderItem.updateMany({
        where: { orderId: order.id },
        data: { status: OrderItemStatus.WAITING_FOR_CHEF }
      });

      // Update Child Items (Vendors) to Waiting for Chef
      const childItems = await tx.orderItem.findMany({
        where: { parentItemId: { in: order.items.map(i => i.id) } }
      });
      if (childItems.length > 0) {
        await tx.orderItem.updateMany({
          where: { id: { in: childItems.map(i => i.id) } },
          data: { status: OrderItemStatus.WAITING_FOR_CHEF }
        });
      }

      // Record Timeline Event
      await tx.timeline.create({
        data: {
          orderId: order.id,
          action: 'QUOTE_CONVERTED',
          status: OrderStatus.NEW,
          nextState: OrderStatus.NEW,
          note: `Customer completed checkout via quote link using ${paymentMethod}`,
        }
      });

      // Record Forensic AuditLog
      await tx.auditLog.create({
        data: {
          action: 'ORDER_CONVERTED_FROM_QUOTE',
          reason: `Customer payment success`,
          actorId: null,
          tableName: 'Order',
          recordId: order.id,
          newValue: { status: OrderStatus.NEW },
          oldValue: { status: order.status }
        }
      });

      // Dispatch Integration Event (Outbox)
      await OutboxService.publish(
        'OrderCreatedEvent',
        order.id,
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          source: order.source,
          totalAmount: order.totalAmount
        },
        tx
      );

      return newOrder;
    });

    // 3. Emit Realtime Socket Events
    const io = (global as any).io;
    if (io) {
      io.to(`branch_${updatedOrder.branchId}`).emit('order_created');
      io.to('admin_global').emit('order_created');

      if (updatedOrder.isFarDistance) {
        const alertPayload = { 
          orderId: updatedOrder.id, 
          orderNumber: updatedOrder.orderNumber, 
          distanceKm: updatedOrder.deliveryDistanceKm, 
          branchId: updatedOrder.branchId 
        };
        io.to(`branch_${updatedOrder.branchId}_kitchen`).emit('far_distance_alert', alertPayload);
        io.to(`branch_${updatedOrder.branchId}_delivery`).emit('far_distance_alert', alertPayload);
        io.to('admin_global').emit('far_distance_alert', alertPayload);
      }
    }

    return NextResponse.json({ success: true, orderNumber: updatedOrder.orderNumber });
  } catch (err: any) {
    console.error('Quote Checkout Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
