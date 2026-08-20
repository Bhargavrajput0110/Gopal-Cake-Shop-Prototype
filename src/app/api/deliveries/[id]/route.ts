import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export const GET = withApiHandler(async (ctx) => {
  const { req, params, appRole, user, branchId, deliveryScopes } = ctx;
  const { id: orderId } = params;

  if (!appRole || !['ADMIN', 'MANAGER', 'DELIVERY'].includes(appRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = prisma;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      branch: true,
      items: {
        include: { product: true }
      }
    }
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.deliveryType !== 'DELIVERY') {
    return NextResponse.json({ error: 'Not a delivery order' }, { status: 400 });
  }

  // Enforce access control for DELIVERY role
  if (appRole === 'DELIVERY') {
    // Delivery staff can access if explicitly assigned
    const isExplicitlyAssigned = order.driverId === user.id;

    let isSameBranch = branchId === order.branchId;
    if (deliveryScopes && deliveryScopes.includes('ALL')) {
      isSameBranch = true;
    } else if (deliveryScopes && deliveryScopes.length > 0) {
      isSameBranch = deliveryScopes.includes(order.branchId);
    }

    if (!isExplicitlyAssigned && !isSameBranch && branchId !== 'ALL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Safe Delivery Response Payload
  // Mask sensitive info
  
  let mapsUrl = null;
  if (order.deliveryLatitude && order.deliveryLongitude) {
    mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLatitude},${order.deliveryLongitude}`;
  }

  const safePayload = {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    deliveryAddress: order.deliveryAddress,
    customerNotes: order.customerNotes,
    deliveryLatitude: order.deliveryLatitude,
    deliveryLongitude: order.deliveryLongitude,
    googleMapsUrl: mapsUrl,
    deliveryDistanceKm: order.deliveryDistanceKm,
    fulfillmentBranch: order.branch.name,
    status: order.status,
    items: order.items.map(item => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      messageOnCake: item.messageOnCake
    }))
  };

  return NextResponse.json({ success: true, data: safePayload });
});
