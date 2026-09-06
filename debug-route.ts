import { prisma as db } from './src/lib/prisma';
import { FinancialService } from './src/services/FinancialService';

async function run() {
  const driverId = 'cmswuijfn000v1su3gv1om5h8'; // Baggi
  const branchFilter = {};

  const orders = await db.order.findMany({
    where: {
      deliveryType: 'DELIVERY',
      OR: [
        { status: { in: ['NEW', 'WAITING_FOR_CHEF', 'CHEF_ACCEPTED', 'MAKING', 'DECORATING', 'READY_FOR_PICKUP', 'PENDING_ASSIGNMENT'] }, driverId: null, ...branchFilter },
        { driverId: driverId ? driverId : { not: null } },
        { items: { some: { status: { in: ['READY_FOR_PICKUP', 'DELIVERED'] }, assignedVendorId: { not: null } } }, driverId: null, ...branchFilter }
      ]
    },
    include: {
      customer: true,
      branch: { select: { name: true, address: true, deliveryEnabled: true } },
      items: {
        include: { 
          childItems: {
            include: { assignedVendor: { select: { name: true } } }
          },
          assignedVendor: { select: { name: true } }
        }
      },
      ledgerEntries: true
    },
    orderBy: {
      targetDate: 'asc'
    }
  });

  const payload: any[] = [];
  
  orders.forEach((rawOrder) => {
    const order = rawOrder as any;

    if (['NEW', 'WAITING_FOR_CHEF', 'CHEF_ACCEPTED', 'MAKING', 'DECORATING', 'PENDING_ASSIGNMENT', 'READY_FOR_PICKUP', 'ASSIGNED_TO_DRIVER', 'PICKED_UP', 'ON_THE_WAY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY'].includes(order.status)) {
      if (driverId && order.driverId && order.driverId !== driverId) return;

      payload.push(async () => {
        const summary = await FinancialService.calculateFinancialSummary(order);
        return {
          id: `delivery-${order.id}`,
          taskType: 'CUSTOMER_DELIVERY',
          orderNumber: order.orderNumber,
          status: order.status,
          deliveryType: order.deliveryType,
          targetDate: order.targetDate,
          createdAt: order.createdAt,
          assignedDriverId: order.driverId,
        };
      });
    }
  });

  const resolvedPayload = await Promise.all(payload.map(p => typeof p === 'function' ? p() : Promise.resolve(p)));
  console.log('Resolved Payload:', resolvedPayload);
}
run().finally(() => db.$disconnect());
