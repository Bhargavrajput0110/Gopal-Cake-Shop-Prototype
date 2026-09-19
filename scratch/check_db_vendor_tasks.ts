import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- ALL VENDORS IN USER TABLE ---');
  const vendors = await prisma.user.findMany({
    where: { role: { in: ['VENDOR_FLORIST', 'VENDOR_PHOTO', 'VENDOR_ACRYLIC'] } }
  });
  console.log('Vendors:', vendors.map(v => ({ id: v.id, name: v.name, role: v.role, status: v.status })));

  console.log('\n--- ALL VENDORTASK ENTRIES IN DB ---');
  const vendorTasks = await prisma.vendorTask.findMany({
    include: {
      order: { select: { id: true, orderNumber: true, status: true, targetDate: true } },
      vendor: { select: { id: true, name: true, role: true } }
    }
  });
  console.log('VendorTask count:', vendorTasks.length);
  console.log('VendorTasks:', JSON.stringify(vendorTasks, null, 2));

  console.log('\n--- ALL ORDERITEMS WITH assignedVendorId ---');
  const orderItems = await prisma.orderItem.findMany({
    where: { assignedVendorId: { not: null } },
    include: {
      assignedVendor: { select: { id: true, name: true, role: true } },
      order: { select: { id: true, orderNumber: true, status: true } }
    }
  });
  console.log('Assigned OrderItems count:', orderItems.length);
  console.log('OrderItems:', JSON.stringify(orderItems, null, 2));

  console.log('\n--- ALL ORDERS WITH VENDORTASKS JSON OR ARRAY ---');
  const allOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      vendorTasks: true,
      items: true
    }
  });
  console.log('Recent Orders vendorTasks field:', JSON.stringify(allOrders.map(o => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    vendorTasks: (o as any).vendorTasks,
    itemCount: o.items.length
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
