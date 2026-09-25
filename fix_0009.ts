import { prisma } from './src/lib/prisma';

async function fixOrder0009() {
  const order = await prisma.order.findUnique({
    where: { orderNumber: '001-0009' },
    include: { items: true }
  });

  if (!order) {
    console.log("Order not found");
    return;
  }

  const parentItem = order.items.find(i => i.productName === 'LILY FAULTLINE PHOTO CAKE');

  if (parentItem) {
    // Find the vendor photo
    const vendor = await prisma.user.findFirst({ where: { role: 'VENDOR_PHOTO' }});
    
    if (vendor) {
      const child = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          parentItemId: parentItem.id,
          productName: 'PHOTO Component',
          price: 0,
          quantity: parentItem.quantity,
          weight: 0,
          status: 'WAITING_FOR_CHEF',
          assignedVendorId: vendor.id,
        }
      });
      console.log("Created child item:", child.id);
    }
  }
}

fixOrder0009().catch(console.error).finally(() => prisma.$disconnect());
