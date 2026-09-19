import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('=== ALL USERS WITH ROLE VENDOR ===');
  const vendors = await prisma.user.findMany({
    where: { role: { in: ['VENDOR_FLORIST', 'VENDOR_PHOTO', 'VENDOR_ACRYLIC'] } }
  });
  console.log(vendors.map(v => ({ id: v.id, name: v.name, role: v.role, status: v.status })));

  console.log('\n=== ALL ORDERS IN DB (LAST 15) ===');
  const orders = await prisma.order.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          assignedVendor: { select: { id: true, name: true, role: true } }
        }
      },
      vendorTasks: {
        include: {
          vendor: { select: { id: true, name: true, role: true } }
        }
      },
      branch: { select: { name: true } }
    }
  });

  for (const o of orders) {
    console.log(`\n----------------------------------------`);
    console.log(`ORDER ID: ${o.id} | NUMBER: ${o.orderNumber} | STATUS: ${o.status} | CREATED: ${o.createdAt.toISOString()}`);
    console.log(`Items count: ${o.items.length}`);
    for (const item of o.items) {
      console.log(`  - Item ID: ${item.id} | Name: ${item.productName} | Status: ${item.status} | AssignedVendorId: ${item.assignedVendorId} (${item.assignedVendor?.name})`);
    }
    console.log(`VendorTasks count: ${o.vendorTasks.length}`);
    for (const vt of o.vendorTasks) {
      console.log(`  - Task ID: ${vt.id} | Type: ${vt.vendorType} | Status: ${vt.status} | Instructions: "${vt.instructions}" | VendorId: ${vt.vendorId} (${vt.vendor?.name})`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
