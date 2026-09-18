import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- USER LOOKUP ---');
  const vikas = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: 'Vikas', mode: 'insensitive' } },
        { role: 'VENDOR_FLORIST' }
      ]
    }
  });
  console.log('Vikas user record:', vikas);

  console.log('\n--- ALL VENDOR USERS ---');
  const vendorUsers = await prisma.user.findMany({
    where: { role: { in: ['VENDOR_FLORIST', 'VENDOR_PHOTO', 'VENDOR_ACRYLIC'] } }
  });
  console.log('Vendor users:', vendorUsers);

  console.log('\n--- ALL VENDOR TASKS IN VENDORTASK TABLE ---');
  const vendorTasks = await prisma.vendorTask.findMany({
    include: {
      vendor: true,
      order: true
    }
  });
  console.log('VendorTask count:', vendorTasks.length);
  console.log('VendorTasks:', JSON.stringify(vendorTasks, null, 2));

  console.log('\n--- ALL ORDERITEMS WITH ASSIGNED VENDOR ---');
  const assignedItems = await prisma.orderItem.findMany({
    where: { assignedVendorId: { not: null } },
    include: {
      assignedVendor: true,
      order: true
    }
  });
  console.log('Assigned OrderItems count:', assignedItems.length);
  console.log('Assigned OrderItems:', JSON.stringify(assignedItems, null, 2));

  console.log('\n--- RECENT ORDERS AND ITEMS ---');
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      vendorTasks: true
    }
  });
  console.log('Recent Orders:', JSON.stringify(recentOrders, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
