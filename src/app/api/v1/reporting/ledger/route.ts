import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { prisma as db } from '@/lib/prisma'

export const GET = withApiHandler(async (ctx) => {
  const { searchParams } = new URL(ctx.req.url)
  
  const branchId = searchParams.get('branchId') || ctx.branchId
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const type = searchParams.get('type') // PAYMENT, REFUND, ADJUSTMENT, WAIVER, WRITE_OFF
  
  const where: any = {}
  
  if (branchId) {
    where.branchId = branchId
  }
  
  if (type) {
    where.type = type
  }
  
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }

  const ledgerEntries = await db.ledgerEntry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      actor: {
        select: { id: true, name: true, email: true, role: true }
      },
      order: {
        select: { orderNumber: true, status: true, customer: { select: { name: true } } }
      }
    }
  })

  // Calculate aggregates
  const totalIn = ledgerEntries
    .filter(le => le.type === 'PAYMENT' && le.status === 'SUCCESS')
    .reduce((sum, le) => sum + Number(le.amount), 0)
    
  const totalOut = ledgerEntries
    .filter(le => le.type === 'REFUND' && le.status === 'SUCCESS')
    .reduce((sum, le) => sum + Number(le.amount), 0)

  return NextResponse.json({
    success: true,
    data: ledgerEntries,
    summary: {
      totalIn,
      totalOut,
      net: totalIn - totalOut
    }
  })
}, false, 'manage_reports') // Requires manage_reports permission
