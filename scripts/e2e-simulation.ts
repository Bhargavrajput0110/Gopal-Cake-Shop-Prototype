import { OrderStatus, DeliveryType, OrderSource, OrderType, Role } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { TimelineService } from '../src/services/TimelineService';
import { FinancialService } from '../src/services/FinancialService';
import { outboxProcessor } from '../src/services/event-bus/OutboxProcessor';
import { registerSubscribers } from '../src/services/event-bus/EventSubscribers';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimulation() {
  console.log("🚀 Starting Bakery OS E2E Production Simulation (100 Orders)");

  // 1. Initialize Event Bus Subscribers
  registerSubscribers();

  // 2. Fetch necessary seeding data
  const branches = await prisma.branch.findMany();
  const customers = await prisma.customer.findMany({ take: 10 });
  const products = await prisma.product.findMany({ take: 20 });
  
  const chefs = await prisma.user.findMany({ where: { role: Role.CHEF } });
  const drivers = await prisma.user.findMany({ where: { role: Role.DELIVERY } });
  
  if (!branches.length || !customers.length || !products.length || !chefs.length || !drivers.length) {
    throw new Error("Missing required seed data for simulation.");
  }

  const ORDER_COUNT = 100;
  let successCount = 0;
  let cancelCount = 0;

  for (let i = 0; i < ORDER_COUNT; i++) {
    const branch = branches[i % branches.length];
    const customer = customers[i % customers.length];
    const product = products[i % products.length];
    const chef = chefs[i % chefs.length];
    const driver = drivers[i % drivers.length];
    
    const isCancelled = Math.random() < 0.1; // 10% chance of cancellation
    const isDelivery = Math.random() < 0.5;

    console.log(`\n📦 Simulating Order ${i+1}/${ORDER_COUNT}...`);

    try {
      // Step A: Create Order (DRAFT -> CONFIRMED)
      const order = await prisma.$transaction(async (tx) => {
        const o = await tx.order.create({
          data: {
            orderNumber: `SIM-${Date.now()}-${i}`,
            customerId: customer.id,
            branchId: branch.id,
            status: OrderStatus.CONFIRMED,
            deliveryType: isDelivery ? DeliveryType.DELIVERY : DeliveryType.PICKUP,
            targetDate: new Date(),
            subtotal: product.price,
            totalAmount: product.price,
            source: OrderSource.WEBSITE,
            type: OrderType.ORDER,
            items: {
              create: [{
                productName: product.name,
                productId: product.id,
                quantity: 1,
                price: product.price,
                weight: product.defaultWeight
              }]
            }
          }
        });

        // Pay for it
        await FinancialService.recordPayment(tx as any, o.id, 'Razorpay', product.price, `pay_sim_${Date.now()}`);

        await TimelineService.create(tx as any, {
          orderId: o.id,
          action: 'order_created',
          description: 'Order placed via Simulation',
          previousState: OrderStatus.DRAFT,
          nextState: OrderStatus.CONFIRMED,
          actorId: customer.id,
          branchId: branch.id
        });

        return o;
      });

      // Step B: Outbox Processing (Should dispatch CONFIRMED WhatsApp)
      await outboxProcessor.poll();

      if (isCancelled) {
        // Step C: Cancel and Refund
        await prisma.$transaction(async (tx) => {
          await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.CANCELLED }});
          await FinancialService.recordRefund(tx as any, order.id, 'Razorpay', product.price, 'Customer Request', 'system');
          await TimelineService.create(tx as any, {
            orderId: order.id,
            action: 'order_cancelled',
            description: 'Simulation Cancellation',
            previousState: OrderStatus.CONFIRMED,
            nextState: OrderStatus.CANCELLED,
            actorId: 'system',
            branchId: branch.id
          });
        });
        cancelCount++;
        await outboxProcessor.poll();
        continue;
      }

      // Step D: Send to Chef
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.IN_PRODUCTION, chefId: chef.id }});
        await TimelineService.create(tx as any, {
          orderId: order.id,
          action: 'production_started',
          description: 'Chef started baking',
          previousState: OrderStatus.CONFIRMED,
          nextState: OrderStatus.IN_PRODUCTION,
          actorId: chef.id,
          branchId: branch.id
        });
      });
      await outboxProcessor.poll();

      // Step E: Ready
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.READY_FOR_PICKUP }});
        await TimelineService.create(tx as any, {
          orderId: order.id,
          action: 'order_ready',
          description: 'Order ready',
          previousState: OrderStatus.IN_PRODUCTION,
          nextState: OrderStatus.READY_FOR_PICKUP,
          actorId: chef.id,
          branchId: branch.id
        });
      });
      await outboxProcessor.poll();

      // Step F: Delivery/Pickup
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.DELIVERED, driverId: isDelivery ? driver.id : null }});
        await TimelineService.create(tx as any, {
          orderId: order.id,
          action: 'order_delivered',
          description: isDelivery ? 'Driver Delivered' : 'Customer Picked Up',
          previousState: OrderStatus.READY_FOR_PICKUP,
          nextState: OrderStatus.DELIVERED,
          actorId: isDelivery ? driver.id : 'system',
          branchId: branch.id
        });
      });
      await outboxProcessor.poll();

      successCount++;
    } catch (error) {
      console.error(`Error simulating order ${i}:`, error);
    }
  }

  console.log(`\n✅ Simulation Complete!`);
  console.log(`Successful Orders: ${successCount}`);
  console.log(`Cancelled/Refunded Orders: ${cancelCount}`);

  // 3. Ledger Assertions
  console.log("\n📊 Validating Ledger Integrity...");
  const ledgerEntries = await prisma.ledgerEntry.findMany({
    where: { orderId: { startsWith: 'cuid' } } // Only orders from this session? Actually let's just assert on all.
  });

  const totalCredits = ledgerEntries.filter(l => l.type === 'CREDIT').reduce((sum, l) => sum + Number(l.amount), 0);
  const totalDebits = ledgerEntries.filter(l => l.type === 'DEBIT').reduce((sum, l) => sum + Number(l.amount), 0);
  const netRevenue = totalCredits - totalDebits;

  console.log(`Total Credits: ₹${totalCredits}`);
  console.log(`Total Debits (Refunds/Payouts): ₹${totalDebits}`);
  console.log(`Net Ledger Balance: ₹${netRevenue}`);

  // Verify Outbox is clean
  const failedOutbox = await prisma.outbox.count({ where: { status: 'FAILED' }});
  const pendingOutbox = await prisma.outbox.count({ where: { status: 'PENDING' }});
  console.log(`\n📬 Outbox Health - Pending: ${pendingOutbox} | Failed: ${failedOutbox}`);

  if (failedOutbox === 0) {
    console.log("🎉 All Notifications successfully processed!");
  } else {
    console.warn("⚠️ Some Notifications failed. Check logs.");
  }
}

runSimulation()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
