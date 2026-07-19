import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { testApi } from '../../utils/api-tester'
import { POST as checkoutHandler } from '@/app/api/v1/public/checkout/route'
import { resetDatabase } from '../../setup/db-reset'
import { prismaTest } from '../../setup/prisma-test'

vi.mock('@/lib/prisma', async () => {
  const actual = await vi.importActual<any>('../../setup/prisma-test')
  return { prisma: actual.prismaTest }
})

describe('Phase 2.3: API Public Checkout (@integration)', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/v1/public/checkout', () => {
    const validPayload = {
      idempotencyKey: 'IDEM-KEY-1234',
      customer: { name: 'Test User', phone: '1234567890' },
      address: { house: '123', street: 'Main', area: 'Downtown', city: 'City', pin: '123456' },
      items: [{ productId: 'prod-1', quantity: 2 }],
      paymentMethod: 'UPI',
      branchId: 'branch-1',
      deliveryDate: new Date().toISOString()
    }

    it('should validate DTO and return 400 VALIDATION_ERROR for empty items', async () => {
      const api = testApi(checkoutHandler)
      const invalidPayload = { ...validPayload, items: [] }
      const res = await api.post('/api/v1/public/checkout', invalidPayload)

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.code).toBe('VALIDATION_ERROR')
      expect(res.body.details[0].field).toBe('items')
    })

    it('should return 400 if product is unavailable', async () => {
      prismaTest.order.findUnique = vi.fn().mockResolvedValue(null)
      prismaTest.product.findUnique = vi.fn().mockResolvedValue({ id: 'prod-1', availableForSale: false })

      const api = testApi(checkoutHandler)
      const res = await api.post('/api/v1/public/checkout', validPayload)

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('is unavailable')
    })

    it('should successfully checkout, return trackingId, and enforce Transactional Side Effects', async () => {
      prismaTest.order.findUnique = vi.fn().mockResolvedValue(null)
      prismaTest.product.findUnique = vi.fn().mockResolvedValue({ id: 'prod-1', availableForSale: true, basePrice: 15, name: 'Cake' })
      prismaTest.customer.findUnique = vi.fn().mockResolvedValue(null)
      prismaTest.customer.create = vi.fn().mockResolvedValue({ id: 'cust-1' })
      prismaTest.order.count = vi.fn().mockResolvedValue(5)
      
      // Mock the entire transaction block to just execute the callback
      prismaTest.$transaction = vi.fn().mockImplementation(async (cb) => {
        const tx = {
          order: { create: vi.fn().mockResolvedValue({ id: 'order-1', trackingId: 'track-uuid' }) },
          payment: { create: vi.fn().mockResolvedValue({}) },
          timeline: { create: vi.fn().mockResolvedValue({}) },
          outbox: { create: vi.fn().mockResolvedValue({}) }
        }
        return await cb(tx)
      })

      const api = testApi(checkoutHandler)
      const res = await api.post('/api/v1/public/checkout', validPayload)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.trackingId).toBeDefined()
      expect(res.body.idempotent).toBe(false)
      
      // Side effects verification
      expect(prismaTest.$transaction).toHaveBeenCalled()
      // Note: testing actual inner TX calls requires a deeper mock spy or an actual database
    })

    it('should return the identical trackingId if idempotency key is repeated', async () => {
      // Mock existing order with this idempotency key
      prismaTest.order.findUnique = vi.fn().mockResolvedValue({ id: 'order-1', trackingId: 'track-uuid' })
      
      const api = testApi(checkoutHandler)
      const res = await api.post('/api/v1/public/checkout', validPayload)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.idempotent).toBe(true)
      expect(res.body.trackingId).toBe('track-uuid')
    })
  })
})
