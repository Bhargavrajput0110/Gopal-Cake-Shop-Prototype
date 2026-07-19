import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { prisma } from '@/lib/prisma'

export const GET = withApiHandler(async (ctx) => {
  const { searchParams } = ctx.req.nextUrl
  const unreadOnly = searchParams.get('unreadOnly') === 'true'

  const where: any = {
    userId: ctx.user.id,
    isDismissed: false
  }

  if (unreadOnly) {
    where.isRead = false
  }

  // Ordering: Unread -> Priority (HIGH > NORMAL > LOW) -> Newest
  const notifications = await prisma.inAppNotification.findMany({
    where,
    orderBy: [
      { isRead: 'asc' },
      { priority: 'desc' }, // assuming HIGH > NORMAL > LOW string comparison or mapped
      { createdAt: 'desc' }
    ],
    take: 50
  })

  // Filter out expired natively (or we could use Prisma query)
  const now = new Date()
  const validNotifications = notifications.filter(n => !n.expiresAt || n.expiresAt > now)

  return NextResponse.json({
    success: true,
    data: validNotifications
  })
})
