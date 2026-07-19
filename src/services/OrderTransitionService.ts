import { prisma } from '@/lib/prisma'
import { OrderStateMachine, TransitionAction, AppRole, OrderStatus } from '@/lib/OrderStateMachine'
import { TimelineService } from '@/services/TimelineService'

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

    if (branchId && role !== 'ADMIN' && order.branchId !== branchId) {
      console.log(`[FORBIDDEN] order.branchId: ${order.branchId}, user.branchId: ${branchId}, role: ${role}`)
      throw new Error('FORBIDDEN')
    }

    const currentState = order.status as OrderStatus
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

      // 3. Insert Audit Log (If Admin)
      if (appRole === 'ADMIN') {
        await tx.auditLog.create({
          data: {
            action: `Admin Transition: ${action}`,
            reason: `Transitioned ${orderId} from ${currentState} to ${nextState}`,
            actorId,
            tableName: 'Order',
            recordId: orderId,
            newValue: { status: nextState },
            oldValue: { status: currentState }
          }
        })
      }
    })

    const io = (global as any).io;
    if (io) {
      io.to(`branch_${order.branchId}`).emit('order_updated');
      io.to('admin_global').emit('order_updated');
    }
  }
}
