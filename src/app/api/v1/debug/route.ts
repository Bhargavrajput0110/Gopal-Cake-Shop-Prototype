import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, branchId: true, role: true }
  })
  const notifs = await prisma.inAppNotification.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json({ users, notifs, totalNotifs: notifs.length })
}
