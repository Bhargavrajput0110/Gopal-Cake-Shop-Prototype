import { prisma } from '../src/lib/prisma';

async function check() {
  const drivers = await prisma.user.findMany({ 
    where: { role: 'DELIVERY', NOT: { id: { startsWith: 'usr_' } } }, 
    select: { id: true, name: true, username: true, branchId: true } 
  }); 
  console.log('DRIVERS:', JSON.stringify(drivers, null, 2)); 
  
  const orders = await prisma.order.findMany({ 
    where: { deliveryType: 'DELIVERY', NOT: { id: { startsWith: 'ord_' } } }, 
    select: { id: true, orderNumber: true, status: true, branchId: true, driverId: true } 
  }); 
  console.log('DELIVERY ORDERS:', JSON.stringify(orders, null, 2)); 
  
  const assignments = await prisma.deliveryAssignment.findMany({ 
    select: { id: true, orderId: true, deliveryPersonId: true, status: true } 
  }); 
  console.log('DELIVERY ASSIGNMENTS:', JSON.stringify(assignments, null, 2)); 
} 

check().finally(() => prisma.$disconnect());
