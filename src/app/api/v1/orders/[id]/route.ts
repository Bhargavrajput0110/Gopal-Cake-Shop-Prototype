import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'

const handler = async (ctx: HandlerContext) => {
  const { id } = ctx.params

  if (!id) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      payments: true,
      items: {
        include: {
          media: true
        }
      }
    }
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: order })
}

export const GET = withApiHandler(handler, true)
