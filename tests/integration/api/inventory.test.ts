import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { testApi } from '../../utils/api-tester'
import { POST as bulkUpdateHandler } from '@/app/api/v1/inventory/route'
import { PATCH as singleUpdateHandler } from '@/app/api/v1/inventory/[id]/availability/route'
import { resetDatabase } from '../../setup/db-reset'
import { prismaTest } from '../../setup/prisma-test'

vi.mock('@/lib/prisma', async () => {
  const actual = await vi.importActual<any>('../../setup/prisma-test')
  return { prisma: actual.prismaTest }
})

const mockGetUser = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser
    }
  }))
}))

describe('Phase 4.5: Core Operational APIs - Inventory (@integration)', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
    
    // Default setup: Admin User
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'u-admin-1', email: 'admin@example.com', user_metadata: { role: 'ADMIN', branchId: null } }
      }
    })
    prismaTest.user.findUnique = vi.fn().mockResolvedValue({ id: 'u-admin-1', role: 'ADMIN', branchId: null, status: 'ACTIVE' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('PATCH /api/v1/inventory/[id]/availability (Manual Override)', () => {
    it('should enable product availability', async () => {
      prismaTest.product.update = vi.fn().mockResolvedValue({ id: 'prod-1', name: 'Cake', availableForSale: true })

      const api = testApi(singleUpdateHandler)
      const res = await api.patch('/api/v1/inventory/prod-1/availability', { isAvailable: true }, {}, { id: 'prod-1' })

      expect(res.status).toBe(200)
      expect(prismaTest.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { availableForSale: true }
      })
    })

    it('should disable product availability', async () => {
      prismaTest.product.update = vi.fn().mockResolvedValue({ id: 'prod-1', name: 'Cake', availableForSale: false })

      const api = testApi(singleUpdateHandler)
      const res = await api.patch('/api/v1/inventory/prod-1/availability', { isAvailable: false }, {}, { id: 'prod-1' })

      expect(res.status).toBe(200)
      expect(prismaTest.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { availableForSale: false }
      })
    })

    it('should reject access if user lacks MANAGE_INVENTORY permission (Role: DRIVER)', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'u-driver-1', email: 'driver@example.com', user_metadata: { role: 'DELIVERY', branchId: 'BRANCH-A' } }
        }
      })
      prismaTest.user.findUnique = vi.fn().mockResolvedValue({ id: 'u-driver-1', role: 'DELIVERY', branchId: 'BRANCH-A', status: 'ACTIVE' })

      const api = testApi(singleUpdateHandler)
      const res = await api.patch('/api/v1/inventory/prod-1/availability', { isAvailable: false }, {}, { id: 'prod-1' })

      expect(res.status).toBe(403) // Forbidden due to RBAC
    })
  })

  describe('POST /api/v1/inventory (Bulk Update)', () => {
    it('should bulk update product availability', async () => {
      prismaTest.product.updateMany = vi.fn().mockResolvedValue({ count: 3 })

      const api = testApi(bulkUpdateHandler)
      const res = await api.post('/api/v1/inventory', {
        productIds: ['prod-1', 'prod-2', 'prod-3'],
        isAvailable: false
      })

      expect(res.status).toBe(200)
      expect(res.body.count).toBe(3)
      expect(prismaTest.product.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['prod-1', 'prod-2', 'prod-3'] } },
        data: { availableForSale: false }
      })
    })

    it('should validate DTO and reject malformed requests', async () => {
      const api = testApi(bulkUpdateHandler)
      const res = await api.post('/api/v1/inventory', {
        productIds: 'not-an-array',
        isAvailable: 'not-a-boolean'
      })

      expect(res.status).toBe(400)
      expect(res.body.code).toBe('VALIDATION_ERROR')
    })
  })
})
