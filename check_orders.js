const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function run() { 
  const orders = await prisma.order.findMany({ 
    where: { deliveryType: 'DELIVERY' }, 
    select: { id: true, orderNumber: true, status: true, branchId: true } 
  }); 
  console.log("PENDING:", orders.filter(o => !['COMPLETED', 'DELIVERED', 'CANCELLED', 'ASSIGNED_TO_DRIVER', 'PICKED_UP', 'ON_THE_WAY'].includes(o.status))); 
} 
run().finally(() => prisma.$disconnect());
