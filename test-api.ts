import { prisma as db } from './src/lib/prisma';
import { FinancialService } from './src/services/FinancialService';

async function run() {
  const driverId = 'baggi'; // Baggi
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
      branch: { select: { name: true, address: true } },
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

  console.log('Orders found in DB:', orders.length);
  const payload: any[] = [];
  orders.forEach((rawOrder) => {
    const order = rawOrder as any;
    if (['NEW', 'WAITING_FOR_CHEF', 'CHEF_ACCEPTED', 'MAKING', 'DECORATING', 'PENDING_ASSIGNMENT', 'READY_FOR_PICKUP', 'ASSIGNED_TO_DRIVER', 'PICKED_UP', 'ON_THE_WAY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY'].includes(order.status)) {
      if (driverId && order.driverId && order.driverId !== driverId) return;

      payload.push({
        id: `delivery-${order.id}`,
        status: order.status,
      });
    }
  });

  console.log('Payload items:', payload.length);
  console.log('Payload:', payload);
}
run().finally(() => db.$disconnect());
