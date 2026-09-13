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

  // Unified branch filter resolution across all aliases & CUIDs
  let branchCondition: any = null;
  if (rawBranchParam && rawBranchParam.toLowerCase() !== 'all') {
    const BRANCH_CUID_MAP: Record<string, string[]> = {
      'elora': ['elora', 'cmswuiiun00031su3vfrn9eq5', 'Ellora Park', 'Ellora Park Branch', 'Elora Park Branch'],
      'khanderao': ['khanderao', 'cmswuiita00011su3977ajl1z', 'Khanderao Market', 'Khanderao Branch', 'Market Branch', 'KHD'],
      'varasiya': ['varasiya', 'warasiya', 'cmswuiiu000021su3kv1mr41f', 'Factory Warasiya', 'Varasiya Factory Outlet', 'WARASIYA'],
      'uma': ['uma', 'Uma Branch', 'Uma Char Rasta', 'UMA'],
    };

    const canonical = toBranchId(rawBranchParam);
    const targetBranchObj = BRANCHES.find(b => b.id === canonical || b.shortName.toLowerCase() === rawBranchParam.toLowerCase());
    const idsToMatch = Array.from(new Set([
      canonical,
      rawBranchParam,
      ...(BRANCH_CUID_MAP[canonical] || []),
      ...(targetBranchObj ? [targetBranchObj.id, targetBranchObj.displayName, ...targetBranchObj.aliases] : [])
    ]));

    branchCondition = {
      OR: [
        { branchId: { in: idsToMatch } },
        { branchId: { contains: rawBranchParam, mode: 'insensitive' } },
        { branch: { name: { contains: rawBranchParam, mode: 'insensitive' } } },
        { branch: { code: { contains: rawBranchParam, mode: 'insensitive' } } }
      ]
    };
  }

  // Date filter condition (optional)
  let dateCondition: any = null;
  let targetDate: Date | null = null;
  if (dateParam && dateParam.trim() !== '') {
    targetDate = new Date(dateParam);
    const todayStart = startOfDay(targetDate);
    const todayEnd = endOfDay(targetDate);
    dateCondition = {
      OR: [
        { createdAt: { gte: todayStart, lte: todayEnd } },
        { targetDate: { gte: todayStart, lte: todayEnd } }
      ]
    };
  }

  const baseWhereConditions: any[] = [
    { status: { notIn: ['CANCELLED', 'DRAFT'] as any } }
  ];

  if (branchCondition) {
    baseWhereConditions.push(branchCondition);
  }

  if (dateCondition) {
    baseWhereConditions.push(dateCondition);
  }

  const baseOrderWhere = {
    AND: baseWhereConditions
  };

  try {
    // 1. Fetch ALL matching orders under the exact same scope/filter
    const ordersList = await prisma.order.findMany({
      where: baseOrderWhere,
      include: {
        customer: { select: { name: true, phone: true } },
        branch: { select: { name: true } },
        ledgerEntries: true,
        payments: true
      }
    });

    const totalOrders = ordersList.length;
    const totalSales = ordersList.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

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

    ordersList.forEach(o => {
      if (ordersByStatus[o.status] !== undefined) {
        ordersByStatus[o.status]++;
      } else {
        ordersByStatus[o.status] = 1;
      }
    });

    const completedOrders = (ordersByStatus.COMPLETED || 0) + (ordersByStatus.DELIVERED || 0);

    const pendingOrders = (ordersByStatus.NEW || 0) + 
                          (ordersByStatus.WAITING_FOR_CHEF || 0) + 
                          (ordersByStatus.CHEF_ACCEPTED || 0) + 
                          (ordersByStatus.MAKING || 0) + 
                          (ordersByStatus.DECORATING || 0) + 
                          (ordersByStatus.READY_FOR_PICKUP || 0) + 
                          (ordersByStatus.PENDING_ASSIGNMENT || 0) + 
                          (ordersByStatus.ASSIGNED_TO_DRIVER || 0) + 
                          (ordersByStatus.PICKED_UP || 0) + 
                          (ordersByStatus.ON_THE_WAY || 0) + 
                          (ordersByStatus.OUT_FOR_DELIVERY || 0);

    const readyOrders = (ordersByStatus.READY_FOR_PICKUP || 0);
    const pendingDelivery = (ordersByStatus.PENDING_ASSIGNMENT || 0) + (ordersByStatus.ASSIGNED_TO_DRIVER || 0);
    const activeDeliveries = (ordersByStatus.PICKED_UP || 0) + (ordersByStatus.ON_THE_WAY || 0) + (ordersByStatus.OUT_FOR_DELIVERY || 0);
    const averageQueueLength = (ordersByStatus.WAITING_FOR_CHEF || 0) + 
                               (ordersByStatus.CHEF_ACCEPTED || 0) + 
                               (ordersByStatus.MAKING || 0) + 
                               (ordersByStatus.DECORATING || 0);

    // 2. Compute Balance Due & Outstanding Orders List under exact same scope
    let balanceDue = 0;
    const pendingBalancesList: any[] = [];

    for (const o of ordersList) {
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

    // 3. 7-Day Revenue Trend
    const endDate = targetDate ? endOfDay(targetDate) : endOfDay(new Date());
    const revenueTrend: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(endDate, i);
      const dStart = startOfDay(d);
      const dEnd = endOfDay(d);
      
      const dayWhereConditions: any[] = [
        { status: { notIn: ['CANCELLED', 'DRAFT'] as any } },
        {
          OR: [
            { createdAt: { gte: dStart, lte: dEnd } },
            { targetDate: { gte: dStart, lte: dEnd } }
          ]
        }
      ];
      if (branchCondition) dayWhereConditions.push(branchCondition);

      const dayAgg = await prisma.order.aggregate({
        where: { AND: dayWhereConditions },
        _sum: { totalAmount: true }
      });
      
      revenueTrend.push({
        date: format(d, 'yyyy-MM-dd'),
        revenue: Number(dayAgg._sum.totalAmount || 0)
      });
    }

    // 4. Sales by Product & Category
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

    const responsePayload = {
      todaysSales: totalSales,
      totalSales,
      ordersToday: totalOrders,
      totalOrders,
      completedOrders,
      pendingOrders,
      readyOrders,
      pendingDelivery,
      activeDeliveries,
      ordersByStatus,
      averageQueueLength,
      lateOrdersCount: 0,
      balanceDue,
      pendingBalances: pendingBalancesList,
      revenueTrend,
      salesByProduct,
      salesByCategory,

      summary: {
        todaysSales: totalSales,
        ordersToday: totalOrders,
        pendingOrders,
        averageOrderValue,
        totalBalanceDue: balanceDue
      },
      kpis: {
        todaysSales: totalSales,
        ordersToday: totalOrders,
        pendingOrders,
        averageOrderValue,
        topProducts: salesByProduct,
      }
    };

    return NextResponse.json({
      success: true,
      data: responsePayload,
      meta: {
        dateFiltered: dateParam || 'ALL_TIME'
      }
    });

  } catch (err: any) {
    console.error('[Admin Analytics] Error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
});
