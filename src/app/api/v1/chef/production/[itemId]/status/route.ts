import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { OrderItemStatus } from '@prisma/client'
import { OutboxService } from '@/lib/events/OutboxService'
import { KitchenStateMachine } from '@/services/KitchenStateMachine'

export async function PATCH(req: Request, context: { params: Promise<{ itemId: string }> }) {
  try {
    const resolvedParams = await context.params
    const { itemId } = resolvedParams
    const session = await auth()
    if (!session || !session.user || !['ADMIN', 'MANAGER', 'CHEF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, action, note, pauseReason } = await req.json()

    // Transactional status update and timeline logging
    const updatedItem = await prisma.$transaction(async (tx) => {
      const item = await tx.orderItem.findUnique({ where: { id: itemId }, include: { order: true } })
      if (!item) throw new Error('Item not found')

      const userBranchId = (session.user as any).branchId || 'khanderao'
      if (session.user.role === 'CHEF' && item.order.branchId !== userBranchId) {
        throw new Error('FORBIDDEN: You do not have permission to modify items from another branch')
      }

      const updateData: any = {}
      let timelineAction = action || 'STATUS_UPDATE'
      let timelineNote = note

      // Handle specific actions
      if (action === 'ACCEPT_ASSIGNMENT') {
        updateData.assignedChefId = session.user.id
        updateData.status = 'CHEF_ACCEPTED'
        timelineAction = 'CHEF_ASSIGNED'
        timelineNote = `Assigned to ${session.user.name}`
      } else if (action === 'PAUSE_PRODUCTION') {
        updateData.pauseReason = pauseReason || 'Manual Pause'
        updateData.pausedAt = new Date()
        timelineAction = 'PRODUCTION_PAUSED'
        timelineNote = `Paused: ${pauseReason}`
      } else if (action === 'RESUME_PRODUCTION') {
        updateData.pauseReason = null
        updateData.pausedAt = null
        timelineAction = 'PRODUCTION_RESUMED'
        timelineNote = `Resumed from pause`
      } else if (status) {
        if (status === 'PACKED') {
          // Verify all vendor child items are ready
          const childItems = await tx.orderItem.findMany({
            where: { parentItemId: itemId, assignedVendorId: { not: null } }
          })
          const pendingChildren = childItems.filter(c => c.status !== 'PACKED' && c.status !== 'CANCELLED')
          if (pendingChildren.length > 0) {
            throw new Error(`Cannot complete. Waiting on vendor components: ${pendingChildren.map(c => c.productName).join(', ')}`)
          }
        }
        
        // Validate State Transition
        if (!KitchenStateMachine.validateTransition(item.status, status)) {
          throw new Error(`CONFLICT: Invalid state transition from ${item.status} to ${status}`)
        }

        updateData.status = status
        timelineAction = `STATUS_CHANGED_TO_${status}`
        if (status === 'MAKING' && item.status !== 'MAKING') {
          timelineAction = 'PRODUCTION_STARTED'
        }
      }

      // Update the OrderItem
      const updated = await tx.orderItem.update({
        where: { id: itemId },
        data: updateData
      })

      // Add to global Timeline with orderItemId trace
      await tx.timeline.create({
        data: {
          orderId: item.orderId,
          orderItemId: item.id,
          status: item.order.status, // Order level status remains unchanged here typically, but we track it
          nextState: item.order.status,
          action: timelineAction,
          note: timelineNote,
          actorId: session.user.id,
          role: session.user.role
        }
      })

      // Optional: If all items in an order are READY_FOR_PICKUP, advance the Order status
      // We will handle this in an event subscriber later, or dispatch an event now.
      await OutboxService.publish('OrderItemStatusUpdated', item.id, {
        orderId: item.orderId,
        orderItemId: item.id,
        newStatus: updated.status,
        action: timelineAction
      }, tx)

      return updated
    })

    return NextResponse.json({ success: true, item: updatedItem })
  } catch (error: any) {
    console.error('Update Chef Item Status Error:', error)
    if (error.message?.startsWith('FORBIDDEN')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.message?.startsWith('CONFLICT')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
