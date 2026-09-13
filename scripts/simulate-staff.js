const { PrismaClient } = require('@prisma/client');
const { OrderTransitionService } = require('../src/services/OrderTransitionService');
const { FinancialService } = require('../src/services/FinancialService');

const prisma = new PrismaClient();

// Helper to delay execution to make the simulation look realistic
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getStaffMembers() {
  const users = await prisma.user.findMany();
  return {
    sales: users.find(u => u.role === 'SALESPERSON' || u.role === 'ADMIN'),
    chef: users.find(u => u.role === 'CHEF' || u.role === 'ADMIN'),
    driver: users.find(u => u.role === 'DELIVERY' || u.role === 'ADMIN'),
    vendors: users.filter(u => u.role.startsWith('VENDOR')),
  };
}

async function simulate() {
  console.log("==========================================");
  console.log("🧑‍🍳 BAKERY STAFF SIMULATOR ACTIVATED 🚗");
  console.log("==========================================");
  console.log("Waiting for new orders... (Go place an order!)");

  const staff = await getStaffMembers();
  if (!staff.sales || !staff.chef || !staff.driver) {
    console.error("Missing required staff members in DB for simulation!");
    process.exit(1);
  }

  while (true) {
    try {
      // Find all active orders that need attention
      const activeOrders = await prisma.order.findMany({
        where: {
          status: {
            notIn: ['COMPLETED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
          }
        }
      });

      for (const order of activeOrders) {
        // --- 1. SALESPERSON: Approve NEW orders ---
        if (order.status === 'NEW') {
          console.log(`[SALES] 📝 Found new order ${order.orderNumber}. Approving...`);
          await sleep(2000);
          await OrderTransitionService.transitionState({
            orderId: order.id,
            action: 'approve',
            actorId: staff.sales.id,
            appRole: 'SALESPERSON',
            branchId: order.branchId,
          });
          console.log(`[SALES] ✅ Order ${order.orderNumber} sent to kitchen.`);
        }

        // --- 2. CHEF: Accept WAITING_FOR_CHEF orders ---
        if (order.status === 'WAITING_FOR_CHEF') {
          console.log(`[CHEF] 👨‍🍳 Chef sees order ${order.orderNumber}. Accepting...`);
          await sleep(3000);
          await OrderTransitionService.transitionState({
            orderId: order.id,
            action: 'chef-accept',
            actorId: staff.chef.id,
            appRole: 'CHEF',
            branchId: order.branchId,
          });
          console.log(`[CHEF] ✅ Chef accepted order ${order.orderNumber}.`);
        }

        // --- 3. CHEF: Start Making ---
        if (order.status === 'CHEF_ACCEPTED') {
          console.log(`[CHEF] 🥣 Starting to bake order ${order.orderNumber}...`);
          await sleep(4000);
          await OrderTransitionService.transitionState({
            orderId: order.id,
            action: 'start-making',
            actorId: staff.chef.id,
            appRole: 'CHEF',
            branchId: order.branchId,
          });
        }

        // --- 4. CHEF: Start Decorating ---
        if (order.status === 'MAKING') {
          console.log(`[CHEF] 🎨 Decorating order ${order.orderNumber}...`);
          await sleep(5000);
          await OrderTransitionService.transitionState({
            orderId: order.id,
            action: 'start-decorating',
            actorId: staff.chef.id,
            appRole: 'CHEF',
            branchId: order.branchId,
          });
        }

        // --- 5. CHEF: Mark Ready ---
        if (order.status === 'DECORATING') {
          console.log(`[CHEF] ✨ Finishing touches on order ${order.orderNumber}... Marking READY!`);
          await sleep(4000);
          await OrderTransitionService.transitionState({
            orderId: order.id,
            action: 'ready',
            actorId: staff.chef.id,
            appRole: 'CHEF',
            branchId: order.branchId,
          });
        }

        // --- 6. SYSTEM/ADMIN: Assign Driver (for DELIVERY) ---
        if (order.status === 'PENDING_ASSIGNMENT' && order.deliveryType === 'DELIVERY') {
          console.log(`[SYSTEM] 🔍 Looking for available driver for order ${order.orderNumber}...`);
          await sleep(2000);
          
          // Actually, we must assign the driver ID in the DB first, then transition.
          await prisma.order.update({
            where: { id: order.id },
            data: { driverId: staff.driver.id }
          });

          await OrderTransitionService.transitionState({
            orderId: order.id,
            action: 'assign-driver',
            actorId: staff.driver.id,
            appRole: 'DELIVERY',
            branchId: order.branchId,
          });
          console.log(`[SYSTEM] 🛵 Assigned driver to order ${order.orderNumber}.`);
        }

        // --- 7. DRIVER: Pick up order ---
        if (order.status === 'ASSIGNED_TO_DRIVER') {
          console.log(`[DRIVER] 🏃‍♂️ Picking up order ${order.orderNumber}...`);
          await sleep(3000);
          await OrderTransitionService.transitionState({
            orderId: order.id,
            action: 'pick-up',
            actorId: staff.driver.id,
            appRole: 'DELIVERY',
            branchId: order.branchId,
          });
        }

        // --- 8. DRIVER: On the way ---
        if (order.status === 'PICKED_UP') {
          console.log(`[DRIVER] 🗺️ Heading to destination for order ${order.orderNumber}...`);
          await sleep(3000);
          await OrderTransitionService.transitionState({
            orderId: order.id,
            action: 'on-the-way',
            actorId: staff.driver.id,
            appRole: 'DELIVERY',
            branchId: order.branchId,
          });
        }

        // --- 9. DRIVER: Deliver ---
        if (order.status === 'ON_THE_WAY') {
          console.log(`[DRIVER] 🏠 Arrived at destination for order ${order.orderNumber}. Handing over...`);
          await sleep(5000);
          
          // Before delivering, collect payment if pending balance > 0
          const finSummary = await FinancialService.calculateFinancialSummary(order.id);
          if (finSummary.outstandingAmount > 0) {
            console.log(`[DRIVER] 💰 Collecting Cash on Delivery: ₹${finSummary.outstandingAmount}`);
            await FinancialService.recordLedgerEntry({
              orderId: order.id,
              type: 'PAYMENT',
              amount: finSummary.outstandingAmount,
              method: 'CASH',
              actorId: staff.driver.id,
              role: 'DELIVERY'
            });
            await sleep(2000);
          }

          await OrderTransitionService.transitionState({
            orderId: order.id,
            action: 'deliver',
            actorId: staff.driver.id,
            appRole: 'DELIVERY',
            branchId: order.branchId,
          });
          console.log(`[DRIVER] 🎉 Order ${order.orderNumber} successfully delivered!`);
        }

        // --- 10. SYSTEM: Complete Delivery (Auto-completed by sales usually, but let's automate) ---
        if (order.status === 'DELIVERED') {
          await sleep(1000);
          await OrderTransitionService.transitionState({
            orderId: order.id,
            action: 'complete',
            actorId: staff.sales.id,
            appRole: 'SALESPERSON',
            branchId: order.branchId,
          });
          console.log(`[SYSTEM] 🎊 Order ${order.orderNumber} COMPLETED.`);
        }

        // --- 11. SALES: Complete Pickup ---
        if (order.status === 'READY_FOR_PICKUP' && order.deliveryType === 'PICKUP') {
          console.log(`[SALES] 🧍 Customer arrived for pickup of order ${order.orderNumber}...`);
          await sleep(5000);

          const finSummary = await FinancialService.calculateFinancialSummary(order.id);
          if (finSummary.outstandingAmount > 0) {
            console.log(`[SALES] 💰 Collecting pending balance: ₹${finSummary.outstandingAmount}`);
            // This will auto-trigger the handover because of the logic we just added!
            // Wait, our logic was added to the NextJS API route, not the FinancialService.
            // So we need to call transitionState manually here.
            await FinancialService.recordLedgerEntry({
              orderId: order.id,
              type: 'PAYMENT',
              amount: finSummary.outstandingAmount,
              method: 'CASH',
              actorId: staff.sales.id,
              role: 'SALESPERSON'
            });
            await sleep(2000);
          }

          await OrderTransitionService.transitionState({
            orderId: order.id,
            action: 'complete',
            actorId: staff.sales.id,
            appRole: 'SALESPERSON',
            branchId: order.branchId,
          });
          console.log(`[SALES] 🎊 Pickup Order ${order.orderNumber} COMPLETED.`);
        }

      }
    } catch (err) {
      // Ignore transition errors for now (e.g. if another simulation loop caught it)
    }

    // Wait 3 seconds before next poll
    await sleep(3000);
  }
}

simulate().catch(console.error);
