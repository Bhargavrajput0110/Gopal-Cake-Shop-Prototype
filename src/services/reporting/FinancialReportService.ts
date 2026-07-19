import { prisma } from '@/lib/prisma';
import { FinancialMetricsDTO, ReportingFilters } from './types';

export class FinancialReportService {
  static async getMetrics(filters: ReportingFilters): Promise<FinancialMetricsDTO> {
    const { startDate, endDate, branchId } = filters;

    // Base where clause for Ledger Entries
    const ledgerWhere: any = {
      createdAt: { gte: startDate, lte: endDate },
      status: 'SUCCESS'
    };
    if (branchId) ledgerWhere.branchId = branchId;

    // Fetch ledger entries for the period
    const ledgers = await prisma.ledgerEntry.findMany({
      where: ledgerWhere,
      include: { branch: true }
    });

    // 1. Ledger Breakdown
    let payments = 0;
    let refunds = 0;
    let waivers = 0;

    const paymentMethods = { CASH: 0, UPI: 0, CARD: 0, ONLINE_GATEWAY: 0 };
    const branchRevenueMap: Record<string, { branchName: string; branchId: string; revenue: number }> = {};
    const dailyRevenueMap: Record<string, number> = {};
    const weeklyRevenueMap: Record<string, number> = {};
    const monthlyRevenueMap: Record<string, number> = {};

    ledgers.forEach(l => {
      const amount = Number(l.amount);
      const dateStr = l.createdAt.toISOString().split('T')[0];
      
      const year = l.createdAt.getFullYear();
      const month = String(l.createdAt.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`;

      // Simple week string format: YYYY-Www
      // For precision, get ISO week. Here we'll do a simple approximation by rounding the date to nearest Sunday or using generic week math.
      // But for JS, a simpler way is just grouping by the first day of the week.
      const dayOfWeek = l.createdAt.getDay(); // 0 is Sunday
      const diff = l.createdAt.getDate() - dayOfWeek; 
      const startOfWeek = new Date(l.createdAt.setDate(diff));
      const weekStr = startOfWeek.toISOString().split('T')[0];

      if (l.type === 'PAYMENT') {
        payments += amount;
        
        // Payment methods
        if (l.method === 'CASH') paymentMethods.CASH += amount;
        else if (l.method === 'UPI') paymentMethods.UPI += amount;
        else if (l.method === 'CARD') paymentMethods.CARD += amount;
        else if (l.method) paymentMethods.ONLINE_GATEWAY += amount;

        // Daily/Weekly/Monthly
        dailyRevenueMap[dateStr] = (dailyRevenueMap[dateStr] || 0) + amount;
        weeklyRevenueMap[weekStr] = (weeklyRevenueMap[weekStr] || 0) + amount;
        monthlyRevenueMap[monthStr] = (monthlyRevenueMap[monthStr] || 0) + amount;

        // Branch
        if (l.branchId && l.branch) {
          if (!branchRevenueMap[l.branchId]) {
            branchRevenueMap[l.branchId] = { branchName: l.branch.name, branchId: l.branchId, revenue: 0 };
          }
          branchRevenueMap[l.branchId].revenue += amount;
        }
      } else if (l.type === 'REFUND') {
        refunds += amount;
        // Subtract refunds from revenue tracking? Usually reports separate revenue and refunds, 
        // but net revenue takes it out. Let's keep revenue maps as gross payments.
      } else if (l.type === 'WAIVER') {
        waivers += amount;
      }
    });

    // 2. Outstanding Balance & Collection Rate
    // To find outstanding, we need all orders created in this period, their total amounts, and their payments.
    const orderWhere: any = {
      createdAt: { gte: startDate, lte: endDate },
      status: { not: 'CANCELLED' } // Cancelled orders don't count towards billed outstanding unless cancellation implies some debt.
    };
    if (branchId) orderWhere.branchId = branchId;

    const orders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        totalAmount: true,
        ledgerEntries: {
          where: { status: 'SUCCESS' },
          select: { type: true, amount: true }
        }
      }
    });

    let totalBilled = 0;
    let outstanding = 0;

    orders.forEach(o => {
      const billed = Number(o.totalAmount);
      totalBilled += billed;

      let paid = 0;
      let ref = 0;
      o.ledgerEntries.forEach(le => {
        if (le.type === 'PAYMENT') paid += Number(le.amount);
        if (le.type === 'REFUND') ref += Number(le.amount);
        // Waivers also reduce outstanding
        if (le.type === 'WAIVER') paid += Number(le.amount);
      });
      
      const balance = billed - (paid - ref);
      if (balance > 0) {
        outstanding += balance;
      }
    });

    const netRevenue = payments - refunds;
    const collectionRate = totalBilled > 0 ? (payments / totalBilled) : 0;

    return {
      revenue: payments,
      dailyRevenue: Object.entries(dailyRevenueMap).map(([date, revenue]) => ({ date, revenue })).sort((a,b) => a.date.localeCompare(b.date)),
      weeklyRevenue: Object.entries(weeklyRevenueMap).map(([week, revenue]) => ({ week, revenue })).sort((a,b) => a.week.localeCompare(b.week)),
      monthlyRevenue: Object.entries(monthlyRevenueMap).map(([month, revenue]) => ({ month, revenue })).sort((a,b) => a.month.localeCompare(b.month)),
      branchRevenue: Object.values(branchRevenueMap),
      ledger: {
        payments,
        refunds,
        waivers,
        outstanding,
        netRevenue
      },
      paymentMethods,
      collectionRate
    };
  }
}
