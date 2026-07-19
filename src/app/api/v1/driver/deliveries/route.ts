import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'
import { withApiHandler } from '@/lib/withApiHandler'

export const GET = withApiHandler(async (ctx) => {
  const { appRole, user } = ctx
  if (appRole !== 'DELIVERY' && appRole !== 'ADMIN' && appRole !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const driverId = appRole === 'DELIVERY' ? user.id : ctx.req.nextUrl.searchParams.get('driverId')

  if (appRole === 'DELIVERY' && !driverId) {
    return NextResponse.json({ error: 'driverId required' }, { status: 400 })
  }

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const orders = await db.order.findMany({
    where: {
      deliveryType: 'DELIVERY',
      OR: [
        { status: { in: ['READY_FOR_PICKUP', 'PENDING_ASSIGNMENT'] }, driverId: null },
        { driverId: driverId ? driverId : { not: null } },
        { items: { some: { status: { in: ['READY_FOR_PICKUP', 'DELIVERED'] }, assignedVendorId: { not: null } } }, driverId: null }
      ]
    },
    include: {
      customer: true,
      branch: { select: { name: true, address: true } },
      items: {
        include: { 
          childItems: {
            include: { assignedVendor: { select: { name: true } } }
          },
          assignedVendor: { select: { name: true } }
        }
      },
      payments: true
    },
    orderBy: {
      targetDate: 'asc'
    }
  })

  const payload: any[] = [];

  orders.forEach(order => {
    // 1. Process Vendor Pickups (from child items)
    order.items.forEach(parentItem => {
      parentItem.childItems.forEach(childItem => {
        if (childItem.assignedVendorId && (childItem.status === 'READY_FOR_PICKUP' || childItem.status === 'DELIVERED')) {
          // If a specific driver is requested but this order is not assigned to them and is not in pool, skip
          if (driverId && order.driverId && order.driverId !== driverId) return;

          payload.push({
            id: `vendor-${childItem.id}`,
            taskType: 'VENDOR_PICKUP',
            orderNumber: order.orderNumber,
            status: childItem.status === 'DELIVERED' ? 'DELIVERED' : 'READY_FOR_PICKUP',
            deliveryType: 'VENDOR_TRANSFER',
            targetDate: order.targetDate,
            createdAt: childItem.createdAt,
            notes: childItem.notes || null,
            assignedDriverId: order.driverId,
            timeTarget: order.targetDate,
            pickedUpAt: childItem.status === 'DELIVERED' ? new Date() : null,
            deliveredAt: childItem.status === 'DELIVERED' ? new Date() : null,
            totalAmount: 0,
            paidAmount: 0,
            formattedAddress: order.branch.address, // We deliver to the branch
            pickupLocation: childItem.assignedVendor?.name || "Vendor",
            dropoffLocation: order.branch.name,
            vendorName: childItem.assignedVendor?.name || "Vendor",
            customerName: order.branch.name, // The branch is the "customer" for this pickup
            customerPhone: "",
            items: [{
              id: childItem.id,
              productName: childItem.productName,
              quantity: childItem.quantity,
              notes: childItem.notes,
              status: childItem.status,
              boxCount: 1
            }]
          });
        }
      });
    });

    // 2. Process Customer Delivery
    if (order.status === 'READY_FOR_PICKUP' || order.status === 'ASSIGNED_TO_DRIVER' || order.status === 'PICKED_UP' || order.status === 'ON_THE_WAY' || order.status === 'DELIVERED' || order.status === 'FAILED_DELIVERY') {
      if (driverId && order.driverId && order.driverId !== driverId) return;

      const totalAmount = Number(order.totalAmount)
      const paidAmount = order.payments
        .filter(p => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + Number(p.amount), 0)

      payload.push({
        id: `delivery-${order.id}`,
        taskType: 'CUSTOMER_DELIVERY',
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryType: order.deliveryType,
        targetDate: order.targetDate,
        createdAt: order.createdAt,
        notes: order.internalNotes || null,
        assignedDriverId: order.driverId,
        timeTarget: order.targetDate,
        pickedUpAt: null,
        deliveredAt: null,
        totalAmount,
        paidAmount,
        formattedAddress: order.deliveryAddress || null,
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        items: order.items.filter(i => !i.parentItemId).map(item => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          flavor: item.flavor || null,
          boxCount: item.boxCount,
          status: item.status,
          childItems: item.childItems.map(c => ({
            id: c.id,
            productName: c.productName,
            status: c.status,
            assignedVendorId: c.assignedVendorId
          }))
        }))
      });
    }
  });

  // Sort payload by targetDate
  payload.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

  return NextResponse.json({ success: true, data: payload })
})
