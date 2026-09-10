import { prisma } from '@/lib/prisma'
import { toBranchId } from '@/lib/branches'
import { OrderStateMachine, TransitionAction, AppRole, OrderStatus, STATE_MACHINE } from '@/lib/OrderStateMachine'
import { TimelineService } from '@/services/TimelineService'
import { OrderNotificationService } from '@/services/notifications/OrderNotificationService'
import { NotificationService } from '@/services/notifications/NotificationService'

export class OrderTransitionService {
  static async transitionState(params: {
    orderId: string,
    action: TransitionAction,
    actorId: string,
    appRole: AppRole,
    branchId: string | null,
    note?: string,
    reasonCode?: string
  }): Promise<void> {
    const { orderId, action, actorId, appRole, branchId, note, reasonCode } = params
    const role = appRole

    // Read the current order to get its state and delivery type
    // We do this outside the transaction to validate first, 
    // but we will still conditionally update inside the transaction to prevent races.
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { branch: true }
    })

    if (!order) {
      throw new Error('ORDER_NOT_FOUND')
    }

    // Allow cross-branch overrides for drivers if they are assigned to the order
    if (branchId && role !== 'ADMIN' && toBranchId(order.branchId) !== toBranchId(branchId)) {
      if (role === 'DELIVERY' && order.driverId === actorId) {
        // Allow driver to transition their assigned order
      } else {
        console.log(`[FORBIDDEN] order.branchId: ${order.branchId}, user.branchId: ${branchId}, role: ${role}`)
        throw new Error('FORBIDDEN')
      }
    }

    const currentState = order.status as OrderStatus

    // Idempotency check: if already in the target state for this action, just return success
    const targetConfig = STATE_MACHINE.find((t: any) => t.action === action)
    if (targetConfig && currentState === targetConfig.next) {
      console.log(`[Idempotent] Order ${orderId} is already in state ${currentState} for action ${action}`)
      return
    }

    const config = OrderStateMachine.validate(action, currentState, appRole, order.deliveryType as any)

    if (config.requireReason && !note) {
      throw new Error('REASON_REQUIRED')
    }

    // Determine final next state
    // If the transition is to READY_FOR_PICKUP and it's a DELIVERY order, it auto-queues.
    // However, the rule says "Auto-Queued Transitions: The transition READY_FOR_PICKUP -> PENDING_ASSIGNMENT is automatic for delivery orders inside the OrderTransitionService."
    let nextState = config.next
    const extraTimelineEvents: any[] = []

    let eventType: 'STATE_TRANSITION' | 'ADMIN_OVERRIDE' | 'CANCELLATION' | 'FAILED_DELIVERY' = 'STATE_TRANSITION'
    if (action === 'cancel') eventType = 'CANCELLATION'
    else if (action === 'fail-delivery') eventType = 'FAILED_DELIVERY'
    else if (role === 'ADMIN') eventType = 'ADMIN_OVERRIDE'

    if (nextState === 'READY_FOR_PICKUP' && order.deliveryType === 'DELIVERY' && order.branch.deliveryEnabled) {
      nextState = 'PENDING_ASSIGNMENT'
      // We will create two timeline events to reflect the rapid automated state change
      extraTimelineEvents.push({
        id: `evt_${Date.now()}_auto`,
        actorId: null,
        role: 'SYSTEM',
        previousState: 'READY_FOR_PICKUP',
        nextState: 'PENDING_ASSIGNMENT',
        status: 'PENDING_ASSIGNMENT',
        action: 'auto-queue',
        eventType: 'SYSTEM_ACTION',
        systemGenerated: true,
        note: 'System auto-queued for delivery',
        branchId: order.branchId
      })
    }

    const eventId = `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    const timelineData = {
      id: eventId,
      actorId,
      role: appRole,
      previousState: currentState,
      nextState: config.next, // Log the original target before auto-queue
      status: config.next,
      action,
      eventType,
      systemGenerated: false,
      reasonCode,
      note,
      branchId: order.branchId
    }

    // Notifications and Event Bus are now handled via TimelineService and OutboxProcessor.

    // Interactive Transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update Order Conditionally
      const updatedOrder = await tx.order.updateMany({
        where: { 
          id: orderId,
          status: currentState // Concurrency check
        },
        data: {
          status: nextState
        }
      })

      if (updatedOrder.count === 0) {
        throw new Error('CONCURRENCY_ERROR: Order state has changed since read.')
      }

      // 2. Insert Timeline (which atomically creates an Outbox TIMELINE_CREATED event)
      await TimelineService.create({
        orderId,
        ...timelineData
      }, tx as any)

      for (const extraEvt of extraTimelineEvents) {
        await TimelineService.create({
          orderId,
          ...extraEvt
        }, tx as any)
      }

      // 3. Insert Audit Log (All Roles)
      await tx.auditLog.create({
        data: {
          action: `Transition: ${action}`,
          reason: note || `Transitioned ${orderId} from ${currentState} to ${nextState}`,
          actorId,
          tableName: 'Order',
          recordId: orderId,
          newValue: { status: nextState },
          oldValue: { status: currentState }
        }
      })
    })

    const io = (global as any).io;
    if (io) {
      io.to(`branch_${order.branchId}`).emit('order_updated');
      io.to('admin_global').emit('order_updated');
    }

    // Fire-and-forget: dispatch in-app notifications to relevant staff roles.
    // Never awaited so a notification failure can never block the order state machine.
    OrderNotificationService.notify({
      action,
      orderId,
      orderNumber: order.orderNumber,
      branchId: order.branchId,
      driverId: (order as any).driverId ?? null,
    }).catch(() => {/* already logged inside OrderNotificationService */})

    // Fire WhatsApp and other channel notifications directly (no cron needed).
    // We use the same NotificationService that the outbox would use, but call it inline.
    NotificationService.handleTimelineEvent({
      action,
      orderId,
      actorId,
      branchId: order.branchId,
      nextState,
      orderNumber: order.orderNumber,
      driverId: (order as any).driverId ?? null,
      createdAt: new Date().toISOString(),
    }, eventId).catch((err) => {
      console.error(`[OrderTransitionService] WhatsApp notification failed for ${orderId}:`, err)
    })
  }
}
