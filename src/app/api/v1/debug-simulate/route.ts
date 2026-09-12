export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OrderTransitionService } from '@/services/OrderTransitionService'
import { FinancialService } from '@/services/FinancialService'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// We'll run the simulation in the background so the API returns immediately.
async function runSimulation(orderId: string) {
  console.log("==========================================");
  console.log(`🧑‍🍳 SIMULATION STARTED FOR ORDER ${orderId} 🚗`);
  console.log("==========================================");

  try {
    const users = await prisma.user.findMany();
    const sales = users.find(u => u.role === 'SALESPERSON' || u.role === 'ADMIN');
    const chef = users.find(u => u.role === 'CHEF' || u.role === 'ADMIN');
    const driver = users.find(u => u.role === 'DELIVERY' || u.role === 'ADMIN');

    if (!sales || !chef || !driver) {
      console.error("Missing required staff members in DB for simulation!");
      return;
    }

    let order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    // --- 1. SALESPERSON: Approve NEW orders ---
    if (order.status === 'NEW') {
      console.log(`[SALES] 📝 Found new order ${order.orderNumber}. Approving...`);
      await sleep(3000);
      await OrderTransitionService.transitionState({
        orderId: order.id,
        action: 'approve',
        actorId: sales.id,
        appRole: 'SALESPERSON',
        branchId: order.branchId,
      });
      console.log(`[SALES] ✅ Order ${order.orderNumber} sent to kitchen.`);
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }
    if (!order) return;

    // --- 2. CHEF: Accept WAITING_FOR_CHEF orders ---
    if (order.status === 'WAITING_FOR_CHEF') {
      console.log(`[CHEF] 👨‍🍳 Chef sees order ${order.orderNumber}. Accepting...`);
      await sleep(4000);
      await OrderTransitionService.transitionState({
        orderId: order.id,
        action: 'chef-accept',
        actorId: chef.id,
        appRole: 'CHEF',
        branchId: order.branchId,
      });
      console.log(`[CHEF] ✅ Chef accepted order ${order.orderNumber}.`);
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }
    if (!order) return;

    // --- 3. CHEF: Start Making ---
    if (order.status === 'CHEF_ACCEPTED') {
      console.log(`[CHEF] 🥣 Starting to bake order ${order.orderNumber}...`);
      await sleep(5000);
      await OrderTransitionService.transitionState({
        orderId: order.id,
        action: 'start-making',
        actorId: chef.id,
        appRole: 'CHEF',
        branchId: order.branchId,
      });
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }
    if (!order) return;

    // --- 4. CHEF: Start Decorating ---
    if (order.status === 'MAKING') {
      console.log(`[CHEF] 🎨 Decorating order ${order.orderNumber}...`);
      await sleep(6000);
      await OrderTransitionService.transitionState({
        orderId: order.id,
        action: 'start-decorating',
        actorId: chef.id,
        appRole: 'CHEF',
        branchId: order.branchId,
      });
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }
    if (!order) return;

    // --- 5. CHEF: Mark Ready ---
    if (order.status === 'DECORATING') {
      console.log(`[CHEF] ✨ Finishing touches on order ${order.orderNumber}... Marking READY!`);
      await sleep(5000);
      await OrderTransitionService.transitionState({
        orderId: order.id,
        action: 'ready',
        actorId: chef.id,
        appRole: 'CHEF',
        branchId: order.branchId,
      });
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }
    if (!order) return;

    // --- 6. SYSTEM/ADMIN: Assign Driver (for DELIVERY) ---
    if (order.status === 'PENDING_ASSIGNMENT' && order.deliveryType === 'DELIVERY') {
      console.log(`[SYSTEM] 🔍 Looking for available driver for order ${order.orderNumber}...`);
      await sleep(3000);
      
      await prisma.order.update({
        where: { id: order.id },
        data: { driverId: driver.id }
      });

      await OrderTransitionService.transitionState({
        orderId: order.id,
        action: 'assign-driver',
        actorId: driver.id,
        appRole: 'DELIVERY',
        branchId: order.branchId,
      });
      console.log(`[SYSTEM] 🛵 Assigned driver to order ${order.orderNumber}.`);
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }
    if (!order) return;

    // --- 7. DRIVER: Pick up order ---
    if (order.status === 'ASSIGNED_TO_DRIVER') {
      console.log(`[DRIVER] 🏃‍♂️ Picking up order ${order.orderNumber}...`);
      await sleep(5000);
      await OrderTransitionService.transitionState({
        orderId: order.id,
        action: 'pick-up',
        actorId: driver.id,
        appRole: 'DELIVERY',
        branchId: order.branchId,
      });
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }
    if (!order) return;

    // --- 8. DRIVER: On the way ---
    if (order.status === 'PICKED_UP') {
      console.log(`[DRIVER] 🗺️ Heading to destination for order ${order.orderNumber}...`);
      await sleep(6000);
      await OrderTransitionService.transitionState({
        orderId: order.id,
        action: 'on-the-way',
        actorId: driver.id,
        appRole: 'DELIVERY',
        branchId: order.branchId,
      });
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }
    if (!order) return;

    // --- 9. DRIVER: Deliver ---
    if (order.status === 'ON_THE_WAY') {
      console.log(`[DRIVER] 🏠 Arrived at destination for order ${order.orderNumber}. Handing over...`);
      await sleep(6000);
      
      const finSummary = await FinancialService.calculateFinancialSummary(order.id);
      if (finSummary.outstandingAmount > 0) {
        console.log(`[DRIVER] 💰 Collecting Cash on Delivery: ₹${finSummary.outstandingAmount}`);
        await FinancialService.recordLedgerEntry({
          orderId: order.id,
          type: 'PAYMENT',
          amount: finSummary.outstandingAmount,
          method: 'CASH',
          actorId: driver.id,
          role: 'DELIVERY'
        });
        await sleep(3000);
      }

      await OrderTransitionService.transitionState({
        orderId: order.id,
        action: 'deliver',
        actorId: driver.id,
        appRole: 'DELIVERY',
        branchId: order.branchId,
      });
      console.log(`[DRIVER] 🎉 Order ${order.orderNumber} successfully delivered!`);
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }
    if (!order) return;

    // --- 10. SYSTEM: Complete Delivery (Auto-completed by sales usually, but let's automate) ---
    if (order.status === 'DELIVERED') {
      await sleep(3000);
      await OrderTransitionService.transitionState({
        orderId: order.id,
        action: 'complete',
        actorId: sales.id,
        appRole: 'SALESPERSON',
        branchId: order.branchId,
      });
      console.log(`[SYSTEM] 🎊 Order ${order.orderNumber} COMPLETED.`);
    }

    // --- 11. SALES: Complete Pickup ---
    if (order.status === 'READY_FOR_PICKUP' && order.deliveryType === 'PICKUP') {
      console.log(`[SALES] 🧍 Customer arrived for pickup of order ${order.orderNumber}...`);
      await sleep(8000);

      const finSummary = await FinancialService.calculateFinancialSummary(order.id);
      if (finSummary.outstandingAmount > 0) {
        console.log(`[SALES] 💰 Collecting pending balance: ₹${finSummary.outstandingAmount}`);
        await FinancialService.recordLedgerEntry({
          orderId: order.id,
          type: 'PAYMENT',
          amount: finSummary.outstandingAmount,
          method: 'CASH',
          actorId: sales.id,
          role: 'SALESPERSON'
        });
        await sleep(2000);
      }

      await OrderTransitionService.transitionState({
        orderId: order.id,
        action: 'complete',
        actorId: sales.id,
        appRole: 'SALESPERSON',
        branchId: order.branchId,
      });
      console.log(`[SALES] 🎊 Pickup Order ${order.orderNumber} COMPLETED.`);
    }

  } catch (err: any) {
    console.error(`[SIMULATION ERROR] ${err.message}`);
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const orderId = url.searchParams.get('orderId')
    
    if (orderId) {
      runSimulation(orderId).catch(console.error);
      return NextResponse.json({ success: true, message: `Simulation started for ${orderId}` });
    }

    // Auto-discovery mode: find all NEW orders that aren't simulated yet
    const newOrders = await prisma.order.findMany({
      where: { status: 'NEW' },
      select: { id: true, orderNumber: true }
    });

    if (newOrders.length === 0) {
      return NextResponse.json({ success: true, message: 'No NEW orders found to simulate.' });
    }

    let startedCount = 0;
    for (const order of newOrders) {
      // Very basic deduplication check if it was recently updated (so we don't start it twice)
      // Actually we will just start it, and the script checks if status is NEW before starting, so it will only run once.
      runSimulation(order.id).catch(console.error);
      startedCount++;
    }

    return NextResponse.json({ success: true, message: `Started ${startedCount} new simulations!` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
