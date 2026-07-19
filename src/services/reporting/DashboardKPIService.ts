import { prisma } from '@/lib/prisma';

// Production statuses = actively being worked on in the kitchen
const PRODUCTION_STATUSES = ['MAKING', 'DECORATING'] as const;

// Orders not yet done = any status before COMPLETED/CANCELLED
const TERMINAL_STATUSES = ['DELIVERED', 'COMPLETED', 'CANCELLED'];

import { startOfDay, endOfDay, subDays } from 'date-fns';

export interface DashboardKPIFilters {
  branchId: string | null; // null = all branches (Admin only)
  date?: Date;              // defaults to today
}

export interface RevenuePoint {
  date: string; // ISO date string (YYYY-MM-DD)
  revenue: number;
}

export interface DashboardKPIs {
  // Revenue
  todaysSales: number;
  todaysRefunds: number;
  revenueVsPreviousPeriod: { current: number; previous: number; changePercent: number };
  averageOrderValue: number;
  revenueTrend: RevenuePoint[];

  // Orders
  ordersToday: number;
  pendingOrders: number;
  ordersByStatus: Record<string, number>;

  // Production health
  averageProductionTimeMinutes: number;
  averageDeliveryTimeMinutes: number;
  lateOrdersCount: number;
  ordersWaitingTooLong: number;     // IN_PRODUCTION longer than threshold
  averageQueueLength: number;       // avg active IN_PRODUCTION orders over today

  // Products
  topProducts: { productName: string; count: number; revenue: number }[];

  // Branch ranking (populated only when branchId is null)
  branchRanking: { branchId: string; branchName: string; revenue: number }[];
}

const LATE_PRODUCTION_THRESHOLD_MINUTES = 60; // configurable in future

export class DashboardKPIService {

  /**
   * getKPIs
   * ReportingService is a read-only domain service. It never mutates application state and has no side effects.
   *
   * Date Handling:
   * - Today = branch timezone (local via JS Date for now)
   * - Revenue comparisons use the same duration immediately preceding the selected period.
   */
  static async getKPIs(filters: DashboardKPIFilters): Promise<DashboardKPIs> {
    const targetDate = filters.date ?? new Date();
    const todayStart = startOfDay(targetDate);
    const todayEnd = endOfDay(targetDate);

    // Yesterday window for period comparison
    const yesterdayStart = subDays(todayStart, 1);
    const yesterdayEnd = subDays(todayEnd, 1);

    const branchFilter = filters.branchId ? { branchId: filters.branchId } : {};

    // ── 1. Ledger KPIs (today) ────────────────────────────────────────────────
    // Today's Sales Calculation
    // Source: LedgerEntry | Filter: type=PAYMENT, status=SUCCESS | Formula: SUM(amount)
    const [todayLedger, yesterdayLedger] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where: {
          ...branchFilter,
          status: 'SUCCESS',
          createdAt: { gte: todayStart, lte: todayEnd },
        },
        select: { type: true, amount: true, branchId: true, branch: { select: { name: true } } },
      }),
      prisma.ledgerEntry.findMany({
        where: {
          ...branchFilter,
          status: 'SUCCESS',
          type: 'PAYMENT',
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        },
        select: { amount: true },
      }),
    ]);

    let todaysSales = 0;
    let todaysRefunds = 0;
    const branchRevenueMap: Record<string, { name: string; revenue: number }> = {};

    for (const entry of todayLedger) {
      const amount = Number(entry.amount);
      if (entry.type === 'PAYMENT') {
        todaysSales += amount;
        if (entry.branchId && entry.branch) {
          if (!branchRevenueMap[entry.branchId]) {
            branchRevenueMap[entry.branchId] = { name: entry.branch.name, revenue: 0 };
          }
          branchRevenueMap[entry.branchId].revenue += amount;
        }
      } else if (entry.type === 'REFUND') {
        todaysRefunds += amount;
      }
    }

    // Net sales should include refunds (which are usually negative)
    todaysSales = todaysSales + todaysRefunds;

    const previousRevenue = yesterdayLedger.reduce((sum, e) => sum + Number(e.amount), 0);
    const changePercent =
      previousRevenue > 0
        ? ((todaysSales - previousRevenue) / previousRevenue) * 100
        : 0;

    // ── 2. Orders today ──────────────────────────────────────────────────────
    // Orders Today Calculation
    // Source: Order | Filter: createdAt=today (exclude CANCELLED/DRAFT) | Formula: COUNT(id)
    const todaysOrders = await prisma.order.findMany({
      where: {
        ...branchFilter,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        targetDate: true,
        items: { select: { productName: true, quantity: true, price: true } },
      },
    });

    const ordersByStatus: Record<string, number> = {};
    let totalRevenue = 0;
    let revenueOrderCount = 0;
    let pendingOrders = 0;

    const pendingStatuses = ['NEW', 'CONFIRMED', 'WAITING_FOR_CHEF', 'MAKING', 'DECORATING'];

    for (const order of todaysOrders) {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      if (order.status !== 'CANCELLED' && order.status !== 'DRAFT') {
        totalRevenue += Number(order.totalAmount);
        revenueOrderCount++;
      }
      if (pendingStatuses.includes(order.status)) {
        pendingOrders++;
      }
    }

    // Average Order Value Calculation
    // Source: Order / LedgerEntry | Formula: Sales / Orders Count
    const averageOrderValue = revenueOrderCount > 0 ? totalRevenue / revenueOrderCount : 0;

    // ── 3. Top Products ──────────────────────────────────────────────────────
    const productMap: Record<string, { count: number; revenue: number }> = {};
    for (const order of todaysOrders) {
      if (order.status === 'CANCELLED') continue;
      for (const item of order.items) {
        if (!productMap[item.productName]) productMap[item.productName] = { count: 0, revenue: 0 };
        productMap[item.productName].count += item.quantity;
        productMap[item.productName].revenue += Number(item.price) * item.quantity;
      }
    }

    const topProducts = Object.entries(productMap)
      .map(([productName, data]) => ({ productName, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── 4. Late Orders & Overdue Production ──────────────────────────────────
    const now = new Date();
    const activeProductionOrders = await prisma.order.findMany({
      where: {
        ...branchFilter,
        status: { in: [...PRODUCTION_STATUSES] },
      },
      select: {
        id: true,
        targetDate: true,
        timeline: {
          where: { action: 'production_started' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    let ordersWaitingTooLong = 0;
    for (const order of activeProductionOrders) {
      const productionStartEvent = order.timeline[0];
      if (productionStartEvent) {
        const minutesInProduction =
          (now.getTime() - productionStartEvent.createdAt.getTime()) / (1000 * 60);
        if (minutesInProduction > LATE_PRODUCTION_THRESHOLD_MINUTES) {
          ordersWaitingTooLong++;
        }
      }
    }

    const lateOrdersCount = await prisma.order.count({
      where: {
        ...branchFilter,
        targetDate: { lt: now },
        status: {
          notIn: TERMINAL_STATUSES as any,
        },
      },
    });

    // ── 5. Average Queue Length (snapshot of active IN_PRODUCTION now) ────────
    const averageQueueLength = activeProductionOrders.length;

    // ── 6. Avg Production & Delivery Time (from Timeline, last 7 days) ───────
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [productionTimelines, deliveryTimelines] = await Promise.all([
      prisma.timeline.findMany({
        where: {
          ...(filters.branchId ? { branchId: filters.branchId } : {}),
          action: 'production_started',
          createdAt: { gte: sevenDaysAgo },
        },
        select: { orderId: true, createdAt: true },
      }),
      prisma.timeline.findMany({
        where: {
          ...(filters.branchId ? { branchId: filters.branchId } : {}),
          action: { in: ['order_ready', 'order_delivered'] },
          createdAt: { gte: sevenDaysAgo },
        },
        select: { orderId: true, action: true, createdAt: true },
      }),
    ]);

    // Production time: production_started → order_ready
    const readyEvents = new Map(
      deliveryTimelines
        .filter(t => t.action === 'order_ready')
        .map(t => [t.orderId, t.createdAt])
    );
    const deliveredEvents = new Map(
      deliveryTimelines
        .filter(t => t.action === 'order_delivered')
        .map(t => [t.orderId, t.createdAt])
    );

    let totalProdMinutes = 0;
    let prodCount = 0;
    for (const start of productionTimelines) {
      const ready = readyEvents.get(start.orderId);
      if (ready && ready > start.createdAt) {
        totalProdMinutes += (ready.getTime() - start.createdAt.getTime()) / 60000;
        prodCount++;
      }
    }

    // Delivery time: order_ready → order_delivered
    let totalDeliveryMinutes = 0;
    let deliveryCount = 0;
    for (const [orderId, readyAt] of readyEvents) {
      const deliveredAt = deliveredEvents.get(orderId);
      if (deliveredAt && deliveredAt > readyAt) {
        totalDeliveryMinutes += (deliveredAt.getTime() - readyAt.getTime()) / 60000;
        deliveryCount++;
      }
    }

    // ── 7. Branch Ranking (Admin only, branchId = null) ──────────────────────
    const branchRanking = filters.branchId
      ? []
      : Object.entries(branchRevenueMap)
          .map(([branchId, data]) => ({ branchId, branchName: data.name, revenue: data.revenue }))
          .sort((a, b) => b.revenue - a.revenue);

    // ── 8. Revenue Trend (Last 7 Days) ──────────────────────────────────────
    const last7DaysStart = subDays(todayStart, 7);
    const trendEntries = await prisma.ledgerEntry.findMany({
      where: {
        ...branchFilter,
        type: 'PAYMENT',
        status: 'SUCCESS',
        createdAt: { gte: last7DaysStart, lte: todayEnd },
      },
      select: { amount: true, createdAt: true },
    });

    const trendMap = new Map<string, number>();
    let currentDate = last7DaysStart;
    while (currentDate <= todayEnd) {
      const key = currentDate.toISOString().split('T')[0];
      trendMap.set(key, 0);
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }
    for (const entry of trendEntries) {
      const key = startOfDay(entry.createdAt).toISOString().split('T')[0];
      if (trendMap.has(key)) {
        trendMap.set(key, trendMap.get(key)! + Number(entry.amount));
      }
    }
    const revenueTrend = Array.from(trendMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      todaysSales,
      todaysRefunds,
      revenueVsPreviousPeriod: {
        current: todaysSales,
        previous: previousRevenue,
        changePercent: Math.round(changePercent * 10) / 10,
      },
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      revenueTrend,
      ordersToday: revenueOrderCount,
      pendingOrders,
      ordersByStatus,
      averageProductionTimeMinutes:
        prodCount > 0 ? Math.round(totalProdMinutes / prodCount) : 0,
      averageDeliveryTimeMinutes:
        deliveryCount > 0 ? Math.round(totalDeliveryMinutes / deliveryCount) : 0,
      lateOrdersCount,
      ordersWaitingTooLong,
      averageQueueLength,
      topProducts,
      branchRanking,
    };
  }
}
