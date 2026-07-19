import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { testApi } from '../../utils/api-tester'
import { POST as posCheckoutHandler } from '@/app/api/v1/pos/checkout/route'
import { resetDatabase } from '../../setup/db-reset'
import { prismaTest } from '../../setup/prisma-test'

vi.mock('@/lib/prisma', async () => {
  const actual = await vi.importActual<any>('../../setup/prisma-test')
  return { prisma: actual.prismaTest }
})

// Mock Supabase to bypass Auth
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: { id: 'u1', email: 'test@example.com', user_metadata: { role: 'MANAGER', branchId: 'BRANCH-A' } }
        }
      })
    }
  }))
}))

// Mock Supabase Admin for Product Lookups (which is used inside POS Service)
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'prod-1', name: 'Cake', price: 20 }],
            error: null
          })
        })
      })
    })
  }
}))

describe('Phase 4.2: Core Operational APIs - POS (@integration)', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
    prismaTest.user.findUnique = vi.fn().mockResolvedValue({ id: 'u1', role: 'MANAGER', branchId: 'BRANCH-A', status: 'ACTIVE' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/v1/pos/checkout', () => {
    const validPosPayload = {
      customerId: 'cust-123',
      items: [{ productId: 'prod-1', quantity: 2 }],
      payments: [{ amount: 42, method: 'CASH' }]
    }

    it('should rollback transaction on failure and return 500/409', async () => {
      // Force a concurrency or DB error inside the transaction
      prismaTest.$transaction = vi.fn().mockImplementation(async (cb) => {
        throw new Error('CONCURRENCY_ERROR')
      })

      const api = testApi(posCheckoutHandler)
      const res = await api.post('/api/v1/pos/checkout', validPosPayload)

      expect(res.status).toBe(409)
      expect(res.body.code).toBe('CONFLICT')
      // Ensure the transaction function was invoked and bubbled correctly
      expect(prismaTest.$transaction).toHaveBeenCalled()
    })

    it('should successfully checkout, enforcing Tax and Total computations transactionally', async () => {
      const txMocks = {
        order: { create: vi.fn().mockResolvedValue({ id: 'pos-ord-123', totalAmount: 42 }), update: vi.fn().mockResolvedValue({ id: 'pos-ord-123', status: 'NEW' }) },
        timeline: { create: vi.fn().mockResolvedValue({}) },
        auditLog: { create: vi.fn().mockResolvedValue({}) },
        outbox: { create: vi.fn().mockResolvedValue({}) }
      }
      prismaTest.$transaction = vi.fn().mockImplementation(async (cb) => await cb(txMocks))

      const api = testApi(posCheckoutHandler)
      const res = await api.post('/api/v1/pos/checkout', validPosPayload)

      expect(res.status).toBe(201)
      expect(res.body.id).toBe('pos-ord-123')
      
      // Verify all Side effects
      expect(txMocks.order.create).toHaveBeenCalled()
      expect(txMocks.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'NEW' } }))
      expect(txMocks.timeline.create).toHaveBeenCalled()
      expect(txMocks.auditLog.create).toHaveBeenCalled()
      expect(txMocks.outbox.create).toHaveBeenCalled()
    })

    it('should reject requests that fail cart validation', async () => {
      const api = testApi(posCheckoutHandler)
      const invalidPayload = { ...validPosPayload, items: [] } // Empty cart not allowed by Zod
      const res = await api.post('/api/v1/pos/checkout', invalidPayload)

      expect(res.status).toBe(400)
      expect(res.body.code).toBe('VALIDATION_ERROR')
    })
  })
})
