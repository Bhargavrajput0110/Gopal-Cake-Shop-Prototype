import { prisma } from './src/lib/prisma';
import { FinancialService } from './src/services/FinancialService';

async function run() {
  console.log("Starting Advanced Financial Workflows Verification...");

  const branchId = "cmswuiiun00031su3vfrn9eq5";
  const productId = "cmsjy6omi000gtcu39fm7li8v";

  // 1. Create UNPAID Order via API
  console.log("\n--- Creating UNPAID Order ---");
  const unpaidOrderPayload = {
    idempotencyKey: `fin-${Date.now()}`,
    customer: { name: "Test User Fin", phone: "9998887775", email: "fin@test.com" },
    address: { house: "123", street: "Main", area: "Center", city: "Vadodara", pin: "390001" },
    items: [{ productId: productId, quantity: 1, weight: 1 }],
    paymentMethod: "CASH", 
    deliveryType: "DELIVERY",
    branchId: branchId,
    deliveryDate: new Date(Date.now() + 86400000).toISOString(),
  };

  const resUnpaid = await fetch('http://localhost:3000/api/v1/public/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(unpaidOrderPayload)
  });

  const unpaidJson = await resUnpaid.json();
  if (!unpaidJson.success) {
    console.error("Failed to create UNPAID order:", unpaidJson);
    process.exit(1);
  }
  console.log(`Order Created: ${unpaidJson.orderId}`);
  const orderId = unpaidJson.orderId;

  // 2. Fetch order via Prisma to get total amount
  const dbOrder = await prisma.order.findUnique({ where: { id: orderId } });
  if (!dbOrder) throw new Error("Order not found");
  const totalAmount = Number(dbOrder.totalAmount);
  console.log(`Total Amount: ${totalAmount}`);

  // 3. Record Partial Payment (50%)
  const partialAmount = totalAmount / 2;
  console.log(`\n--- Recording Partial Payment: ${partialAmount} ---`);
  
  await FinancialService.recordLedgerEntry({
    orderId,
    type: 'PAYMENT',
    amount: partialAmount,
    method: 'CASH',
    actorId: 'SYSTEM',
    role: 'ADMIN'
  });

  let summary = await FinancialService.calculateFinancialSummary(dbOrder);
  console.log("Partial Payment Financial Summary:", summary);

  // 4. Pay Remaining Balance
  console.log(`\n--- Recording Remaining Payment: ${summary.outstandingAmount} ---`);
  await FinancialService.recordLedgerEntry({
    orderId,
    type: 'PAYMENT',
    amount: summary.outstandingAmount,
    method: 'CASH',
    actorId: 'SYSTEM',
    role: 'ADMIN'
  });

  summary = await FinancialService.calculateFinancialSummary(dbOrder);
  console.log("Final Financial Summary:", summary);

  const updatedOrder = await prisma.order.findUnique({ where: { id: orderId } });
  console.log(`Final Payment Status: ${updatedOrder?.paymentStatus || 'unknown'}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
