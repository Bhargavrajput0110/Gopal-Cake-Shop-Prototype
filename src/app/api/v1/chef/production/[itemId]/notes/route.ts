import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { OrderStatus } from '@prisma/client'

const handler = async (ctx: HandlerContext) => {
  const { itemId } = ctx.params
  const { user, appRole } = ctx

  if (!user || !['SALESPERSON', 'MANAGER', 'ADMIN', 'CHEF'].includes(appRole as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await ctx.req.json()
  const { type, message } = body

  if (!type || !message) {
    return NextResponse.json({ error: 'Type and message are required' }, { status: 400 })
  }

  try {
    const item = await prisma.orderItem.findUnique({ where: { id: itemId } })
    if (!item) throw new Error('Order item not found')

    const note = await prisma.kitchenNote.create({
      data: {
        orderItemId: itemId,
        createdBy: user.user_metadata?.name || user.email || 'Staff',
        role: appRole as string,
        type,
        message
      }
    })

    // Also log in Timeline so history is preserved universally
    await prisma.timeline.create({
      data: {
        orderId: item.orderId,
        orderItemId: itemId,
        action: 'KITCHEN_NOTE_ADDED',
        status: item.status as unknown as OrderStatus,
        nextState: item.status as unknown as OrderStatus,
        actorId: user.id,
        note: `[${type}] ${message}`
      }
    })

    return NextResponse.json(note)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export const POST = withApiHandler(handler, true)
