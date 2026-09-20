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

    // Allow cross-branch overrides for drivers if assigned, OR staff at destination/source branch of an inter-branch transfer
    const normOrderBranch = toBranchId(order.branchId)
    const normUserBranch = branchId ? toBranchId(branchId) : null

    if (normUserBranch && role !== 'ADMIN' && normOrderBranch !== normUserBranch) {
      let isAllowed = false
      if (role === 'DELIVERY' && order.driverId === actorId) {
        isAllowed = true
      } else {
        const transfer = await prisma.branchTransfer.findFirst({
          where: {
            OR: [
              { orderId: order.id },
              { orderId: order.orderNumber }
            ]
          }
        })
        if (transfer) {
          const normFrom = toBranchId(transfer.fromBranchId)
          const normTo = toBranchId(transfer.toBranchId)
          if (normUserBranch === normFrom || normUserBranch === normTo) {
            isAllowed = true
          }
        }
      }

      if (!isAllowed) {
        console.log(`[FORBIDDEN] order.branchId: ${order.branchId}, user.branchId: ${branchId}, role: ${role}`)
        throw new Error('FORBIDDEN')
      }
    }

    const currentState = order.status as OrderStatus

    // Special case: PICKUP order already in READY_FOR_PICKUP + action = 'ready'
    // This happens when a salesperson clicks "Notify Customer" after an inter-branch
    // transfer delivery. The order stays in READY_FOR_PICKUP — we must NOT idempotency-skip
    // because the customer WhatsApp notification needs to be fired NOW.
    const isPickupReNotification =
      action === 'ready' &&
      currentState === 'READY_FOR_PICKUP' &&
      (order.deliveryType?.toUpperCase() === 'PICKUP')

    // Idempotency check: if already in the target state for this action, just return success.
    // Skip this check for the PICKUP re-notification case above.
    const targetConfig = STATE_MACHINE.find((t: any) => t.action === action)
    if (!isPickupReNotification && targetConfig && currentState === targetConfig.next) {
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
      // 1. Update Order Status Conditionally
      // For PICKUP re-notification (READY_FOR_PICKUP → READY_FOR_PICKUP), skip the status update
      // because the order is already in the right state — we just need to fire the notification.
      if (!isPickupReNotification) {
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
          // Check if DB is already at target nextState concurrently (e.g. driver double-click or rapid state sync)
          const reCheckOrder = await tx.order.findUnique({
            where: { id: orderId },
            select: { status: true }
          })
          if (reCheckOrder && reCheckOrder.status === nextState) {
            console.log(`[Idempotent/Concurrency] Order ${orderId} is already at status ${nextState}. Proceeding gracefully.`)
          } else {
            throw new Error('CONCURRENCY_ERROR: Order status was updated by another team member.')
          }
        }
      }

      // 2. Insert Timeline (which atomically creates an Outbox TIMELINE_CREATED event)
      const tData = isPickupReNotification
        ? { ...timelineData, action: 'ready', note: note || 'Salesperson confirmed cake arrived at branch — customer notified for pickup.' }
        : timelineData

      await TimelineService.create({
        orderId,
        ...tData
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
          action: isPickupReNotification ? 'PICKUP_CUSTOMER_NOTIFIED' : `Transition: ${action}`,
          reason: note || (isPickupReNotification ? `Salesperson confirmed cake ready for pickup at branch — customer WhatsApp sent` : `Transitioned ${orderId} from ${currentState} to ${nextState}`),
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

    // Dispatch notifications asynchronously in background so staff actions respond instantly (<50ms)
    OrderNotificationService.notify({
      action,
      orderId,
      orderNumber: order.orderNumber,
      branchId: order.branchId,
      driverId: (order as any).driverId ?? null,
    }).catch(err => console.error(`[OrderTransitionService] In-app notification failed for ${orderId}:`, err))

    // Check if customer WhatsApp ORDER_READY notification should be suppressed due to active Inter-Branch Transfer
    let shouldSendCustomerWhatsApp = true;
    const isReadyAction = (typeof action === 'string' && action.toLowerCase().includes('ready')) || nextState === 'READY_FOR_PICKUP';
    if (isReadyAction && (order.deliveryType?.toUpperCase() === 'PICKUP')) {
      const activeTransfer = await prisma.branchTransfer.findFirst({
        where: {
          OR: [
            { orderId: order.id },
            { orderId: order.orderNumber }
          ],
          status: { in: ['PENDING', 'ACCEPTED', 'IN_TRANSIT'] }
        }
      });
      // Suppress ONLY IF an active inter-branch transfer is currently in transit AND this is NOT an explicit store re-notification / store ready action
      const isStoreStaffAction = normUserBranch && normUserBranch !== 'uma';
      if (activeTransfer && !isPickupReNotification && !isStoreStaffAction) {
        shouldSendCustomerWhatsApp = false;
        console.log(`[OrderTransitionService] Suppressed customer WhatsApp ORDER_READY for order ${orderId} — activeTransfer: ${activeTransfer.id}`);
      }
    }

    if (shouldSendCustomerWhatsApp) {
      NotificationService.handleTimelineEvent({
        action,
        orderId,
        actorId,
        branchId: order.branchId,
        nextState,
        orderNumber: order.orderNumber,
        driverId: (order as any).driverId ?? null,
        createdAt: new Date().toISOString(),
      }, eventId).catch(err => console.error(`[OrderTransitionService] WhatsApp notification failed for ${orderId}:`, err))
    }
  }
}
