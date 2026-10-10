import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { prisma } from '@/lib/prisma'
import { OutboxService } from '@/lib/events/OutboxService'
import { toBranchShortName } from '@/lib/branches'

/**
 * PATCH /api/v1/driver/deliveries/[orderId]/branch-accept
 *
 * Called by a delivery driver when they accept an inter-branch transfer task
 * from the AVAILABLE pool.
 *
 * The [orderId] param is the BranchTransfer ID.
 * This assigns the driver to both the transfer (transportedBy) and the order (driverId)
 * so it moves to MY TASKS for this driver.
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
        select: { id: true, orderNumber: true, status: true, branchId: true }
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
    return NextResponse.json({ error: 'Transfer already completed.' }, { status: 409 })
  }

  const orderId = transfer.order.id
  const driverName = user.name || 'Driver'

  await prisma.$transaction(async (tx) => {
    // 1. Update transfer transportedBy
    await tx.branchTransfer.update({
      where: { id: transferId },
      data: {
        transportedBy: user.id
      }
    })

    // 2. Assign driver to order
    await tx.order.update({
      where: { id: orderId },
      data: {
        driverId: user.id
      }
    })

    // 3. Create Timeline record
    const fromName = toBranchShortName(transfer.fromBranchId)
    const toName = toBranchShortName(transfer.toBranchId)
    const timeline = await tx.timeline.create({
      data: {
        orderId,
        action: 'branch-transfer-accepted',
        status: transfer.order!.status,
        nextState: transfer.order!.status,
        note: `Driver ${driverName} accepted transfer task: ${fromName} ➔ ${toName} branch.`,
        actorId: user.id,
        role: appRole,
        branchId: transfer.toBranchId
      }
    })

    await OutboxService.publish('TIMELINE_CREATED', timeline.id, {
      orderId,
      action: 'branch-transfer-accepted',
      nextState: transfer.order!.status,
      branchId: transfer.toBranchId,
      actorId: user.id,
    }, tx)
  })

  return NextResponse.json({
    success: true,
    message: 'Transfer task accepted successfully.',
    transferId,
    orderId
  })
})
