const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const customer = await prisma.customer.findFirst();
    const branch = await prisma.branch.findFirst();
    const product = await prisma.product.findFirst();

    console.log("Found:", { customer: !!customer, branch: !!branch, product: !!product });

    // Mock payload based on checkout logic
    const payload = {
      customerId: customer.id,
      branchId: branch.id,
      items: [
        {
          productId: product.id,
          quantity: 1,
          weight: 1.5,
          flavor: "Classic",
        }
      ],
      deliveryType: "PICKUP",
      targetDate: new Date(Date.now() + 86400000).toISOString(),
      deliveryAddress: "Store Pickup, Vadodara",
      paymentMethod: "ADVANCE_50",
      paymentType: "FULL",
      idempotencyKey: Date.now().toString(),
    };

    console.log("Mock Payload Ready", payload);
  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    process.exit();
  }
}
run();
