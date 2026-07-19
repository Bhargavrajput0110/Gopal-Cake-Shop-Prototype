import { prisma } from '../src/lib/prisma';

async function main() {
  const branch = await prisma.branch.findFirst({
    where: { name: 'Khanderao Market' }
  });
  
  if (!branch) {
    console.error("No branch found");
    return;
  }

  const orderId = `ORD-PHOTO-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const order = await prisma.order.create({
    data: {
      id: orderId,
      orderNumber: orderId,
      branchId: branch.id,
      customerId: 'walk-in',
      status: 'WAITING_FOR_CHEF',
      type: 'WALK_IN',
      grandTotal: 1200,
      subtotal: 1200,
      tax: 0,
      deliveryCharge: 0,
      advancePaid: 1200,
      pendingBalance: 0,
      targetDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      paymentStatus: 'PAID',
      priorityLevel: 'high',
      delayLevel: 'none',
      isSurprise: false,
      items: {
        create: [
          {
            productId: 'custom-photo-cake',
            productName: 'Custom Spiderman Photo Cake',
            quantity: 1,
            unitPrice: 1200,
            totalPrice: 1200,
            notes: 'Spiderman theme with edible photo',
          }
        ]
      },
      vendorTasks: {
        create: [
          {
            vendorType: 'photo',
            status: 'pending',
            instructions: 'Print this photo of Spiderman for the cake top.',
            designImageUrl: 'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=500&q=80',
          }
        ]
      }
    }
  });

  console.log("Created Fake Photo Cake Order:", order.orderNumber);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
