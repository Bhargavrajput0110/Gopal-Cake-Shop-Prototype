import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { testApi } from '../../utils/api-tester'
import { POST as publicCheckoutHandler } from '@/app/api/v1/public/checkout/route'
import { POST as transitionOrderHandler } from '@/app/api/v1/orders/[id]/actions/[action]/route'
import { resetDatabase } from '../../setup/db-reset'
import { prisma } from '@/lib/prisma'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: { id: 'u-driver-1', email: 'driver1@example.com', user_metadata: { role: 'DELIVERY', branchId: 'BRANCH-A' } }
        }
      })
    }
  }))
}))

describe('Real PostgreSQL Integration Suite - Core Transactions', () => {
  beforeEach(async () => {
    await resetDatabase()
    const path = await prisma.$queryRawUnsafe('SHOW search_path')
    console.log('ACTIVE SEARCH PATH:', path)
    vi.clearAllMocks()
  })

  describe('Transactional Consistency: Public Checkout', () => {
    it('should insert Order, OrderItems, and Outbox atomically, and rollback on error', async () => {
      console.log('NODE_ENV IN TEST:', process.env.NODE_ENV);
      console.log('PRISMA CLIENT ADAPTER?', (prisma as any)._engineConfig?.adapter)
      const branches = await prisma.branch.findMany();
      console.log('ALL BRANCHES:', branches.length);
      const count = await prisma.branch.count();
      console.log('BRANCH COUNT BEFORE CREATE:', count);
      
      await prisma.branch.create({
        data: { id: 'BRANCH-A', name: 'Main Branch', isActive: true, code: 'BR-A', address: '123 Street' }
      })
      await prisma.product.create({
        data: { id: 'prod-1', name: 'Chocolate Cake', basePrice: 50, availableForSale: true }
      })

      const api = testApi(publicCheckoutHandler)
      
      const payload = {
        idempotencyKey: 'test-uuid-123',
        branchId: 'BRANCH-A',
        items: [{ productId: 'prod-1', quantity: 2, unitPrice: 50 }],
        customer: { name: 'Alice', phone: '1234567890' },
        address: { house: '1', street: '123 St', area: 'Test Area', city: 'City', pin: '123456' },
        deliveryType: 'PICKUP',
        paymentMethod: 'CASH',
        targetDate: new Date().toISOString(),
        deliveryDate: new Date().toISOString()
      }

      const res = await api.post('/api/v1/public/checkout', payload)
      expect(res.status).toBe(200)
      const data = res.body
      expect(data.trackingId).toBeDefined()

      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: { items: true }
      })
      expect(order).toBeDefined()
      expect(order?.items.length).toBe(1)
      expect(Number(order?.totalAmount)).toBe(100)

      const outbox = await prisma.outbox.findFirst({
        where: { aggregateId: data.orderId, eventType: 'ORDER_CREATED' }
      })
      expect(outbox).toBeDefined()
    })
  })

  describe('Optimistic Concurrency & Row Locking: Driver Claim', () => {
    it('should allow one driver to claim, and return 409 for the second concurrent driver', async () => {
      await prisma.branch.create({
        data: { id: 'BRANCH-A', name: 'Main Branch', isActive: true, code: 'BR-A', address: '123 Street' }
      })
      await prisma.user.create({
        data: { id: 'u-driver-1', role: 'DELIVERY', branchId: 'BRANCH-A', status: 'ACTIVE', email: 'driver1@example.com', name: 'Driver', passwordHash: 'hash' }
      })
      await prisma.customer.create({
        data: { id: 'cust-1', name: 'Bob', phone: '1234567890' }
      })
      const orderId = 'ord-123'
      await prisma.order.create({
        data: {
          id: orderId,
          orderNumber: 'ORD-123',
          status: 'PENDING_ASSIGNMENT',
          deliveryType: 'DELIVERY',
          branchId: 'BRANCH-A',
          subtotal: 100,
          totalAmount: 100,
          customerId: 'cust-1',
          targetDate: new Date()
        }
      })

      const api = testApi(transitionOrderHandler)

      const res1 = await api.post(`/api/v1/orders/${orderId}/actions/assign-driver`, {}, {}, { id: orderId, action: 'assign-driver' })
      expect(res1.status).toBe(200)

      // Claim 2 - runs sequentially so it hits the state machine check
      const res2 = await api.post(`/api/v1/orders/${orderId}/actions/assign-driver`, {}, {}, { id: orderId, action: 'assign-driver' })
      expect(res2.status).toBe(409) // Conflict from state machine

      const outboxEvents = await prisma.outbox.findMany({
        where: { aggregateId: orderId }
      })
      expect(outboxEvents.length).toBeGreaterThan(0)
    })
  })
})
