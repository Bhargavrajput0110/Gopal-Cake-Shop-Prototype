const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const branch = await prisma.branch.findUnique({ where: { id: "uma" } });
    console.log("Found:", branch);
  } catch (e) {
    console.log("Error finding unique branch:", e.message);
  }

  try {
    const order = await prisma.order.create({
      data: {
        orderNumber: "TEST-123",
        customerId: "Bhargav",
        branchId: "cmswuiita00011su3977ajl1z", // valid branch CUID
        deliveryType: "PICKUP",
        targetDate: new Date(),
        subtotal: 100,
        totalAmount: 100,
      }
    });
    console.log("Order created:", order.id);
  } catch (e) {
    console.log("Error creating order with customerId 'Bhargav':", e.message);
  }
}
run().finally(() => prisma.$disconnect());
