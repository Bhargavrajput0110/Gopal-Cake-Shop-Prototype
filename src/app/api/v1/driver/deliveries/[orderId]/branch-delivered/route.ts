import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { prisma } from '@/lib/prisma'
import { OutboxService } from '@/lib/events/OutboxService'
import { registerSubscribers } from '@/services/event-bus/EventSubscribers'
import { outboxProcessor } from '@/services/event-bus/OutboxProcessor'

/**
 * PATCH /api/v1/driver/deliveries/[orderId]/branch-delivered
 *
 * Called by the Uma delivery driver when they physically deliver a Store Pickup
 * cake to the Varasiya (original pickup) branch.
 *
 * The [orderId] param is actually the BranchTransfer ID (prefixed with "transfer-"
 * in the driver dashboard, stripped by the frontend before calling this endpoint).
 *
 * What this does:
 * 1. Marks BranchTransfer.status = COMPLETED
 * 2. Updates Order.branchId = fromBranchId (the original pickup branch, e.g. Varasiya)
 * 3. Creates a Timeline entry with action = 'ready' — this triggers the NotificationMatrix
 *    rule that sends the customer WhatsApp "Your cake is ready at Varasiya!"
 * 4. Publishes TIMELINE_CREATED outbox event + polls processor to dispatch the notification.
 */
export const PATCH = withApiHandler(async (ctx) => {
  const { appRole, user, params } = ctx

  if (appRole !== 'DELIVERY' && appRole !== 'ADMIN' && appRole !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const transferId = params.orderId // The BranchTransfer DB ID (transfer- prefix stripped by frontend)

  let body: { driverId?: string } = {}
  try {
    body = await ctx.req.json()
  } catch (_) {
    // body is optional
  }

  // Find the branch transfer with order and customer details
  const transfer = await prisma.branchTransfer.findUnique({
    where: { id: transferId },
    include: {
      order: {
        include: {
          customer: true,
          branch: { select: { name: true, address: true } },
        }
      }
    }
  })

  if (!transfer) {
    return NextResponse.json({ error: 'Branch transfer not found' }, { status: 404 })
  }

  if (!transfer.order) {
    return NextResponse.json({ error: 'Order not found for this transfer' }, { status: 404 })
  }

  if (transfer.order.deliveryType !== 'PICKUP') {
    return NextResponse.json(
      { error: 'This action is only valid for Store Pickup branch transfers.' },
      { status: 400 }
    )
  }

  if (transfer.status === 'RECEIVED') {
    return NextResponse.json({
      success: true,
      message: 'This branch transfer has already been completed.',
      transferId,
      orderId: transfer.order.id
    })
  }

  const orderId = transfer.order.id
  const originalPickupBranchId = transfer.fromBranchId // e.g. Varasiya — where customer will pick up

  // Execute atomically
  const timelineEntry = await prisma.$transaction(async (tx) => {
    // 1. Mark BranchTransfer as RECEIVED
    await tx.branchTransfer.update({
      where: { id: transferId },
      data: { status: 'RECEIVED', receivedAt: new Date() }
    })

    // 2. Move order back to the original pickup branch (Varasiya)
    //    Order stays in READY_FOR_PICKUP status — Varasiya salesperson will see it
    //    and use "Handover Cake" button when customer physically arrives.
    await tx.order.update({
      where: { id: orderId },
      data: {
        branchId: originalPickupBranchId,
        driverId: null, // Release driver assignment — delivery is done
      }
    })

    // 3. Create a timeline entry with action = 'branch-delivered'.
    //    We do NOT emit action = 'ready' here — so customer is NOT notified yet.
    //    The salesperson at originalPickupBranchId will see the order in their Sales Dashboard
    //    and click "Ready For Pickup" to confirm receipt and trigger the WhatsApp to the customer.
    const timeline = await tx.timeline.create({
      data: {
        orderId,
        action: 'branch-delivered',
        status: 'READY_FOR_PICKUP',
        nextState: 'READY_FOR_PICKUP',
        note: `Cake delivered to ${originalPickupBranchId.toUpperCase()} branch by delivery driver. Awaiting salesperson to notify customer for pickup.`,
        actorId: user.id,
        role: appRole,
      }
    })

    // 4. Publish TIMELINE_CREATED outbox event for in-app staff tracking
    await OutboxService.publish('TIMELINE_CREATED', timeline.id, {
      orderId,
      action: 'branch-delivered',
      nextState: 'READY_FOR_PICKUP',
      branchId: originalPickupBranchId,
      actorId: user.id,
    }, tx)

    return timeline
  })

  // Fire outbox processor in background
  try {
    registerSubscribers()
    outboxProcessor.poll().catch((e) =>
      console.error('[branch-delivered] Background outbox poll failed:', e?.message)
    )
  } catch (e: any) {
    console.error('[branch-delivered] Outbox trigger failed:', e?.message)
  }

  console.log(
    `[branch-delivered] Transfer ${transferId} completed. ` +
    `Order ${orderId} branchId updated to ${originalPickupBranchId}. ` +
    `Ready for salesperson to notify customer.`
  )

  return NextResponse.json({
    success: true,
    message: `Cake delivered to ${originalPickupBranchId.toUpperCase()} branch. Salesperson can now mark Ready for Pickup.`,
    transferId,
    orderId,
    newBranchId: originalPickupBranchId,
    timelineId: timelineEntry.id,
  })
})

