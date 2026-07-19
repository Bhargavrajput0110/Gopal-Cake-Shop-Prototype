import { prisma } from '@/lib/prisma';
import { DeliveryMetricsDTO, ReportingFilters } from './types';

export class DeliveryReportService {
  static async getMetrics(filters: ReportingFilters): Promise<DeliveryMetricsDTO> {
    const { startDate, endDate, branchId } = filters;

    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
      deliveryType: 'DELIVERY', // only care about actual deliveries
      driverId: { not: null }
    };
    if (branchId) where.branchId = branchId;

    const orders = await prisma.order.findMany({
      where,
      include: {
        driver: { select: { name: true } },
        timeline: true
      }
    });

    const driverWorkloadMap: Record<string, number> = {};
    let totalDeliveryTimeMins = 0;
    let deliveryTimeCount = 0;
    
    let onTimeDeliveries = 0;
    let lateDeliveries = 0;
    let failedDeliveries = 0;
    let crossBranchDeliveries = 0; // Requires checking if driver.branchId !== order.branchId (needs more joined data usually, but we will mock or approximate if driver branch isn't fetched. Let's fetch driver branch).

    // Let's refetch with driver branch
    const fullOrders = await prisma.order.findMany({
      where,
      include: {
        driver: { select: { id: true, name: true, branchId: true } },
        timeline: true
      }
    });

    fullOrders.forEach(o => {
      if (o.driver) {
        driverWorkloadMap[o.driver.name] = (driverWorkloadMap[o.driver.name] || 0) + 1;
        if (o.driver.branchId && o.driver.branchId !== o.branchId) {
          crossBranchDeliveries++;
        }
      }

      if (o.status === 'FAILED_DELIVERY') {
        failedDeliveries++;
      }

      const tOut = o.timeline.find(t => t.nextState === 'OUT_FOR_DELIVERY' || t.action === 'dispatch');
      const tDelivered = o.timeline.find(t => t.nextState === 'DELIVERED' || t.action === 'mark-delivered');

      if (tOut && tDelivered && tDelivered.createdAt > tOut.createdAt) {
        const diffMs = tDelivered.createdAt.getTime() - tOut.createdAt.getTime();
        totalDeliveryTimeMins += diffMs / (1000 * 60);
        deliveryTimeCount++;
      }

      if (tDelivered) {
        // Check if on time
        if (tDelivered.createdAt <= o.targetDate) {
          onTimeDeliveries++;
        } else {
          lateDeliveries++;
        }
      }
    });

    const averageDeliveryTime = deliveryTimeCount > 0 ? (totalDeliveryTimeMins / deliveryTimeCount) : 0;

    return {
      driverWorkload: Object.entries(driverWorkloadMap).map(([driverName, deliveries]) => ({ driverName, deliveries })),
      averageDeliveryTime,
      onTimeDeliveries,
      lateDeliveries,
      failedDeliveries,
      crossBranchDeliveries
    };
  }
}
