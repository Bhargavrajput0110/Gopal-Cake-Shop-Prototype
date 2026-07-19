import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CustomerSearchService } from '@/lib/customers/CustomerSearchService';
import { OrderSource, DeliveryType, OrderStatus, OrderItemStatus, OrderType, MediaType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const customer = await CustomerSearchService.resolveCustomer({
      phone: body.customerPhone,
      name: body.customerName,
    });

    // Determine correct branch ID by mapping frontend legacy IDs to DB codes
    let branchCode = 'KHD'; // Default to Khanderao
    if (body.branch) {
      const b = body.branch.toLowerCase();
      if (b.includes('uma')) branchCode = 'UMA';
      else if (b.includes('elor') || b.includes('ellor')) branchCode = 'ELL';
      else if (b.includes('varas')) branchCode = 'VAR';
      else if (b.includes('khand')) branchCode = 'KHD';
      else branchCode = body.branch; // fallback
    }

    let resolvedBranchId = body.branch;
    const branchRecord = await prisma.branch.findFirst({
      where: {
        OR: [
          { code: branchCode },
          { id: body.branch },
          { code: body.branch },
          { name: { contains: 'Khanderao' } } // ultimate fallback if KHD missing
        ]
      }
    });
    
    if (branchRecord) {
      resolvedBranchId = branchRecord.id;
    } else {
      console.warn(`WARNING: Could not resolve branch for ${body.branch}. Using fallback.`);
    }

    const itemsData = body.items.map((item: any) => {
      let weightNum = 1.0;
      if (typeof item.weight === 'string') {
        const val = parseFloat(item.weight);
        if (!isNaN(val)) weightNum = item.weight.includes('g') && !item.weight.includes('kg') ? val / 1000 : val;
      }

      let referenceMedia: any[] = [];
      if (item.referenceImages && item.referenceImages.length > 0) {
        referenceMedia.push(...item.referenceImages.map((url: string) => ({ type: MediaType.REFERENCE, url })));
      }
      if (item.printImages && item.printImages.length > 0) {
        referenceMedia.push(...item.printImages.map((url: string) => ({ type: MediaType.PRODUCTION, url })));
      }

      return {
        productName: item.name || 'Custom Design Cake',
        price: (body.subtotal / (item.qty || 1)),
        quantity: item.qty || 1,
        weight: weightNum,
        flavor: item.flavour,
        messageOnCake: item.cakeText,
        notes: body.customerInstructions,
        status: body.status === 'QUOTE_DRAFT' ? OrderItemStatus.PENDING : OrderItemStatus.WAITING_FOR_CHEF,
        media: referenceMedia.length > 0 ? { create: referenceMedia } : undefined
      };
    });

    const orderData = {
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customerId: customer.id,
        branchId: resolvedBranchId,
        source: OrderSource.WEBSITE,
        type: body.status === 'QUOTE_DRAFT' ? OrderType.QUOTE : OrderType.ORDER,
        status: body.status === 'QUOTE_DRAFT' ? OrderStatus.QUOTE_DRAFT : OrderStatus.NEW,
        deliveryType: body.orderType === 'delivery' ? DeliveryType.DELIVERY : DeliveryType.PICKUP,
        targetDate: new Date(body.timeTarget),
        deliveryAddress: body.delivery?.address || null,
        subtotal: body.subtotal || 0,
        deliveryCharge: body.deliveryCharge || 0,
        discount: body.discount || 0,
        totalAmount: body.grandTotal || 0,
        internalNotes: body.isSurprise ? 'SURPRISE ORDER' : null,
        items: {
          create: itemsData
        }
      };

    console.log("Attempting to create order with data:", JSON.stringify(orderData, null, 2));

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: orderData
      });

      await tx.timeline.create({
        data: {
          orderId: createdOrder.id,
          status: createdOrder.status,
          action: 'ORDER_PLACED',
          nextState: createdOrder.status,
          note: 'Order placed via Website',
          eventType: 'STATE_TRANSITION',
          branchId: resolvedBranchId
        }
      });

      await tx.outbox.create({
        data: {
          eventId: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          eventType: 'ORDER_CREATED',
          payload: { orderId: createdOrder.id, branchId: resolvedBranchId }
        }
      });

      return createdOrder;
    });

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      order: {
        id: order.id
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Custom Order API error:", error);
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
