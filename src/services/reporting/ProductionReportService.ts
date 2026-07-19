import { prisma } from '@/lib/prisma';
import { ProductionMetricsDTO, ReportingFilters } from './types';

export class ProductionReportService {
  static async getMetrics(filters: ReportingFilters): Promise<ProductionMetricsDTO> {
    const { startDate, endDate, branchId } = filters;

    const orderWhere: any = {
      createdAt: { gte: startDate, lte: endDate }
    };
    if (branchId) orderWhere.branchId = branchId;

    const items = await prisma.orderItem.findMany({
      where: { order: orderWhere },
      include: {
        order: { select: { timeline: true } }
      }
    });

    const chefWorkloadMap: Record<string, number> = {};
    const vendorWorkloadMap: Record<string, number> = {};
    let pendingItems = 0;
    const bottleneckMap: Record<string, number> = {};

    let totalPrepTimeMinutes = 0;
    let prepTimeCount = 0;

    items.forEach(item => {
      // Workloads
      if (item.assignedChefId) {
        chefWorkloadMap[item.assignedChefId] = (chefWorkloadMap[item.assignedChefId] || 0) + 1;
      } else {
        // Just assuming unassigned items count towards "vendor" or unassigned bottleneck
        vendorWorkloadMap['UNASSIGNED/VENDOR'] = (vendorWorkloadMap['UNASSIGNED/VENDOR'] || 0) + 1;
      }

      // Status bottlenecks (simplified by completedAt/packedAt/readyAt existence)
      if (!item.completedAt && !item.readyAt) {
        pendingItems++;
        bottleneckMap['IN_PREPARATION'] = (bottleneckMap['IN_PREPARATION'] || 0) + 1;
      } else if (!item.packedAt) {
        bottleneckMap['WAITING_PACKING'] = (bottleneckMap['WAITING_PACKING'] || 0) + 1;
      }

      // Preparation time calculation via Timeline
      // We look at the order's timeline to find when it went to IN_PRODUCTION and when it went to READY_FOR_DELIVERY
      const tInProd = item.order.timeline.find(t => t.nextState === 'MAKING' || t.action === 'assign-chef');
      const tReady = item.order.timeline.find(t => t.nextState === 'READY' || t.action === 'mark-ready');

      if (tInProd && tReady && tReady.createdAt > tInProd.createdAt) {
        const diffMs = tReady.createdAt.getTime() - tInProd.createdAt.getTime();
        totalPrepTimeMinutes += diffMs / (1000 * 60);
        prepTimeCount++;
      }
    });

    // Resolve user IDs to names for workloads
    const chefIds = Object.keys(chefWorkloadMap);
    let chefNamesMap: Record<string, string> = {};
    if (chefIds.length > 0) {
      const chefs = await prisma.user.findMany({ where: { id: { in: chefIds } }, select: { id: true, name: true }});
      chefNamesMap = chefs.reduce((acc, c) => { acc[c.id] = c.name; return acc; }, {} as Record<string, string>);
    }

    const averagePreparationTime = prepTimeCount > 0 ? (totalPrepTimeMinutes / prepTimeCount) : 0;

    return {
      chefWorkload: Object.entries(chefWorkloadMap).map(([id, count]) => ({ chefName: chefNamesMap[id] || id, assignedItems: count })),
      vendorWorkload: Object.entries(vendorWorkloadMap).map(([vendorName, count]) => ({ vendorName, assignedItems: count })),
      averagePreparationTime,
      pendingItems,
      bottlenecks: Object.entries(bottleneckMap).map(([stage, count]) => ({ stage, count }))
    };
  }
}
