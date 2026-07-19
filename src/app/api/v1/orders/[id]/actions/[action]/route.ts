import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { OrderTransitionService } from '@/services/OrderTransitionService'
import { ExecuteTransitionSchema } from '@/dtos/TransitionSchemas'
import { z } from 'zod'

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

  // Execute the state transition
  await OrderTransitionService.transitionState({
    orderId: id,
    action: parsed.action,
    actorId: userId,
    appRole: appRole as any,
    branchId,
    note: parsed.note,
    reasonCode: parsed.reasonCode
  })

  return NextResponse.json({
    success: true,
    message: `Order transitioned successfully via action: ${action}`
  }, { status: 200 })
})
