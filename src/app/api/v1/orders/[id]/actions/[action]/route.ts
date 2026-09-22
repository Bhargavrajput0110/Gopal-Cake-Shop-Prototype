import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { OrderTransitionService } from '@/services/OrderTransitionService'
import { ExecuteTransitionSchema } from '@/dtos/TransitionSchemas'
import { outboxProcessor } from '@/services/event-bus/OutboxProcessor'
import { registerSubscribers } from '@/services/event-bus/EventSubscribers'

export const POST = withApiHandler(async ({ req, params, appRole, branchId, user }) => {
  const { id, action } = params
  const userId = user?.id
  
  if (!appRole || !userId) {
    throw new Error('UNAUTHORIZED')
  }

  // Parse body
  let body = {}
  try {
    body = await req.json()
  } catch (e) {
    // Body is optional for some actions
  }

  // Validate the incoming request against our DTO schema
  const parsed = ExecuteTransitionSchema.parse({ ...body, action })

  // Execute the state transition (this queues outbox events)
  await OrderTransitionService.transitionState({
    orderId: id,
    action: parsed.action,
    actorId: userId,
    appRole: appRole as any,
    branchId,
    note: parsed.note,
    reasonCode: parsed.reasonCode,
    basePrice: parsed.basePrice,
    discount: parsed.discount
  })

  // Trigger outbox polling in background so API response returns instantly (<50ms)
  try {
    registerSubscribers()
    outboxProcessor.poll().catch(e => console.error('[Actions] Background outbox poll failed:', e?.message))
  } catch (e: any) {
    console.error('[Actions] Background outbox trigger failed:', e?.message)
  }

  return NextResponse.json({
    success: true,
    message: `Order transitioned successfully via action: ${action}`
  }, { status: 200 })
})

