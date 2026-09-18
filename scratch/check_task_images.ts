import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const vikas = await prisma.user.findFirst({
    where: { role: 'VENDOR_FLORIST' }
  });

  if (!vikas) return;

  const tasks = await prisma.orderItem.findMany({
    where: { assignedVendorId: vikas.id },
    include: {
      order: { select: { orderNumber: true } },
      media: true,
      parentItem: { include: { media: true } }
    }
  });

  console.log('--- VIKAS BHAI TASKS IMAGE FIELDS ---');
  tasks.forEach(t => {
    console.log(`Task ID: ${t.id} | Order: ${t.order.orderNumber}`);
    console.log(` - item.image:`, t.image);
    console.log(` - item.designImageUrl:`, t.designImageUrl);
    console.log(` - item.media:`, t.media);
    console.log(` - parentItem:`, t.parentItem);
    console.log('-----------------------------------');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
