import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'
import { withApiHandler } from '@/lib/withApiHandler'

export const GET = withApiHandler(async (ctx) => {
  const { appRole, user } = ctx
  if (appRole !== 'ADMIN' && appRole !== 'MANAGER' && appRole !== 'SALESPERSON') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const branchId = ctx.branchId || ctx.req.nextUrl.searchParams.get('branchId')

  const activeDrivers = await db.user.findMany({
    where: {
      role: 'DELIVERY',
      ...(branchId ? { branchId } : {})
    },
    select: {
      id: true,
      name: true,
      phone: true,
      branch: { select: { name: true } },
      _count: {
        select: {
          deliveredOrders: {
            where: {
              status: 'DELIVERED',
              updatedAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
            }
          }
        }
      },
      deliveredOrders: {
        where: {
          OR: [
            { status: 'READY_FOR_PICKUP' },
            { status: 'PENDING_ASSIGNMENT' },
            { status: 'ASSIGNED_TO_DRIVER' },
            { status: 'PICKED_UP' },
            { status: 'ON_THE_WAY' }
          ]
        },
        select: {
          id: true,
          status: true,
          targetDate: true
        }
      }
    }
  })

  const workload = activeDrivers.map(driver => {
    const activeDeliveries = driver.deliveredOrders.length
    const deliveredToday = driver._count.deliveredOrders
    const now = new Date()
    
    const lateDeliveries = driver.deliveredOrders.filter(
      d => new Date(d.targetDate).getTime() < now.getTime()
    ).length

    const isOverloaded = activeDeliveries > 5 || lateDeliveries > 0

    return {
      driverId: driver.id,
      name: driver.name,
      phone: driver.phone,
      branch: driver.branch?.name || 'Unknown',
      activeCount: activeDeliveries,
      deliveredToday,
      lateCount: lateDeliveries,
      isOverloaded
    }
  })

  return NextResponse.json(workload)
})
