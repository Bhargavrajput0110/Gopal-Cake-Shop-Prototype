import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withApiHandler } from '@/lib/withApiHandler'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

const AssignDeliverySchema = z.object({
  deliveryPersonId: z.string().min(1, 'Delivery person ID is required'),
})

export const POST = withApiHandler(async ({ req, params, appRole, user, branchId }) => {
  const { id: orderId } = params;

  // Verify the user has permission to assign deliveries
  if (!appRole || !['ADMIN', 'MANAGER'].includes(appRole)) {
    return NextResponse.json({ error: 'Forbidden. Only ADMIN or MANAGER can assign deliveries.' }, { status: 403 });
  }

  const body = await req.json();
  const parseResult = AssignDeliverySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parseResult.error }, { status: 400 });
  }

  const { deliveryPersonId } = parseResult.data;

  const db = prisma;

  // 1. Verify the order exists and is a DELIVERY order
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { branch: true }
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.deliveryType !== 'DELIVERY') {
    return NextResponse.json({ error: 'Order is not a DELIVERY order' }, { status: 400 });
  }

  // 2. Verify fulfillment branch is UMA
  if (order.branch.code !== 'UMA' && !order.branch.name.toLowerCase().includes('uma')) {
    return NextResponse.json({ error: 'Fulfillment branch must be UMA for deliveries' }, { status: 400 });
  }

  // 3. Verify selected delivery person exists and has DELIVERY capability
  const deliveryPerson = await db.user.findUnique({
    where: { id: deliveryPersonId },
    include: { branch: true }
  });

  if (!deliveryPerson) {
    return NextResponse.json({ error: 'Delivery person not found' }, { status: 404 });
  }

  if (deliveryPerson.role !== 'DELIVERY') {
    return NextResponse.json({ error: 'Selected user does not have the DELIVERY role' }, { status: 400 });
  }

  // 4. Verify the assignment is allowed according to the delivery person's scope
  // If the admin is assigning them, we trust the admin's explicit assignment according to business rules.
  // The rule states: "Admin can assign/reassign deliveries". "Explicitly assigned cross-branch deliveries" are allowed for Haru/Manoj/Pari/Hitu.
  // So the server allows the assignment as long as the user assigning it is ADMIN or MANAGER.

  // 5. Begin Prisma transaction for atomic assignment
  try {
    await db.$transaction([
      // Mark any existing active assignments as REASSIGNED
      db.deliveryAssignment.updateMany({
        where: {
          orderId: order.id,
          status: 'ACTIVE'
        },
        data: {
          status: 'REASSIGNED',
          unassignedAt: new Date(),
          reason: 'Reassigned to another delivery person'
        }
      }),

      // Create new DeliveryAssignment record
      db.deliveryAssignment.create({
        data: {
          orderId: order.id,
          deliveryPersonId: deliveryPerson.id,
          assignedByUserId: user.id,
          status: 'ACTIVE',
        }
      }),

      // Update Order fields
      db.order.update({
        where: { id: order.id },
        data: {
          driverId: deliveryPerson.id,
          status: OrderStatus.ASSIGNED_TO_DRIVER,
          deliveryAssignedAt: new Date()
        }
      })
    ]);

    return NextResponse.json({ success: true, message: 'Delivery assigned successfully' });
  } catch (error) {
    console.error('Failed to assign delivery:', error);
    return NextResponse.json({ error: 'Transaction failed during assignment' }, { status: 500 });
  }
});
