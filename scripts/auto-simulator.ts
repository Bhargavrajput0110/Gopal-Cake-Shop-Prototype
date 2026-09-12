const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sleep = ms => new Promise(res => setTimeout(res, ms));
const activeSimulations = new Set();

async function pollOrders() {
  console.log("==========================================================");
  console.log("🤖 AUTO-SIMULATOR IS RUNNING IN THE BACKGROUND 🤖");
  console.log("Waiting for new orders on the storefront... Go order a cake!");
  console.log("==========================================================");

  while (true) {
    try {
      // Find orders that are NEW and haven't been simulated yet
      const newOrders = await prisma.order.findMany({
        where: { status: 'NEW' },
        select: { id: true, orderNumber: true }
      });

      for (const order of newOrders) {
        if (!activeSimulations.has(order.id)) {
          activeSimulations.add(order.id);
          console.log(`\n🎉 New order detected! [${order.orderNumber}]`);
          console.log(`🚀 Dispatching automated bakery staff to handle it...`);
          
          // Trigger the simulation API route
          fetch(`http://localhost:3030/api/v1/debug-simulate?orderId=${order.id}`)
            .then(res => res.json())
            .then(data => {
              if (data.error) console.error(`[SIMULATOR ERROR]`, data.error);
            })
            .catch(err => console.error(`[FETCH ERROR]`, err.message));
        }
      }
    } catch (err) {
      console.error("Polling error:", err.message);
    }
    
    // Check every 3 seconds
    await sleep(3000);
  }
}

pollOrders().catch(console.error);
