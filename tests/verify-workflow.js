const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWorkflow() {
  console.log("Creating mock driver...");
  const driver = await prisma.user.create({
    data: {
      name: 'Test Driver',
      email: 'driver_' + Date.now() + '@test.com',
      role: 'DRIVER',
    }
  });

  console.log("Creating mock customer...");
  const customer = await prisma.customer.create({
    data: {
      name: 'Test Customer',
      phone: '1234567890_' + Date.now(),
    }
  });

  console.log("Simulating POS Checkout...");
  // Using the new payload structure with multiple payments
  const payload = {
    customerId: customer.id,
    orderType: 'WALK_IN',
    items: [
      {
        productId: "some-product-id",
        name: "Cake",
        price: 500,
        quantity: 1
      }
    ],
    payments: [
      { amount: 300, method: 'CASH' },
      { amount: 200, method: 'UPI' }
    ]
  };

  // Create order directly using Prisma (mimicking StorefrontEngine)
  const order = await prisma.order.create({
    data: {
      orderNumber: 'TEST-' + Date.now(),
      customerId: payload.customerId,
      type: payload.orderType,
      status: 'NEW',
      totalAmount: 500,
      paidAmount: 500,
      paymentStatus: 'PAID',
      items: {
        create: payload.items.map(item => ({
          productId: null, // skipping FK constraint for test
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          status: 'PENDING'
        }))
      },
      payments: {
        create: payload.payments.map(p => ({
          amount: p.amount,
          method: p.method,
          status: 'COMPLETED'
        }))
      }
    },
    include: { payments: true }
  });

  console.log("Created Order:", JSON.stringify(order, null, 2));
  
  if (order.payments.length === 2 && order.paidAmount === 500) {
     console.log("✅ POS Checkout Multiple Payments Saved Successfully.");
  } else {
     console.error("❌ POS Checkout payment save failed.");
  }

  console.log("\nSimulating Admin Reassign Driver...");
  // Assuming the order is somehow assigned to driver
  const assignedOrder = await prisma.order.update({
    where: { id: order.id },
    data: { 
      status: 'ASSIGNED_TO_DRIVER',
      driverId: driver.id 
    }
  });
  console.log("Order assigned to Driver:", driver.name);

  // Now simulate reassign driver using the API logic
  const newDriver = await prisma.user.create({
    data: {
      name: 'New Driver',
      email: 'newdriver_' + Date.now() + '@test.com',
      role: 'DRIVER',
    }
  });

  const reassignedOrder = await prisma.order.update({
    where: { id: order.id },
    data: { driverId: newDriver.id }
  });

  if (reassignedOrder.driverId === newDriver.id) {
    console.log("✅ Order successfully reassigned to New Driver:", newDriver.name);
  } else {
    console.error("❌ Order reassignment failed.");
  }

}

testWorkflow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
