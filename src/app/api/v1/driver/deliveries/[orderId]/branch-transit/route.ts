import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { prisma } from '@/lib/prisma'
import { OutboxService } from '@/lib/events/OutboxService'
import { registerSubscribers } from '@/services/event-bus/EventSubscribers'
import { outboxProcessor } from '@/services/event-bus/OutboxProcessor'

/**
 * PATCH /api/v1/driver/deliveries/[orderId]/branch-transit
 *
 * Called by the Uma delivery driver when they START TRIP for an inter-branch
 * Store Pickup transfer (i.e. they have picked up the cake from Uma and are now
 * heading to the Varasiya branch).
 *
 * This marks BranchTransfer.status = IN_TRANSIT so the driver dashboard correctly
 * shows the task as "out for delivery" and the sales/transfers page shows it in transit.
 * It does NOT move the order back to the original branch yet — that happens when
 * the driver marks DELIVERED via the branch-delivered endpoint.
 */
export const PATCH = withApiHandler(async (ctx) => {
  const { appRole, user, params } = ctx

  if (appRole !== 'DELIVERY' && appRole !== 'ADMIN' && appRole !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const transferId = params.orderId

  const transfer = await prisma.branchTransfer.findUnique({
    where: { id: transferId },
    include: {
      order: {
        select: { id: true, orderNumber: true, status: true, deliveryType: true }
      }
    }
  })

  if (!transfer) {
    return NextResponse.json({ error: 'Branch transfer not found' }, { status: 404 })
  }

  if (!transfer.order) {
    return NextResponse.json({ error: 'Order not found for this transfer' }, { status: 404 })
  }

  if (transfer.status === 'RECEIVED') {
    return NextResponse.json(
      { error: 'This branch transfer has already been delivered.' },
      { status: 409 }
    )
  }

  if (transfer.status === 'IN_TRANSIT') {
    // Idempotent — already in transit, return success
    return NextResponse.json({ success: true, message: 'Transfer already in transit.', transferId })
  }

  if (transfer.status !== 'ACCEPTED') {
    return NextResponse.json(
      { error: `Cannot start transit for transfer in status ${transfer.status}. Must be ACCEPTED first.` },
      { status: 400 }
    )
  }

  const orderId = transfer.order.id

  // Mark transfer as IN_TRANSIT
  await prisma.$transaction(async (tx) => {
    await tx.branchTransfer.update({
      where: { id: transferId },
      data: {
        status: 'IN_TRANSIT',
        transportedBy: user.id,
      }
    })

    // Publish outbox event for real-time staff dashboards
    const timeline = await tx.timeline.create({
      data: {
        orderId,
        action: 'branch-in-transit',
        status: transfer.order!.status,
        nextState: transfer.order!.status,
        note: `Delivery driver picked up cake from ${transfer.toBranchId.toUpperCase()} — now in transit to ${transfer.fromBranchId.toUpperCase()} branch.`,
        actorId: user.id,
        role: appRole,
      }
    })

    await OutboxService.publish('TIMELINE_CREATED', timeline.id, {
      orderId,
      action: 'branch-in-transit',
      nextState: transfer.order!.status,
      branchId: transfer.toBranchId,
      actorId: user.id,
    }, tx)
  })

  // Fire outbox processor in background
  try {
    registerSubscribers()
    outboxProcessor.poll().catch((e) =>
      console.error('[branch-transit] Background outbox poll failed:', e?.message)
    )
  } catch (e: any) {
    console.error('[branch-transit] Outbox trigger failed:', e?.message)
  }

  console.log(
    `[branch-transit] Transfer ${transferId} marked IN_TRANSIT. ` +
    `Order ${orderId} in transit from ${transfer.toBranchId} to ${transfer.fromBranchId}.`
  )

  return NextResponse.json({
    success: true,
    message: `Transfer marked in transit. Heading to ${transfer.fromBranchId.toUpperCase()} branch.`,
    transferId,
    orderId,
  })
})
