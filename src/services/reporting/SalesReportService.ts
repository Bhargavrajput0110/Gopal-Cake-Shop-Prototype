import { prisma } from '@/lib/prisma';
import { SalesMetricsDTO, ReportingFilters } from './types';

export class SalesReportService {
  static async getMetrics(filters: ReportingFilters): Promise<SalesMetricsDTO> {
    const { startDate, endDate, branchId } = filters;

    const where: any = {
      createdAt: { gte: startDate, lte: endDate }
    };
    if (branchId) where.branchId = branchId;

    const orders = await prisma.order.findMany({
      where,
      include: { branch: true }
    });

    const statusMap: Record<string, number> = {};
    const branchMap: Record<string, { branchName: string; branchId: string; count: number }> = {};
    const hourMap: Record<string, number> = {};

    let totalAmount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    
    // Conversion Tracking
    let quoteCount = 0;
    let confirmedCount = 0;
    let deliveredCount = 0;

    orders.forEach(o => {
      // Status breakdown
      statusMap[o.status] = (statusMap[o.status] || 0) + 1;

      // Branch breakdown
      if (o.branch) {
        if (!branchMap[o.branchId]) {
          branchMap[o.branchId] = { branchName: o.branch.name, branchId: o.branchId, count: 0 };
        }
        branchMap[o.branchId].count++;
      }

      // Peak Hours
      const hourStr = String(o.createdAt.getHours()).padStart(2, '0') + ':00';
      hourMap[hourStr] = (hourMap[hourStr] || 0) + 1;

      // Revenue / AOV (Only for non-cancelled)
      if (o.status !== 'CANCELLED') {
        totalAmount += Number(o.totalAmount);
        completedCount++;
      } else {
        cancelledCount++;
      }

      // Conversion 
      // Assuming Quote = any order created.
      quoteCount++;
      if (['CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)) {
        confirmedCount++;
      }
      if (o.status === 'DELIVERED') {
        deliveredCount++;
      }
    });

    const averageOrderValue = completedCount > 0 ? (totalAmount / completedCount) : 0;
    const cancellationRate = orders.length > 0 ? (cancelledCount / orders.length) : 0;

    return {
      ordersByStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
      ordersByBranch: Object.values(branchMap),
      averageOrderValue,
      peakOrderingHours: Object.entries(hourMap).map(([hour, count]) => ({ hour, count })).sort((a, b) => b.count - a.count), // Sorted by busiest
      cancellationRate,
      conversionRate: {
        quote: quoteCount,
        confirmed: confirmedCount,
        delivered: deliveredCount,
        percentage: quoteCount > 0 ? (deliveredCount / quoteCount) : 0
      }
    };
  }
}
