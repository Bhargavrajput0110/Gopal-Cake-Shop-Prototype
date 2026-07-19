import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { testApi } from '../../utils/api-tester'
import { POST as createOrderHandler, GET as listOrdersHandler } from '@/app/api/v1/orders/route'
import { GET as getOrderHandler } from '@/app/api/v1/orders/[id]/route'
import { POST as transitionOrderHandler } from '@/app/api/v1/orders/[id]/actions/[action]/route'
import { resetDatabase } from '../../setup/db-reset'
import { prismaTest } from '../../setup/prisma-test'

vi.mock('@/lib/prisma', async () => {
  const actual = await vi.importActual<any>('../../setup/prisma-test')
  return { 
    prisma: actual.prismaTest,
    getIsolatedPrisma: () => actual.prismaTest
  }
})

// Mock Supabase to bypass Auth and inject roles directly via withApiHandler mock context
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

describe('Phase 4.1: Core Operational APIs - Orders (@integration)', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
    
    // Default Prisma setup
    prismaTest.user.findUnique = vi.fn().mockResolvedValue({ id: 'u1', role: 'MANAGER', branchId: 'BRANCH-A', status: 'ACTIVE' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/v1/orders (Create Draft Order)', () => {
    it('should create a basic draft order', async () => {
      prismaTest.order.create = vi.fn().mockResolvedValue({ id: 'ord-123', status: 'DRAFT', branchId: 'BRANCH-A' })

      const api = testApi(createOrderHandler)
      const res = await api.post('/api/v1/orders', {
        customerId: 'cust-1',
        branchId: 'BRANCH-A',
        deliveryType: 'PICKUP',
        expectedDeliveryDate: new Date().toISOString()
      })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      
      expect(prismaTest.order.create).toHaveBeenCalled()
    })
  })



  describe('POST /api/v1/orders/[id]/actions/[action] (Transitions)', () => {
    it('should implement optimistic concurrency and reject conflicting updates', async () => {
      // Mock the initial fetch
      prismaTest.order.findUnique = vi.fn().mockResolvedValue({ 
        id: 'ord-123', status: 'DRAFT', branchId: 'BRANCH-A' 
      })

      // Simulate concurrency failure when the transition service checks state
      prismaTest.$transaction = vi.fn().mockImplementation(async (cb) => {
        throw new Error('CONCURRENCY_ERROR: Order state has changed since read.')
      })

      const api = testApi(transitionOrderHandler)
      const res = await api.post('/api/v1/orders/ord-123/actions/checkout', {}, {}, { id: 'ord-123', action: 'checkout' }) 
      
      expect(res.status).toBe(409)
      expect(res.body.code).toBe('CONFLICT')
      expect(res.body.message).toContain('CONCURRENCY_ERROR')
    })

    it('should process valid state transition (DRAFT -> SUBMIT) and emit domain event', async () => {
      prismaTest.order.findUnique = vi.fn().mockResolvedValue({ 
        id: 'ord-123', status: 'DRAFT', branchId: 'BRANCH-A' 
      })

      // Service uses transaction
      const txMocks = {
        order: { 
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          update: vi.fn().mockResolvedValue({ id: 'ord-123', status: 'NEW' })
        },
        timeline: { create: vi.fn().mockResolvedValue({}) },
        outbox: { create: vi.fn().mockResolvedValue({}) },
        notificationLog: { create: vi.fn().mockResolvedValue({}) },
        auditLog: { create: vi.fn().mockResolvedValue({}) }
      }
      prismaTest.$transaction = vi.fn().mockImplementation(async (cb) => await cb(txMocks))

      const api = testApi(transitionOrderHandler)
      // Transitioning DRAFT -> SUBMIT
      const res = await api.post('/api/v1/orders/ord-123/actions/checkout', {}, {}, { id: 'ord-123', action: 'checkout' })

      expect(res.status).toBe(200)
      
      // Verify Transition side effects
      expect(txMocks.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'NEW' })
      }))
      expect(txMocks.timeline.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'checkout', nextState: 'NEW' })
      }))
      // Domain Event emitted
      expect(txMocks.outbox.create).toHaveBeenCalled()
    })

    it('should reject invalid state transition (MAKING -> SUBMIT) with 409 Conflict', async () => {
      // order is currently MAKING
      prismaTest.order.findUnique = vi.fn().mockResolvedValue({ 
        id: 'ord-123', status: 'MAKING', branchId: 'BRANCH-A' 
      })
      
      // By passing the transition logic through the service, it should throw Invalid transition
      const api = testApi(transitionOrderHandler)
      const res = await api.post('/api/v1/orders/ord-123/actions/checkout', {}, {}, { id: 'ord-123', action: 'checkout' })

      expect(res.status).toBe(409) // Our withApiHandler mapping maps 'Invalid state transition' to 409
      expect(res.body.code).toBe('CONFLICT')
      expect(res.body.message).toContain('Invalid state transition')
    })
    
    it('should enforce role boundaries (Driver trying to submit an order)', async () => {
      // Mock driver role
      prismaTest.user.findUnique = vi.fn().mockResolvedValue({ id: 'u1', role: 'DRIVER', branchId: 'BRANCH-A', status: 'ACTIVE' })
      
      prismaTest.order.findUnique = vi.fn().mockResolvedValue({ id: 'ord-123', status: 'DRAFT', branchId: 'BRANCH-A' })

      const api = testApi(transitionOrderHandler)
      const res = await api.post('/api/v1/orders/ord-123/actions/checkout', {}, {}, { id: 'ord-123', action: 'checkout' })

      // Driver doesn't have permission to submit orders!
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN')
    })
  })
})
