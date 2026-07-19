import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { testApi } from '../../utils/api-tester'
import { POST as transitionOrderHandler } from '@/app/api/v1/orders/[id]/actions/[action]/route'
import { GET as getChefOrdersHandler } from '@/app/api/v1/chef/production/route'
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
          user: { id: 'u-chef-1', email: 'chef@example.com', user_metadata: { role: 'CHEF', branchId: 'BRANCH-A' } }
        }
      })
    }
  }))
}))

describe('Phase 4.3: Core Operational APIs - Chef (@integration)', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
    prismaTest.user.findUnique = vi.fn().mockResolvedValue({ id: 'u-chef-1', role: 'CHEF', branchId: 'BRANCH-A', status: 'ACTIVE' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/v1/chef/orders', () => {
    it('should return 400 if branch context is missing', async () => {
      prismaTest.user.findUnique = vi.fn().mockResolvedValue({ id: 'u-admin-1', role: 'ADMIN', branchId: null, status: 'ACTIVE' })
      vi.mock('@supabase/ssr', () => ({
        createServerClient: vi.fn(() => ({
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: {
                user: { id: 'u-admin-1', email: 'admin@example.com', user_metadata: { role: 'ADMIN', branchId: null } }
              }
            })
          }
        }))
      }))

      const api = testApi(getChefOrdersHandler)
      const res = await api.get('/api/v1/chef/orders')
      expect(res.status).toBe(400) // Branch context is required for KDS
    })
  })

  describe('State Transition Matrix', () => {
    const validTransitions = [
      { currentState: 'WAITING_FOR_CHEF', action: 'chef-accept', expectedState: 'CHEF_ACCEPTED' },
      { currentState: 'CHEF_ACCEPTED', action: 'start-making', expectedState: 'MAKING' },
      { currentState: 'MAKING', action: 'start-decorating', expectedState: 'DECORATING' },
      { currentState: 'DECORATING', action: 'ready', expectedState: 'READY_FOR_PICKUP' },
    ]

    for (const t of validTransitions) {
      it(`should allow valid transition: ${t.currentState} -> [${t.action}] -> ${t.expectedState}`, async () => {
        prismaTest.order.findUnique = vi.fn().mockResolvedValue({ id: 'ord-1', status: t.currentState, branchId: 'BRANCH-A' })
        
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
        const res = await api.post(`/api/v1/orders/ord-1/actions/${t.action}`, {}, {}, { id: 'ord-1', action: t.action })

        expect(res.status).toBe(200)
        expect(txMocks.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({ status: t.expectedState })
        }))
        expect(txMocks.outbox.create).toHaveBeenCalled()
      })
    }

    const invalidTransitions = [
      { currentState: 'READY_FOR_PICKUP', action: 'start-making' },
      { currentState: 'NEW', action: 'ready' },
      { currentState: 'DRAFT', action: 'chef-accept' }
    ]

    for (const t of invalidTransitions) {
      it(`should reject invalid transition: ${t.currentState} -> [${t.action}] with 409`, async () => {
        prismaTest.order.findUnique = vi.fn().mockResolvedValue({ id: 'ord-1', status: t.currentState, branchId: 'BRANCH-A' })

        const api = testApi(transitionOrderHandler)
        const res = await api.post(`/api/v1/orders/ord-1/actions/${t.action}`, {}, {}, { id: 'ord-1', action: t.action })

        expect(res.status).toBe(409)
        expect(res.body.message).toContain('Invalid state transition')
      })
    }

    it('should reject transitions across branch boundaries', async () => {
      // Order belongs to Branch-B, but Chef belongs to Branch-A
      prismaTest.order.findUnique = vi.fn().mockResolvedValue({ id: 'ord-1', status: 'NEW', branchId: 'BRANCH-B' })
      
      const api = testApi(transitionOrderHandler)
      const res = await api.post(`/api/v1/orders/ord-1/actions/chef-accept`, {}, {}, { id: 'ord-1', action: 'chef-accept' })

      expect(res.status).toBe(403) // Service layer throws FORBIDDEN if branch mismatch
      expect(res.body.code).toBe('FORBIDDEN')
    })
  })
})
