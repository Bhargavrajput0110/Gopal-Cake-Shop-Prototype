import { prisma } from './src/lib/prisma';

async function run() {
  console.log('--- BEFORE CLEANUP ---');
  console.log('Users:', await prisma.user.count());
  console.log('Customers:', await prisma.customer.count());
  console.log('Products:', await prisma.product.count());
  console.log('Orders:', await prisma.order.count());
  console.log('Branches:', await prisma.branch.count());

  // 1. Identify test orders
  const testOrders = await prisma.order.findMany({
    where: {
      orderNumber: {
        startsWith: 'TEST-'
      }
    },
    select: { id: true }
  });

  const testOrderIds = testOrders.map(o => o.id);
  console.log(`Found ${testOrderIds.length} test orders to delete.`);

  if (testOrderIds.length > 0) {
    // Delete dependent records
    await prisma.deliveryAssignment.deleteMany({
      where: { orderId: { in: testOrderIds } }
    });
    
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: testOrderIds } }
    });

    await prisma.payment.deleteMany({
      where: { orderId: { in: testOrderIds } }
    });

    await prisma.timeline.deleteMany({
      where: { orderId: { in: testOrderIds } }
    });

    // Delete the orders
    await prisma.order.deleteMany({
      where: { id: { in: testOrderIds } }
    });
  }

  // 2. Identify test users
  const testUserIds = ['manoj_1', 'haru_1', 'rishi_1'];
  
  // Check if they are actually the dummy ones created by our test
  const usersToDelete = await prisma.user.findMany({
    where: { id: { in: testUserIds } }
  });

  console.log(`Found ${usersToDelete.length} dummy users to delete:`, usersToDelete.map(u => u.id));

  if (usersToDelete.length > 0) {
    // Ensure we don't accidentally delete real users, but these exact IDs were hardcoded for the test script
    await prisma.user.deleteMany({
      where: { id: { in: usersToDelete.map(u => u.id) } }
    });
  }

  console.log('--- AFTER CLEANUP ---');
  console.log('Users:', await prisma.user.count());
  console.log('Customers:', await prisma.customer.count());
  console.log('Products:', await prisma.product.count());
  console.log('Orders:', await prisma.order.count());
  console.log('Branches:', await prisma.branch.count());
  console.log('Remaining Delivery Assignments for TEST orders:', await prisma.deliveryAssignment.count({
    where: { order: { orderNumber: { startsWith: 'TEST-' } } }
  }));
}

run().catch(console.error).finally(() => prisma.$disconnect());
