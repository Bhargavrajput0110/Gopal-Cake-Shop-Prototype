import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { testApi } from '../../utils/api-tester'
import { GET as ordersHandler } from '@/app/api/v1/public/orders/[trackingId]/route'
import { resetDatabase } from '../../setup/db-reset'
import { prismaTest } from '../../setup/prisma-test'

vi.mock('@/lib/prisma', async () => {
  const actual = await vi.importActual<any>('../../setup/prisma-test')
  return { prisma: actual.prismaTest }
})

describe('Phase 2.3: API Public Orders (@integration)', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/v1/public/orders/[trackingId]', () => {
    it('should return 404 for non-existent tracking ID', async () => {
      // Mock db empty result to allow test to run without db
      prismaTest.order.findUnique = vi.fn().mockResolvedValue(null)
      
      const api = testApi(ordersHandler)
      const res = await api.get('/api/v1/public/orders/TRK123', {}, { trackingId: 'TRK123' })
      
      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
      expect(res.body.code).toBe('NOT_FOUND')
    })

    it('should return 200 with formatted DTO and no-store cache headers for valid tracking ID', async () => {
      const mockOrder = {
        orderNumber: 'ORD-001',
        status: 'NEW',
        targetDate: new Date('2026-07-15T12:00:00Z'),
        totalAmount: 15.00,
        items: [{
          productName: 'Cake',
          quantity: 1,
          variant: '1kg',
          image: null
        }],
        timeline: [{
          nextState: 'WAITING_FOR_CHEF',
          createdAt: new Date('2026-07-01T12:00:00Z')
        }]
      }
      prismaTest.order.findUnique = vi.fn().mockResolvedValue(mockOrder)

      const api = testApi(ordersHandler)
      const res = await api.get('/api/v1/public/orders/TRK123', {}, { trackingId: 'TRK123' })

      expect(res.status).toBe(200)
      
      // Cache Verification
      expect(res.headers.get('cache-control')).toBe('no-store, max-age=0')

      // DTO Verification
      expect(res.body.orderNumber).toBe('ORD-001')
      expect(res.body.status).toBe('Order Received') // Terminology mapping
      expect(res.body.items).toHaveLength(1)
      expect(res.body.timeline[0].status).toBe('Order Received')
    })
  })
})
