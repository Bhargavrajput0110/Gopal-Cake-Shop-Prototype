import 'dotenv/config';
import { StorefrontEngine } from '../src/lib/orders/StorefrontEngine';
import { prisma } from '../src/lib/prisma';

async function runSimulation() {
  console.log("Stage 8: Starting Real Bakery Simulation...");
  
  const branch = await prisma.branch.findFirst({ where: { code: 'KHD' } });
  const product = await prisma.product.findFirst();
  const customer = await prisma.customer.findFirst();

  if (!branch || !product || !customer) {
    throw new Error("Missing seed data.");
  }

  // 1. Walk-in Customer (Cash)
  console.log("\n--- Scenario 1: Walk-in Customer (Cash) ---");
  const posPayload = {
    branchId: branch.id,
    customerId: customer.id,
    items: [{ productId: product.id, quantity: 2, weight: 1, price: 500, productName: product.name }],
    deliveryType: 'PICKUP',
    targetDate: new Date().toISOString(),
    paymentMethod: 'CASH',
    paymentType: 'FULL',
    payments: [{ method: 'CASH', amount: 1000 }]
  };
  
  const posOrder = await StorefrontEngine.processCheckout(
    { source: 'POS', branchId: branch.id, userId: 'pos-user' },
    posPayload as any
  );
  console.log(`✅ POS Order Created: ${posOrder.orderNumber}`);

  // Verify status is COMPLETED or READY_FOR_PICKUP
  const verifyPos = await prisma.order.findUnique({ where: { id: posOrder.id } });
  if (verifyPos?.status !== 'COMPLETED' && verifyPos?.status !== 'READY_FOR_PICKUP') {
    console.log(`⚠️ POS Order status is ${verifyPos?.status}, expected COMPLETED/READY`);
  }

  // 2. Website Custom Cake (Quote -> Prod -> Delivery)
  console.log("\n--- Scenario 2: Website Custom Cake ---");
  const webPayload = {
    idempotencyKey: 'sim-web-' + Date.now(),
    customerId: customer.id,
    deliveryAddress: '1 Web Area City 400001',
    deliveryType: 'DELIVERY',
    items: [{ productId: product.id, quantity: 1, weight: 3, flavor: 'Chocolate', messageOnCake: 'Happy Bday!' }],
    paymentMethod: 'UPI',
    paymentType: 'FULL',
    payments: [{ method: 'UPI', amount: 1500 }],
    branchId: branch.id,
    targetDate: new Date(Date.now() + 86400000).toISOString()
  };
  
  const webOrder = await StorefrontEngine.processCheckout(
    { source: 'WEBSITE', branchId: branch.id },
    webPayload as any
  );
  console.log(`✅ Web Order Created: ${webOrder.orderNumber}`);

  // Transition to Production
  await prisma.order.update({ where: { id: webOrder.id }, data: { status: 'MAKING' } });
  console.log(`✅ Web Order moved to MAKING`);
  
  // Transition to Delivery
  await prisma.order.update({ where: { id: webOrder.id }, data: { status: 'OUT_FOR_DELIVERY' } });
  console.log(`✅ Web Order moved to OUT_FOR_DELIVERY`);

  // 3. Wedding Order (Vendors -> Chef -> Driver)
  console.log("\n--- Scenario 3: Wedding Order (Multi-Vendor) ---");
  const weddingPayload = {
    branchId: branch.id,
    customerId: customer.id,
    items: [
      { productId: product.id, quantity: 1, weight: 10, price: 15000, productName: 'Wedding Cake Tier 3' },
      { productId: product.id, quantity: 50, weight: 0.1, price: 50, productName: 'Cupcakes' }
    ],
    deliveryType: 'DELIVERY',
    targetDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    paymentMethod: 'MANUAL',
    paymentType: 'ADVANCE',
    payments: [{ method: 'MANUAL', amount: 5000 }]
  };

  const weddingOrder = await StorefrontEngine.processCheckout(
    { source: 'ADMIN', branchId: branch.id, userId: 'admin-user' },
    weddingPayload as any
  );
  console.log(`✅ Wedding Order Created: ${weddingOrder.orderNumber}`);

  // Assign Vendor
  const vendor = await prisma.user.findFirst({ where: { role: 'VENDOR_FLORIST' } });
  if (vendor) {
    const orderItem = await prisma.orderItem.findFirst({ where: { orderId: weddingOrder.id } });
    if (orderItem) {
      await prisma.orderItem.update({
        where: { id: orderItem.id },
        data: { assignedVendor: { connect: { id: vendor.id } }, isBlocked: true }
      });
      console.log(`✅ Vendor assigned to Order Item ${orderItem.id}`);
    }
    console.log(`✅ Vendor Task Assigned to ${vendor.name}`);
  }

  console.log("\n🎉 Stage 8 Real Bakery Simulation completed successfully!");
}

runSimulation()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
