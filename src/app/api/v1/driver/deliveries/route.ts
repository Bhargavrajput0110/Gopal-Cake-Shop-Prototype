import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'
import { withApiHandler } from '@/lib/withApiHandler'
import { FinancialService } from '@/services/FinancialService'
import { toBranchShortName } from '@/lib/branches'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withApiHandler(async (ctx) => {
  const { appRole, user } = ctx
  const hasDeliveryScope = !!(user as any).deliveryScope;
  if (appRole !== 'DELIVERY' && appRole !== 'ADMIN' && appRole !== 'MANAGER' && !hasDeliveryScope) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const driverId = appRole === 'DELIVERY' ? user.id : ctx.req.nextUrl.searchParams.get('driverId')

  if (appRole === 'DELIVERY' && !driverId) {
    return NextResponse.json({ error: 'driverId required' }, { status: 400 })
  }

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  let branchFilter: any = {};
  if (appRole === 'DELIVERY' || appRole === 'SALESPERSON') {
    const scope = (user as any).deliveryScope || null;
    if (scope === 'GLOBAL' || scope === 'ALL_BRANCHES') {
      branchFilter = {};
    } else if (scope === 'UMA_WARASHIYA_PLUS_ASSIGNED') {
      branchFilter = { branchId: { in: ['uma', 'cmswuiiu000021su3kv1mr41f'] } };
    } else if (scope === 'WARASHIYA_PLUS_ASSIGNED' || scope === 'WARASHIYA') {
      branchFilter = { branchId: 'cmswuiiu000021su3kv1mr41f' };
    } else if (user.branchId) {
      branchFilter = { branchId: user.branchId };
    } else {
      branchFilter = { branchId: 'no-access' }; // fallback
    }
  }

  const [orders, activeTransfers] = await Promise.all([
    db.order.findMany({
      where: {
        deliveryType: 'DELIVERY',
        OR: [
          { status: { in: ['NEW', 'WAITING_FOR_CHEF', 'CHEF_ACCEPTED', 'MAKING', 'DECORATING', 'READY_FOR_PICKUP', 'PENDING_ASSIGNMENT'] }, driverId: null, ...branchFilter },
          { driverId: driverId ? driverId : { not: null } },
          { items: { some: { status: { in: ['READY_FOR_PICKUP', 'DELIVERED'] }, assignedVendorId: { not: null } } }, driverId: null, ...branchFilter }
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
        ledgerEntries: true
      },
      orderBy: {
        targetDate: 'asc'
      }
    }),
    db.branchTransfer.findMany({
      where: {
        status: { in: ['ACCEPTED', 'IN_TRANSIT'] }
      },
      include: {
        order: {
          include: {
            customer: true,
            items: true
          }
        }
      }
    })
  ])

  const payload: any[] = [];

  // 1. Process Inter-Branch Transfers for Drivers (Uma delivery person delivering Store Pickup cakes 1.5 hours earlier to target branch)
  activeTransfers.forEach((transfer) => {
    const order = transfer.order as any;
    if (!order) return;

    // Only show in driver pool when cake is actually ready — not while chef is still making it
    if (order.status !== 'READY_FOR_PICKUP') return;

    if (driverId && order.driverId && order.driverId !== driverId) return;

    // Calculate inter-branch delivery target time: 1.5 hours BEFORE customer pickup time
    const customerTarget = new Date(order.targetDate);
    const transferTargetTime = new Date(customerTarget.getTime() - 90 * 60 * 1000); // 1.5 hours earlier

    const fromBranchName = toBranchShortName(transfer.fromBranchId);
    const toBranchName = toBranchShortName(transfer.toBranchId);

    if (order.deliveryType === 'PICKUP') {
      payload.push({
        id: `transfer-${transfer.id}`,
        taskType: 'BRANCH_TRANSFER',
        orderNumber: order.orderNumber,
        status: transfer.status === 'IN_TRANSIT' ? 'OUT_FOR_DELIVERY' : 'READY_FOR_PICKUP',
        deliveryType: 'BRANCH_TRANSFER',
        targetDate: transferTargetTime.toISOString(),
        customerTargetDate: customerTarget.toISOString(),
        createdAt: transfer.createdAt,
        notes: `STORE PICKUP INTER-BRANCH TRANSFER: Deliver to ${fromBranchName} branch 1-2 hours before customer pickup time. ₹0 extra charged to customer.`,
        assignedDriverId: order.driverId,
        timeTarget: transferTargetTime.toISOString(),
        totalAmount: 0,
        paidAmount: 0,
        extraFeeToCustomer: 0,
        formattedAddress: `Deliver to Store Branch: ${fromBranchName} Branch Store`,
        pickupLocation: `${toBranchName} Branch (Central Factory)`,
        dropoffLocation: `${fromBranchName} Branch Store`,
        customerName: `${fromBranchName} Store Counter`,
        customerPhone: order.customer?.phone || "",
        items: order.items.map((item: any) => ({
          id: item.id,
          productName: item.productName || item.name || 'Cake',
          quantity: item.quantity,
          flavor: item.flavor || null,
          boxCount: item.boxCount || 1,
          status: item.status
        }))
      });
    }
  });

  orders.forEach((rawOrder) => {
    const order = rawOrder as any;
    // 2. Process Vendor Pickups (from child items)
    order.items.forEach((parentItem: any) => {
      parentItem.childItems.forEach((childItem: any) => {
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

    // 3. Process Customer Delivery
    if (['NEW', 'WAITING_FOR_CHEF', 'CHEF_ACCEPTED', 'MAKING', 'DECORATING', 'PENDING_ASSIGNMENT', 'READY_FOR_PICKUP', 'ASSIGNED_TO_DRIVER', 'PICKED_UP', 'ON_THE_WAY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY'].includes(order.status)) {
      if (driverId && order.driverId && order.driverId !== driverId) return;

      payload.push(async () => {
        const summary = await FinancialService.calculateFinancialSummary(order);
        return {
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
          totalAmount: summary.totalAmount,
          paidAmount: summary.paidAmount,
          pendingBalance: summary.outstandingAmount,
          financialStatus: summary.paymentStatus,
          formattedAddress: order.deliveryAddress || null,
          distanceKm: order.deliveryDistanceKm || null,
          extraFeeToCustomer: 0, // ₹0 extra charged to customer for transfers
          googleMapsUrl: (order.deliveryLatitude && order.deliveryLongitude) ? `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLatitude},${order.deliveryLongitude}` : null,
          customerName: order.customer.name,
          customerPhone: order.customer.phone,
          items: order.items.filter((i: any) => !i.parentItemId).map((item: any) => ({
            id: item.id,
            productName: item.productName,
            quantity: item.quantity,
            flavor: item.flavor || null,
            boxCount: item.boxCount,
            status: item.status,
            childItems: item.childItems.map((c: any) => ({
              id: c.id,
              productName: c.productName,
              status: c.status,
              assignedVendorId: c.assignedVendorId
            }))
          }))
        };
      });
    }
  });

  const resolvedPayload = await Promise.all(payload.map(p => typeof p === 'function' ? p() : Promise.resolve(p)));

  // Sort payload by targetDate
  resolvedPayload.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

  console.log(`[API /driver/deliveries] driverId=${driverId} branchFilter=${JSON.stringify(branchFilter)} orders.length=${orders.length} resolvedPayload.length=${resolvedPayload.length}`);
  if (orders.length > 0) {
    console.log(`[API /driver/deliveries] First order status=${orders[0].status} assignedDriverId=${orders[0].driverId}`);
  }

  return NextResponse.json({ success: true, data: resolvedPayload })
})
