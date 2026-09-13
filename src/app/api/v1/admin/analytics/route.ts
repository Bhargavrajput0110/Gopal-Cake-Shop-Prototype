import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { toBranchId, BRANCHES } from '@/lib/branches';
import { FinancialService } from '@/services/FinancialService';

export const GET = withApiHandler(async (ctx) => {
  const { appRole, req } = ctx;

  // Require ADMIN or MANAGER authorization
  if (appRole !== 'ADMIN' && appRole !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rawBranchParam = req.nextUrl.searchParams.get('branchId');
  const dateParam = req.nextUrl.searchParams.get('date');
  const targetDate = dateParam ? new Date(dateParam) : new Date();
  
  const todayStart = startOfDay(targetDate);
  const todayEnd = endOfDay(targetDate);

  // Helper to build branch filter safely without key collision
  let branchCondition: any = null;
  if (rawBranchParam && rawBranchParam.toLowerCase() !== 'all') {
    const canonical = toBranchId(rawBranchParam);
    const targetBranchObj = BRANCHES.find(b => b.id === canonical || b.shortName.toLowerCase() === rawBranchParam.toLowerCase());
    const allAliases = targetBranchObj ? [targetBranchObj.id, targetBranchObj.displayName, ...targetBranchObj.aliases] : [rawBranchParam, canonical];
    
    branchCondition = {
      OR: [
        { branchId: { in: allAliases } },
        { branchId: { contains: rawBranchParam, mode: 'insensitive' } },
        { branch: { name: { contains: rawBranchParam, mode: 'insensitive' } } }
      ]
    };
  }

  // Base filter for date query
  const dateCondition = {
    OR: [
      { createdAt: { gte: todayStart, lte: todayEnd } },
      { targetDate: { gte: todayStart, lte: todayEnd } }
    ]
  };

  const baseWhereConditions: any[] = [
    { status: { notIn: ['CANCELLED', 'DRAFT'] as any } }
  ];

  if (branchCondition) {
    baseWhereConditions.push(branchCondition);
  }

  const dateWhereConditions = [...baseWhereConditions, dateCondition];

  const baseOrderWhere = {
    AND: dateWhereConditions
  };

  const allBranchOrderWhere = {
    AND: baseWhereConditions
  };

  try {
    // 1. Fetch orders for selected date to compute sales & orders Today
    const ordersTodayList = await prisma.order.findMany({
      where: baseOrderWhere,
      include: {
        customer: { select: { name: true, phone: true } },
        branch: { select: { name: true } },
        ledgerEntries: true,
        payments: true
      }
    });

    const ordersToday = ordersTodayList.length;
    const todaysSales = ordersTodayList.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const averageOrderValue = ordersToday > 0 ? todaysSales / ordersToday : 0;

    // 2. Fetch ALL branch orders for status breakdown & pending balance calculations
    const allBranchOrders = await prisma.order.findMany({
      where: allBranchOrderWhere,
      include: {
        customer: { select: { name: true, phone: true } },
        branch: { select: { name: true } },
        ledgerEntries: true,
        payments: true
      }
    });

    const ordersByStatus: Record<string, number> = {
      NEW: 0,
      WAITING_FOR_CHEF: 0,
      CHEF_ACCEPTED: 0,
      MAKING: 0,
      DECORATING: 0,
      READY_FOR_PICKUP: 0,
      PENDING_ASSIGNMENT: 0,
      ASSIGNED_TO_DRIVER: 0,
      PICKED_UP: 0,
      ON_THE_WAY: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };

    allBranchOrders.forEach(o => {
      if (ordersByStatus[o.status] !== undefined) {
        ordersByStatus[o.status]++;
      } else {
        ordersByStatus[o.status] = 1;
      }
    });

    const pendingOrders = (ordersByStatus.NEW || 0) + 
                          (ordersByStatus.WAITING_FOR_CHEF || 0) + 
                          (ordersByStatus.CHEF_ACCEPTED || 0) + 
                          (ordersByStatus.MAKING || 0) + 
                          (ordersByStatus.DECORATING || 0) + 
                          (ordersByStatus.READY_FOR_PICKUP || 0) + 
                          (ordersByStatus.ON_THE_WAY || 0);

    const averageQueueLength = (ordersByStatus.WAITING_FOR_CHEF || 0) + 
                               (ordersByStatus.CHEF_ACCEPTED || 0) + 
                               (ordersByStatus.MAKING || 0) + 
                               (ordersByStatus.DECORATING || 0);

    // 3. Compute Total Balance Due & Outstanding Orders List
    let balanceDue = 0;
    const pendingBalancesList: any[] = [];

    for (const o of allBranchOrders) {
      if (o.status !== 'COMPLETED' && o.status !== 'CANCELLED') {
        const finSummary = await FinancialService.calculateFinancialSummary(o);
        if (finSummary.outstandingAmount > 0) {
          balanceDue += finSummary.outstandingAmount;
          pendingBalancesList.push({
            orderNumber: o.orderNumber || o.id.slice(0, 8),
            customerName: o.customer?.name || 'Customer',
            customerPhone: o.customer?.phone || 'N/A',
            branchName: o.branch?.name || o.branchId || 'Store',
            totalAmount: finSummary.totalAmount,
            paidAmount: finSummary.paidAmount,
            balanceDue: finSummary.outstandingAmount
          });
        }
      }
    }

    // 4. Compute 7-Day Revenue Trend
    const revenueTrend: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(todayEnd, i);
      const dStart = startOfDay(d);
      const dEnd = endOfDay(d);
      
      const dayWhereConditions = [...baseWhereConditions, {
        OR: [
          { createdAt: { gte: dStart, lte: dEnd } },
          { targetDate: { gte: dStart, lte: dEnd } }
        ]
      }];

      const dayAgg = await prisma.order.aggregate({
        where: { AND: dayWhereConditions },
        _sum: { totalAmount: true }
      });
      
      revenueTrend.push({
        date: format(d, 'yyyy-MM-dd'),
        revenue: Number(dayAgg._sum.totalAmount || 0)
      });
    }

    // 5. Sales by Product & Category
    const orderItems = await prisma.orderItem.findMany({
      where: { order: baseOrderWhere },
      select: {
        productName: true,
        quantity: true,
        price: true,
        product: { select: { category: { select: { name: true } } } }
      }
    });

    const productMap: Record<string, { count: number; revenue: number }> = {};
    const categoryMap: Record<string, { count: number; revenue: number }> = {};

    for (const item of orderItems) {
      const rev = Number(item.price) * item.quantity;
      if (!productMap[item.productName]) productMap[item.productName] = { count: 0, revenue: 0 };
      productMap[item.productName].count += item.quantity;
      productMap[item.productName].revenue += rev;

      const catName = item.product?.category?.name || 'General';
      if (!categoryMap[catName]) categoryMap[catName] = { count: 0, revenue: 0 };
      categoryMap[catName].count += item.quantity;
      categoryMap[catName].revenue += rev;
    }

    const salesByProduct = Object.entries(productMap)
      .map(([productName, data]) => ({ productName, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const salesByCategory = Object.entries(categoryMap)
      .map(([categoryName, data]) => ({ categoryName, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // 6. Return response with root properties AND nested summary
    const responsePayload = {
      todaysSales,
      ordersToday,
      pendingOrders,
      ordersByStatus,
      averageQueueLength,
      lateOrdersCount: 0,
      balanceDue,
      pendingBalances: pendingBalancesList,
      revenueTrend,
      salesByProduct,
      salesByCategory,

      summary: {
        todaysSales,
        ordersToday,
        pendingOrders,
        averageOrderValue,
        totalBalanceDue: balanceDue
      },
      kpis: {
        todaysSales,
        ordersToday,
        pendingOrders,
        averageOrderValue,
        topProducts: salesByProduct,
      }
    };

    return NextResponse.json({
      success: true,
      data: responsePayload,
      meta: {
        dateFiltered: todayStart.toISOString()
      }
    });

  } catch (err: any) {
    console.error('[Admin Analytics] Error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
});
