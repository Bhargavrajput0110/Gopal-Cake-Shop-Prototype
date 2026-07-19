import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetDatabase } from '../../setup/db-reset'
import { prisma } from '@/lib/prisma'
import { DashboardKPIService } from '@/services/reporting/DashboardKPIService'
import { startOfDay, endOfDay, subDays } from 'date-fns'

describe('Real PostgreSQL Integration Suite - Financial Integrity', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
  })

  it('Dashboard Revenue matches Ledger Total exactly for the reporting period', async () => {
    // 1. Setup Branch and Customer
    await prisma.branch.create({
      data: { id: 'BRANCH-A', name: 'Main Branch', isActive: true, code: 'BR-A', address: '123 Street' }
    })
    await prisma.customer.create({
      data: { id: 'cust-1', name: 'Bob', phone: '1234567890' }
    })

    // 2. Create historical orders and ledger entries (Yesterday)
    const yesterday = subDays(new Date(), 1)
    await prisma.order.create({
      data: {
        id: 'ord-yesterday',
        orderNumber: 'ORD-YEST',
        status: 'DELIVERED',
        deliveryType: 'PICKUP',
        branchId: 'BRANCH-A',
        subtotal: 500,
        totalAmount: 500,
        customerId: 'cust-1',
        targetDate: yesterday,
        createdAt: yesterday
      }
    })
    await prisma.ledgerEntry.create({
      data: {
        id: 'ledg-yesterday',
        orderId: 'ord-yesterday',
        branchId: 'BRANCH-A',
        amount: 500,
        type: 'PAYMENT',
        status: 'SUCCESS',
        createdAt: yesterday
      }
    })

    // 3. Create today's orders and ledger entries
    const today = new Date()
    
    // Order 1: 1000 Revenue
    await prisma.order.create({
      data: {
        id: 'ord-today-1',
        orderNumber: 'ORD-T1',
        status: 'DELIVERED',
        deliveryType: 'PICKUP',
        branchId: 'BRANCH-A',
        subtotal: 1000,
        totalAmount: 1000,
        customerId: 'cust-1',
        targetDate: today,
        createdAt: today
      }
    })
    await prisma.ledgerEntry.create({
      data: {
        id: 'ledg-today-1',
        orderId: 'ord-today-1',
        branchId: 'BRANCH-A',
        amount: 1000,
        type: 'PAYMENT',
        status: 'SUCCESS',
        createdAt: today
      }
    })

    // Order 2: 500 Revenue, but was refunded
    await prisma.order.create({
      data: {
        id: 'ord-today-2',
        orderNumber: 'ORD-T2',
        status: 'CANCELLED',
        deliveryType: 'PICKUP',
        branchId: 'BRANCH-A',
        subtotal: 500,
        totalAmount: 500,
        customerId: 'cust-1',
        targetDate: today,
        createdAt: today
      }
    })
    await prisma.ledgerEntry.create({
      data: {
        id: 'ledg-today-2',
        orderId: 'ord-today-2',
        branchId: 'BRANCH-A',
        amount: 500,
        type: 'PAYMENT',
        status: 'SUCCESS',
        createdAt: today
      }
    })
    await prisma.ledgerEntry.create({
      data: {
        id: 'ledg-today-2-refund',
        orderId: 'ord-today-2',
        branchId: 'BRANCH-A',
        amount: -500, // Refund
        type: 'REFUND',
        status: 'SUCCESS',
        createdAt: today
      }
    })

    // 4. Calculate Ledger Total for Today manually
    const start = startOfDay(today)
    const end = endOfDay(today)
    
    const ledgerAgg = await prisma.ledgerEntry.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
        order: { branchId: 'BRANCH-A' }
      },
      _sum: { amount: true }
    })
    const ledgerTotal = Number(ledgerAgg._sum.amount || 0)

    // Expected: 1000 (Order 1) + 500 (Order 2 payment) - 500 (Order 2 refund) = 1000
    expect(ledgerTotal).toBe(1000)

    // 5. Calculate Revenue via DashboardKPIService
    const kpis = await DashboardKPIService.getKPIs({ branchId: 'BRANCH-A', date: today })

    // The Dashboard Revenue MUST equal the Ledger Total
    expect(kpis.todaysSales).toBe(ledgerTotal)
  })
})
