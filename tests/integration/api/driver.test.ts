import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { testApi } from '../../utils/api-tester'
import { POST as transitionOrderHandler } from '@/app/api/v1/orders/[id]/actions/[action]/route'
import { resetDatabase } from '../../setup/db-reset'
import { prismaTest } from '../../setup/prisma-test'

vi.mock('@/lib/prisma', async () => {
  const actual = await vi.importActual<any>('../../setup/prisma-test')
  return { prisma: actual.prismaTest }
})

// Mock Supabase Auth
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

describe('Phase 4.4: Core Operational APIs - Driver (@integration)', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
    prismaTest.user.findUnique = vi.fn().mockResolvedValue({ id: 'u-driver-1', role: 'DELIVERY', branchId: 'BRANCH-A', status: 'ACTIVE' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Concurrency & Duplicate Claims', () => {
    it('should allow Driver A to claim the order successfully', async () => {
      prismaTest.order.findUnique = vi.fn().mockResolvedValue({ 
        id: 'ord-1', status: 'PENDING_ASSIGNMENT', deliveryType: 'DELIVERY', branchId: 'BRANCH-A' 
      })
      
      const txMocks = {
        order: { 
          update: vi.fn().mockResolvedValue({ id: 'ord-1', status: 'ASSIGNED_TO_DRIVER' }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 })
        },
        timeline: { create: vi.fn().mockResolvedValue({}) },
        outbox: { create: vi.fn().mockResolvedValue({}) },
        notificationLog: { create: vi.fn().mockResolvedValue({}) }
      }
      prismaTest.$transaction = vi.fn().mockImplementation(async (cb) => await cb(txMocks))

      const api = testApi(transitionOrderHandler)
      const res = await api.post('/api/v1/orders/ord-1/actions/assign-driver', {}, {}, { id: 'ord-1', action: 'assign-driver' })

      expect(res.status).toBe(200)
    })

    it('should return 409 Conflict if Driver B attempts to claim an already claimed order', async () => {
      // Simulate that the DB state has already advanced to ASSIGNED_TO_DRIVER
      prismaTest.order.findUnique = vi.fn().mockResolvedValue({ 
        id: 'ord-1', status: 'ASSIGNED_TO_DRIVER', deliveryType: 'DELIVERY', branchId: 'BRANCH-A' 
      })

      const api = testApi(transitionOrderHandler)
      // Driver B tries to assign-driver on the same order
      const res = await api.post('/api/v1/orders/ord-1/actions/assign-driver', {}, {}, { id: 'ord-1', action: 'assign-driver' })

      // The OrderStateMachine rejects action 'assign-driver' from state 'ASSIGNED_TO_DRIVER'
      expect(res.status).toBe(409)
      expect(res.body.message).toContain('Invalid state transition')
    })
  })

  describe('Driver Lifecycle Matrix', () => {
    const validTransitions = [
      { currentState: 'ASSIGNED_TO_DRIVER', action: 'pick-up', expectedState: 'PICKED_UP' },
      { currentState: 'PICKED_UP', action: 'on-the-way', expectedState: 'ON_THE_WAY' },
      { currentState: 'ON_THE_WAY', action: 'deliver', expectedState: 'DELIVERED' },
      { currentState: 'ON_THE_WAY', action: 'fail-delivery', expectedState: 'FAILED_DELIVERY', note: 'Customer not home' },
    ]

    for (const t of validTransitions) {
      it(`should allow valid transition: ${t.currentState} -> [${t.action}] -> ${t.expectedState}`, async () => {
        prismaTest.order.findUnique = vi.fn().mockResolvedValue({ 
          id: 'ord-1', status: t.currentState, deliveryType: 'DELIVERY', branchId: 'BRANCH-A' 
        })
        
        const txMocks = {
          order: { 
            update: vi.fn().mockResolvedValue({ id: 'ord-1', status: t.expectedState }),
            updateMany: vi.fn().mockResolvedValue({ count: 1 })
          },
          timeline: { create: vi.fn().mockResolvedValue({}) },
          outbox: { create: vi.fn().mockResolvedValue({}) },
          notificationLog: { create: vi.fn().mockResolvedValue({}) }
        }
        prismaTest.$transaction = vi.fn().mockImplementation(async (cb) => await cb(txMocks))

        const api = testApi(transitionOrderHandler)
        const res = await api.post(`/api/v1/orders/ord-1/actions/${t.action}`, { note: t.note }, {}, { id: 'ord-1', action: t.action })

        expect(res.status).toBe(200)
        expect(txMocks.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({ status: t.expectedState })
        }))
      })
    }

    it('should reject fail-delivery without a reason', async () => {
      prismaTest.order.findUnique = vi.fn().mockResolvedValue({ 
        id: 'ord-1', status: 'ON_THE_WAY', deliveryType: 'DELIVERY', branchId: 'BRANCH-A' 
      })
      
      const api = testApi(transitionOrderHandler)
      const res = await api.post(`/api/v1/orders/ord-1/actions/fail-delivery`, {}, {}, { id: 'ord-1', action: 'fail-delivery' })

      // OrderStateMachine requires a reason (note) for fail-delivery
      expect(res.status).toBe(409) 
      expect(res.body.message).toContain('REASON_REQUIRED')
    })
  })
})
