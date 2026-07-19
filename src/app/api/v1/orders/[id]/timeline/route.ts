import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'

const handler = async (ctx: HandlerContext) => {
  const { id } = ctx.params

  if (!id) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
  }

  const timelineEvents = await prisma.timeline.findMany({
    where: { orderId: id },
    orderBy: { createdAt: 'asc' }, // Oldest first to build the timeline
    include: {
      actor: {
        select: { id: true, name: true, role: true }
      }
    }
  })

  return NextResponse.json({ success: true, data: timelineEvents })
}

export const GET = withApiHandler(handler, true)
