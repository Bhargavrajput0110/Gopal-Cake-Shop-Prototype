const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

const realOrderIds = [
  'cmtltnssy000v4gu3tvayq4sy', // Venom Cake - Warasiya (fix to ₹15000)
  'cmtlvf3zi00244gu3souzrioi', // Custom Cake - Ellora Park (QUOTE_DRAFT)
];

async function main() {
  console.log('Step 1: Fixing Venom Cake price to 15000...');
  await prisma.$executeRawUnsafe(
    `UPDATE "Order" SET "totalAmount" = 15000 WHERE id = 'cmtltnssy000v4gu3tvayq4sy'`
  );
  await prisma.$executeRawUnsafe(
    `UPDATE "OrderItem" SET "price" = 15000 WHERE "orderId" = 'cmtltnssy000v4gu3tvayq4sy'`
  );
  console.log('✅ Venom Cake price fixed to ₹15000');

  const placeholders = realOrderIds.map((id, i) => `$${i + 1}`).join(', ');

  console.log('Step 2: Deleting child records...');
  await prisma.$executeRawUnsafe(`DELETE FROM "DeliveryAssignment" WHERE "orderId" NOT IN (${placeholders})`, ...realOrderIds).catch(e => console.log('DeliveryAssignment:', e.message));
  await prisma.$executeRawUnsafe(`DELETE FROM "VendorTask" WHERE "orderId" NOT IN (${placeholders})`, ...realOrderIds).catch(e => console.log('VendorTask:', e.message));
  await prisma.$executeRawUnsafe(`DELETE FROM "KitchenNote" WHERE "orderId" NOT IN (${placeholders})`, ...realOrderIds).catch(e => console.log('KitchenNote:', e.message));
  await prisma.$executeRawUnsafe(`DELETE FROM "QCRecord" WHERE "orderId" NOT IN (${placeholders})`, ...realOrderIds).catch(e => console.log('QCRecord:', e.message));
  await prisma.$executeRawUnsafe(`DELETE FROM "Timeline" WHERE "orderId" NOT IN (${placeholders})`, ...realOrderIds).catch(e => console.log('Timeline:', e.message));
  await prisma.$executeRawUnsafe(`DELETE FROM "NotificationLog" WHERE "orderId" NOT IN (${placeholders})`, ...realOrderIds).catch(e => console.log('NotificationLog:', e.message));
  await prisma.$executeRawUnsafe(`DELETE FROM "InAppNotification" WHERE "orderId" NOT IN (${placeholders}) AND "orderId" IS NOT NULL`, ...realOrderIds).catch(e => console.log('InAppNotification:', e.message));
  await prisma.$executeRawUnsafe(`DELETE FROM "AuditLog" WHERE "orderId" NOT IN (${placeholders}) AND "orderId" IS NOT NULL`, ...realOrderIds).catch(e => console.log('AuditLog:', e.message));
  await prisma.$executeRawUnsafe(`DELETE FROM "Outbox" WHERE "orderId" NOT IN (${placeholders}) AND "orderId" IS NOT NULL`, ...realOrderIds).catch(e => console.log('Outbox:', e.message));
  await prisma.$executeRawUnsafe(`DELETE FROM "Payment" WHERE "orderId" NOT IN (${placeholders})`, ...realOrderIds).catch(e => console.log('Payment:', e.message));
  await prisma.$executeRawUnsafe(`DELETE FROM "OrderItemMedia" WHERE "orderItemId" IN (SELECT id FROM "OrderItem" WHERE "orderId" NOT IN (${placeholders}))`, ...realOrderIds).catch(e => console.log('OrderItemMedia:', e.message));
  await prisma.$executeRawUnsafe(`DELETE FROM "OrderItem" WHERE "orderId" NOT IN (${placeholders})`, ...realOrderIds).catch(e => console.log('OrderItem:', e.message));

  console.log('Step 3: Deleting fake orders...');
  const result = await prisma.$executeRawUnsafe(`DELETE FROM "Order" WHERE id NOT IN (${placeholders})`, ...realOrderIds);
  console.log(`✅ Deleted ${result} fake orders`);

  console.log('\nStep 4: Verifying remaining orders...');
  const remaining = await prisma.$queryRawUnsafe(`
    SELECT o."orderNumber", o.status, o."totalAmount", b.name as branch,
           c.name as customer
    FROM "Order" o
    LEFT JOIN "Branch" b ON o."branchId" = b.id
    LEFT JOIN "Customer" c ON o."customerId" = c.id
  `);
  console.log('Remaining orders:', JSON.stringify(remaining, null, 2));
}

main()
  .catch(e => console.error('FATAL:', e.message))
  .finally(() => prisma.$disconnect());
