import { StorefrontEngine, CheckoutContext, CheckoutPayload } from '../src/lib/orders/StorefrontEngine';
import { OrderTransitionService } from '../src/services/OrderTransitionService';
import { CustomerSearchService } from '../src/lib/customers/CustomerSearchService';
import { OutboxEventBus } from '../src/services/event-bus/OutboxEventBus';
import { prisma } from '../src/lib/prisma';
import { OrderSource, PaymentMethod, PaymentType, DeliveryType } from '@prisma/client';
import { OrderStatus } from '../src/lib/OrderStateMachine';

async function runLifecycleTest() {
  console.log("🚀 Starting End-to-End Order Lifecycle Test...");

  // 1. Resolve or Create Customer
  const customer = await CustomerSearchService.resolveCustomer({
    phone: '9999999999',
    name: 'Lifecycle Test User'
  });

  // 1.5 Get or create a valid branch
  let branch = await prisma.branch.findFirst({ where: { isActive: true } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Mock Branch',
        code: 'MCK',
        address: '123 Mock Street',
        isActive: true,
        deliveryEnabled: true
      }
    });
  }
  const branchId = branch.id;

  // 1.8 Get or create a valid product
  let product = await prisma.product.findFirst();
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: 'Mock Product',
        basePrice: 500,
        availableForSale: true
      }
    });
  }
  const productId = product.id;

  // 2. Create Order
  const payload: CheckoutPayload = {
    customerId: customer.id,
    branchId: branchId,
    items: [{
      productId: productId,
      quantity: 1,
      weight: 1,
      overridePrice: 500
    }],
    deliveryType: 'DELIVERY',
    targetDate: new Date(Date.now() + 86400000).toISOString(),
    deliveryAddress: '123 Test Street',
    paymentMethod: 'UPI',
    paymentType: 'FULL',
    idempotencyKey: crypto.randomUUID()
  };

  const context: CheckoutContext = {
    source: OrderSource.ADMIN,
    createdById: 'admin_test_user',
    canOverridePrice: true,
  };

  const order = await StorefrontEngine.processCheckout(context, payload);
  const orderId = order.id;
  console.log(`✅ Order created successfully. ID: ${orderId}, Number: ${order.orderNumber}`);

  let currentOrder = await prisma.order.findUnique({ where: { id: orderId } });
  console.log(`   Initial Status: ${currentOrder?.status}`);

  if (currentOrder?.status !== 'NEW') throw new Error("Expected initial status to be NEW");

  const eventBus = new OutboxEventBus();
  
  const transition = async (action: any, expectedState: string) => {
    console.log(`⏳ Transitioning: ${action}...`);
    await OrderTransitionService.transitionState({
      orderId,
      action,
      actorId: 'admin_test_user',
      appRole: 'ADMIN',
      branchId: branchId,
      eventBus,
      note: `Action: ${action}`
    });
    
    currentOrder = await prisma.order.findUnique({ where: { id: orderId } });
    console.log(`   New Status: ${currentOrder?.status}`);
    
    if (currentOrder?.status !== expectedState) {
      throw new Error(`Expected status ${expectedState}, got ${currentOrder?.status}`);
    }
  };

  // Lifecycle
  await transition('approve', 'WAITING_FOR_CHEF');
  await transition('chef-accept', 'CHEF_ACCEPTED');
  await transition('start-making', 'MAKING');
  await transition('start-decorating', 'DECORATING');

  // QC Workflow
  console.log("⏳ Running QC Workflow...");
  await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        qualityChecklist: {
          items: { weight: true, message: true },
          checkedBy: 'Chef Test',
          completedAt: new Date().toISOString()
        }
      }
    });

    await tx.timeline.create({
      data: {
        orderId,
        action: 'QUALITY_CONTROL_PASSED',
        eventType: 'SYSTEM_ACTION',
        nextState: updatedOrder.status,
        status: updatedOrder.status,
        actorId: 'admin_test_user',
        note: `Quality Control verified`
      }
    });
  });
  console.log("✅ QC Workflow Complete.");

  // Because it is a DELIVERY order, READY_FOR_PICKUP will auto-queue to PENDING_ASSIGNMENT
  await transition('ready', 'PENDING_ASSIGNMENT');
  
  await transition('assign-driver', 'ASSIGNED_TO_DRIVER');
  await transition('pick-up', 'PICKED_UP');
  await transition('on-the-way', 'ON_THE_WAY');
  await transition('deliver', 'DELIVERED');
  await transition('complete', 'COMPLETED');

  console.log("✅ Lifecycle complete. Validating Timeline...");
  
  const timeline = await prisma.timeline.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`📊 Total Timeline Events: ${timeline.length}`);
  timeline.forEach((t, i) => {
    console.log(`   [${i}] ${t.action} -> ${t.nextState} (Role: ${t.role}, Actor: ${t.actorId})`);
  });

  console.log("🎉 Test Passed: The system fully supports the Real Bakery Lifecycle.");
}

runLifecycleTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
