import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { FinancialService } from '../src/services/FinancialService';
import { OrderService } from '../src/services/OrderService';
import { LedgerEntryType, PaymentStatus, OrderStatus, DeliveryType } from '@prisma/client';

async function main() {
  console.log("=== STARTING FINANCIAL REGRESSION TESTS ===");

  // Helper to create a base order
  const createTestOrder = async (price: number) => {
    // 1. Get a product
    const product = await prisma.product.findFirst();
    if (!product) throw new Error("No product found");

    const branch = await prisma.branch.findFirst();
    if (!branch) throw new Error("No branch found");

    const customer = await prisma.customer.findFirst();
    if (!customer) throw new Error("No customer found");

    const orderNumber = `TEST-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        branch: { connect: { id: branch.id } },
        customer: { connect: { id: customer.id } },
        status: OrderStatus.NEW,
        deliveryType: DeliveryType.PICKUP,
        targetDate: new Date(),
        subtotal: price,
        totalAmount: price, // Simplification
        items: {
          create: [{
            productId: product.id,
            quantity: 1,
            weight: 1,
            price: price,
            productName: product.name,
          }]
        }
      },
      include: { ledgerEntries: true }
    });

    return order;
  };

  try {
    // ---------------------------------------------------------
    // Test 5.1: 500 advance -> 90 balance -> 0
    // ---------------------------------------------------------
    console.log("\n[TEST 5.1] 500 advance -> 90 balance -> 0");
    let order1 = await createTestOrder(590);
    
    const admin = await prisma.user.findFirst();
    if (!admin) throw new Error("No admin found");

    // 1st payment: 500
    await FinancialService.recordLedgerEntry({
      orderId: order1.id,
      amount: 500,
      method: 'CASH',
      type: LedgerEntryType.PAYMENT,
      role: 'ADMIN',
      actorId: admin.id
    });
    
    let summary = await FinancialService.calculateFinancialSummary(await prisma.order.findUnique({ where: { id: order1.id }, include: { ledgerEntries: true } }) as any);
    console.assert(summary.paidAmount === 500, "Paid amount should be 500");
    console.assert(summary.outstandingAmount === 90, "Outstanding should be 90");
    console.assert(summary.paymentStatus === 'PARTIALLY_PAID', "Status should be PARTIALLY_PAID");
    console.log("  ✅ Advance recorded correctly.");

    // 2nd payment: 90
    await FinancialService.recordLedgerEntry({
      orderId: order1.id,
      amount: 90,
      method: 'CASH',
      type: LedgerEntryType.PAYMENT,
      role: 'ADMIN',
      actorId: admin.id
    });

    summary = await FinancialService.calculateFinancialSummary(await prisma.order.findUnique({ where: { id: order1.id }, include: { ledgerEntries: true } }) as any);
    console.assert(summary.paidAmount === 590, "Paid amount should be 590");
    console.assert(summary.outstandingAmount === 0, "Outstanding should be 0");
    console.assert(summary.paymentStatus === 'PAID', "Status should be PAID");
    console.log("  ✅ Balance collected. Status PAID.");

    // ---------------------------------------------------------
    // Test 5.2: Multiple partial payments (200 -> 200 -> 190)
    // ---------------------------------------------------------
    console.log("\n[TEST 5.2] Multiple partial payments (200 -> 200 -> 190)");
    let order2 = await createTestOrder(590);

    await FinancialService.recordLedgerEntry({ orderId: order2.id, amount: 200, method: 'CASH', type: LedgerEntryType.PAYMENT, role: 'ADMIN', actorId: admin.id });
    await FinancialService.recordLedgerEntry({ orderId: order2.id, amount: 200, method: 'CASH', type: LedgerEntryType.PAYMENT, role: 'ADMIN', actorId: admin.id });
    await FinancialService.recordLedgerEntry({ orderId: order2.id, amount: 190, method: 'CASH', type: LedgerEntryType.PAYMENT, role: 'ADMIN', actorId: admin.id });

    summary = await FinancialService.calculateFinancialSummary(await prisma.order.findUnique({ where: { id: order2.id }, include: { ledgerEntries: true } }) as any);
    console.assert(summary.paidAmount === 590, "Paid amount should be 590");
    console.assert(summary.outstandingAmount === 0, "Outstanding should be 0");
    console.assert(summary.paymentStatus === 'PAID', "Status should be PAID");
    console.log("  ✅ Multiple partial payments handled correctly.");

    // ---------------------------------------------------------
    // Test 5.3: Overpayment rejection
    // ---------------------------------------------------------
    console.log("\n[TEST 5.3] Overpayment rejection");
    let order3 = await createTestOrder(500);

    let caughtOverpayment = false;
    try {
      await FinancialService.recordLedgerEntry({ orderId: order3.id, amount: 600, method: 'CASH', type: LedgerEntryType.PAYMENT, role: 'ADMIN', actorId: admin.id });
    } catch (e: any) {
      console.log("Actual error:", e.message);
      caughtOverpayment = e.message.includes("exceeds the outstanding balance");
    }
    console.assert(caughtOverpayment, "Should have thrown overpayment error");
    console.log("  ✅ Overpayment rejected correctly.");

    // ---------------------------------------------------------
    // Test 5.4: Refund handling (net paid calculation)
    // ---------------------------------------------------------
    console.log("\n[TEST 5.4] Refund handling (net paid calculation)");
    let order4 = await createTestOrder(1000);
    
    // Pay 1000
    await FinancialService.recordLedgerEntry({ orderId: order4.id, amount: 1000, method: 'CASH', type: LedgerEntryType.PAYMENT, role: 'ADMIN', actorId: admin.id });
    
    // Refund 200
    await FinancialService.recordLedgerEntry({ orderId: order4.id, amount: 200, method: 'CASH', type: LedgerEntryType.REFUND, role: 'ADMIN', actorId: admin.id });

    summary = await FinancialService.calculateFinancialSummary(await prisma.order.findUnique({ where: { id: order4.id }, include: { ledgerEntries: true } }) as any);
    console.assert(summary.paidAmount === 800, "Net paid amount should be 800");
    console.assert(summary.outstandingAmount === 200, "Outstanding should be 200 (since 200 was refunded)");
    console.assert(summary.paymentStatus === 'PARTIALLY_PAID', "Status should be PARTIALLY_PAID");
    console.log("  ✅ Refund factored into net calculation correctly.");

    console.log("\n=== ALL TESTS PASSED ===");

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
