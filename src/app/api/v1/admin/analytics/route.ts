import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export const GET = withApiHandler(async (ctx) => {
  const { appRole, req } = ctx;

  // 1. Require ADMIN authorization, reject unauthorized users with 403.
  if (appRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const branchId = req.nextUrl.searchParams.get('branchId') || undefined;
  const dateParam = req.nextUrl.searchParams.get('date');
  const targetDate = dateParam ? new Date(dateParam) : new Date();
  
  const todayStart = startOfDay(targetDate);
  const todayEnd = endOfDay(targetDate);

  const branchFilter = branchId ? { branchId } : {};

  // Base filter: exclude CANCELLED and DRAFT orders.
  const baseOrderWhere = {
    ...branchFilter,
    createdAt: { gte: todayStart, lte: todayEnd },
    status: { notIn: ['CANCELLED', 'DRAFT'] as any }
  };

  try {
    // 2. Database-side Prisma aggregation for totals
    const orderAgg = await prisma.order.aggregate({
      where: baseOrderWhere,
      _count: { id: true },
      _sum: { totalAmount: true }
    });

    const ordersToday = orderAgg._count.id;
    const todaysSales = Number(orderAgg._sum.totalAmount || 0);
    const averageOrderValue = ordersToday > 0 ? todaysSales / ordersToday : 0;

    const pendingOrders = await prisma.order.count({
      where: {
        ...baseOrderWhere,
        status: { in: ['NEW', 'CONFIRMED', 'WAITING_FOR_CHEF', 'MAKING', 'DECORATING', 'READY', 'OUT_FOR_DELIVERY'] as any }
      }
    });

    // 3. Sales by Product & Category using single efficient DB query
    const orderItems = await prisma.orderItem.findMany({
      where: { order: baseOrderWhere },
      select: {
        productName: true,
        quantity: true,
        price: true,
        product: {
          select: {
            category: { select: { name: true } }
          }
        }
      }
    });

    const productMap: Record<string, { count: number; revenue: number }> = {};
    const categoryMap: Record<string, { count: number; revenue: number }> = {};

    for (const item of orderItems) {
      // Assuming price is unit price, revenue = unit price * quantity
      const rev = Number(item.price) * item.quantity;
      
      // Product mapping
      if (!productMap[item.productName]) {
        productMap[item.productName] = { count: 0, revenue: 0 };
      }
      productMap[item.productName].count += item.quantity;
      productMap[item.productName].revenue += rev;

      // Category mapping
      const catName = item.product?.category?.name || 'Uncategorized';
      if (!categoryMap[catName]) {
        categoryMap[catName] = { count: 0, revenue: 0 };
      }
      categoryMap[catName].count += item.quantity;
      categoryMap[catName].revenue += rev;
    }

    const salesByProduct = Object.entries(productMap)
      .map(([productName, data]) => ({ productName, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // top 10

    const salesByCategory = Object.entries(categoryMap)
      .map(([categoryName, data]) => ({ categoryName, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // 4. Branch Ranking (if all branches)
    let branchRanking: any[] = [];
    if (!branchId) {
      const branchAgg = await prisma.order.groupBy({
        by: ['branchId'],
        where: baseOrderWhere,
        _sum: { totalAmount: true },
        _count: { id: true }
      });
      const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
      branchRanking = branchAgg.map(b => ({
        branchId: b.branchId,
        branchName: branches.find(br => br.id === b.branchId)?.name || 'Unknown',
        revenue: Number(b._sum.totalAmount || 0),
        totalOrders: b._count.id
      })).sort((a, b) => b.revenue - a.revenue);
    }

    // 5. Live Orders (UI needs this)
    const liveOrdersData = await prisma.order.findMany({
      where: {
        ...branchFilter,
        status: { notIn: ['DRAFT', 'COMPLETED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] as any },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        type: true,
        branch: { select: { name: true } },
        customer: { select: { name: true } }
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
        type: o.type,
        status: o.status,
        amount: Number(o.totalAmount),
        time: diffMinutes < 60 ? `${diffMinutes} mins ago` : `${Math.floor(diffMinutes / 60)} hr ago`
      };
    });

    // Return structured data
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          todaysSales,
          ordersToday,
          pendingOrders,
          averageOrderValue
        },
        kpis: { // Preserved for UI compatibility until UI is updated
          todaysSales,
          ordersToday,
          pendingOrders,
          averageOrderValue,
          topProducts: salesByProduct,
          branchRanking
        },
        salesByProduct,
        salesByCategory,
        liveOrders,
        pendingBalances: [] // Preserved for UI compatibility
      },
      meta: {
        dateFiltered: todayStart.toISOString()
      }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
});
