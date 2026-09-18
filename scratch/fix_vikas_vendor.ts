import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- 1. UPDATE VIKAS BHAI TO ACTIVE STATUS ---');
  const vikas = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: 'Vikas', mode: 'insensitive' } },
        { role: 'VENDOR_FLORIST' }
      ]
    }
  });

  if (vikas) {
    const updated = await prisma.user.update({
      where: { id: vikas.id },
      data: { status: 'ACTIVE', activatedAt: new Date() }
    });
    console.log('✅ Vikas Bhai activated:', updated.name, updated.id, updated.status);
  } else {
    console.log('❌ Vikas Bhai user record not found.');
  }

  console.log('\n--- 2. ASSIGN VIKAS BHAI TO FLOWER CAKE ORDER ITEMS ---');
  if (vikas) {
    // Find all recent order items with Flower in the name
    const flowerItems = await prisma.orderItem.findMany({
      where: {
        OR: [
          { productName: { contains: 'Flower', mode: 'insensitive' } },
          { flavor: { contains: 'Flower', mode: 'insensitive' } }
        ]
      },
      include: { order: true }
    });

    console.log(`Found ${flowerItems.length} flower-related order items.`);

    for (const item of flowerItems) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          assignedVendorId: vikas.id,
          status: item.status === 'COMPLETED' ? 'COMPLETED' : 'WAITING_FOR_CHEF'
        }
      });
      console.log(`✅ Assigned OrderItem ${item.id} (${item.productName}) for Order #${item.order.orderNumber} to Vikas Bhai (${vikas.name})`);
    }
  }

  console.log('\n--- 3. VERIFY VIKAS BHAI VENDOR TASKS ---');
  if (vikas) {
    const tasks = await prisma.orderItem.findMany({
      where: { assignedVendorId: vikas.id },
      include: { order: true }
    });
    console.log(`Vikas Bhai now has ${tasks.length} assigned tasks:`);
    tasks.forEach(t => {
      console.log(` - Item: ${t.productName} | Order #${t.order.orderNumber} | Status: ${t.status}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
