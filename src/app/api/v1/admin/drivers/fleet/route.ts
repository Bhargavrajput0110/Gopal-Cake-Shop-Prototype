import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import { OrderStatus } from '@prisma/client';
import { BRANCHES } from '@/lib/branches';

export const GET = withApiHandler(async (ctx) => {
  const { appRole, user, req } = ctx;

  if (appRole !== 'ADMIN' && appRole !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const requestedBranchName = req.nextUrl.searchParams.get('branchName') || 'All';
  
  // Resolve branch ID from name since frontend sends name filter
  let targetBranchId: string | undefined = undefined;
  if (appRole === 'MANAGER') {
    targetBranchId = user.branchId || undefined;
  } else if (requestedBranchName !== 'All') {
    targetBranchId = BRANCHES.find(b => b.displayName === requestedBranchName)?.id;
  }

  const branchFilter = targetBranchId ? { branchId: targetBranchId } : {};

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  // 1. Fetch Drivers
  const driverUsers = await prisma.user.findMany({
    where: {
      role: 'DELIVERY',
      ...branchFilter
    },
    include: {
      branch: true,
      deliveredOrders: {
        where: {
          updatedAt: { gte: todayStart, lte: todayEnd }
        },
        select: { id: true, status: true, targetDate: true, updatedAt: true }
      }
    }
  });

  const drivers = driverUsers.map(d => {
    // Active orders are those currently assigned to this driver and not yet delivered/cancelled
    const activeCount = d.deliveredOrders.filter(o => 
      ['ON_THE_WAY', 'PICKED_UP', 'ASSIGNED_TO_DRIVER'].includes(o.status)
    ).length;
    
    // Delivered today
    const deliveredToday = d.deliveredOrders.filter(o => o.status === 'DELIVERED').length;
    
    // Late count (delivered past targetDate)
    const lateCount = d.deliveredOrders.filter(o => o.status === 'DELIVERED' && o.updatedAt > o.targetDate).length;
    
    // Status logic
    let status = 'OFFLINE';
    if (d.status === 'ACTIVE') {
      status = activeCount > 0 ? 'ON_DELIVERY' : 'AVAILABLE';
    }

    return {
      id: d.id,
      name: d.name,
      phone: d.phone || 'N/A',
      branch: d.branch?.name || 'Unknown',
      activeCount,
      deliveredToday,
      lateCount,
      isOverloaded: activeCount >= 4,
      status
    };
  });

  // 2. Fetch Dispatch Queue
  const dispatchOrdersData = await prisma.order.findMany({
    where: {
      ...branchFilter,
      status: { in: [OrderStatus.READY, OrderStatus.PENDING_ASSIGNMENT, OrderStatus.READY_FOR_PICKUP] },
      deliveryType: 'DELIVERY'
    },
    include: {
      branch: true,
      customer: true,
      items: true
    },
    orderBy: { targetDate: 'asc' }
  });

  const dispatchOrders = dispatchOrdersData.map(o => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customer.name,
    address: o.deliveryAddress || 'N/A',
    branch: o.branch.name,
    distance: o.deliveryDistanceKm || 0,
    status: o.status,
    targetDate: o.targetDate,
    items: o.items.map(i => ({ name: i.productName, quantity: i.quantity, weight: Number(i.weight) })),
    grandTotal: Number(o.totalAmount)
  }));

  return NextResponse.json({ success: true, drivers, dispatchOrders });
});
