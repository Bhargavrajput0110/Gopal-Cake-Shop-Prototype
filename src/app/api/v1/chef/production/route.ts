import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ChefProductionItemDTO } from '@/dtos/OrderSchemas'
import { OrderItemStatus } from '@prisma/client'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !['ADMIN', 'MANAGER', 'CHEF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params for filtering
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'ALL'
    
    // Base Where
    const whereClause: any = {
      order: {
        status: { notIn: ['DRAFT', 'QUOTE_DRAFT', 'CANCELLED'] } // Only active operational orders
      },
      status: { notIn: ['DELIVERED', 'CANCELLED'] } // Ignore fully completed
    }

    // Apply Quick Filters
    if (filter === 'TODAY') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
      whereClause.order.targetDate = { gte: startOfDay, lte: endOfDay }
    } else if (filter === 'ASSIGNED_TO_ME') {
      whereClause.assignedChefId = session.user.id
    }

    const items = await prisma.orderItem.findMany({
      where: whereClause,
      include: {
        order: {
          include: { customer: true }
        },
        assignedChef: true,
        media: true,
        kitchenNotes: {
          orderBy: { createdAt: 'desc' }
        },
        childItems: {
          select: { id: true, productName: true, status: true, assignedVendorId: true }
        }
      },
      orderBy: [
        { order: { isPriority: 'desc' } },
        { order: { targetDate: 'asc' } }
      ]
    })

    const response: ChefProductionItemDTO[] = items.map((item: any) => {
      const isVIP = item.order.customer?.totalOrders > 10 // Arbitrary VIP rule for now

      let priority = 3 // 1=Late, 2=Urgent, 3=Priority/VIP, 4=Normal
      const minsUntilDue = Math.floor((new Date(item.order.targetDate).getTime() - new Date().getTime()) / 60000)
      
      if (minsUntilDue < 0) priority = 1
      else if (minsUntilDue < 120) priority = 2
      else if (item.order.isPriority || isVIP) priority = 3
      else priority = 4

      return {
        id: item.id,
        orderId: item.orderId,
        orderNumber: item.order.orderNumber,
        sequenceNumber: item.sequenceNumber,
        status: item.status,
        priority,
        
        productName: item.productName,
        quantity: item.quantity,
        weight: item.weight,
        flavor: item.flavor,
        messageOnCake: item.messageOnCake,
        shape: item.shape,
        notes: item.notes,
        boxCount: item.boxCount,
        
        designId: item.designId,
        designName: item.designName,
        designCode: item.designCode,
        designImageUrl: item.designImageUrl,
        referenceImages: item.media.filter((m: any) => m.type === 'REFERENCE').map((m: any) => m.url),
        
        assignedChefId: item.assignedChefId,
        assignedChefName: item.assignedChef?.name || null,
        
        pauseReason: item.pauseReason,
        pausedAt: item.pausedAt,

        childItems: item.childItems || [],
        
        
        estimatedPrepMinutes: item.estimatedPrepMinutes,
        targetDate: item.order.targetDate,
        createdAt: item.createdAt,
        startedAt: item.startedAt
      }
    })

    // Smart Sorting: Late > Urgent > Earliest Pickup > Remaining
    response.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Fetch Chef Production Items Error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
