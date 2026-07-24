import { NextResponse } from 'next/server';
import { DashboardKPIService } from '@/services/reporting/DashboardKPIService';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export const GET = withApiHandler(async (ctx) => {
  const { appRole, user, req } = ctx;

  // Only Admin or Manager should access analytics
  if (appRole !== 'ADMIN' && appRole !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // If Manager, they can only see their own branch's analytics
  const targetBranchId = appRole === 'MANAGER' ? user.branchId : (req.nextUrl.searchParams.get('branchId') || null);

  const dateParam = req.nextUrl.searchParams.get('date');
  const targetDate = dateParam ? new Date(dateParam) : new Date();
  
  const kpis = await DashboardKPIService.getKPIs({
    branchId: targetBranchId,
    date: targetDate
  });

  // Additional data for Analytics Page specifically (Live orders & Pending Balances)
  const todayStart = startOfDay(targetDate);
  const todayEnd = endOfDay(targetDate);

  const branchFilter = targetBranchId ? { branchId: targetBranchId } : {};

  // Fetch live active orders for the active operations section
  const liveOrdersData = await prisma.order.findMany({
    where: {
      ...branchFilter,
      status: { notIn: ['DRAFT', 'COMPLETED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] },
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      branch: { select: { name: true } },
      customer: { select: { name: true } },
      items: { select: { productName: true, quantity: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  const liveOrders = liveOrdersData.map(o => {
    const diffMinutes = Math.floor((new Date().getTime() - o.createdAt.getTime()) / 60000);
    return {
      id: o.orderNumber,
      customer: o.customer?.name || 'Unknown',
      branch: o.branch?.name || 'Unknown',
      type: 'Retail', // Assuming retail for now, could check wholesale tag if exists
      status: o.status,
      amount: Number(o.totalAmount),
      time: diffMinutes < 60 ? `${diffMinutes} mins ago` : `${Math.floor(diffMinutes / 60)} hr ago`
    };
  });

  // Fetch pending balances (orders where totalAmount > payments)
  const pendingOrdersData = await prisma.order.findMany({
    where: {
      ...branchFilter,
      status: { in: ['DELIVERED', 'COMPLETED'] }, // usually we only care about pending balances for completed orders
    },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      updatedAt: true,
      customer: { select: { name: true } },
      branch: { select: { name: true } },
      payments: {
        where: { status: 'SUCCESS' },
        select: { amount: true }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 20
  });

  const pendingBalances = pendingOrdersData
    .map(o => {
      const paid = o.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const total = Number(o.totalAmount);
      return {
        id: o.orderNumber,
        customer: o.customer?.name || 'Unknown',
        branch: o.branch?.name || 'Unknown',
        deliveredOn: o.updatedAt.toISOString().split('T')[0],
        total,
        paid,
        pending: total - paid
      };
    })
    .filter(o => o.pending > 0);

  return NextResponse.json({ 
    success: true, 
    data: {
      kpis,
      liveOrders,
      pendingBalances
    } 
  });
});
