import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { testApi } from '../../utils/api-tester'
import { GET as getSalesReportsHandler } from '@/app/api/v1/reporting/sales/route'
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

describe('Phase 5.2: Administrative APIs - Reporting (@integration)', () => {
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

  describe('GET /api/v1/reporting/sales', () => {
    it('should calculate aggregations correctly', async () => {
      // Mock db returns
      prismaTest.order.findMany = vi.fn().mockResolvedValue([
        { id: '1', totalAmount: 100 },
        { id: '2', totalAmount: 200 }
      ])
      prismaTest.order.count = vi.fn().mockResolvedValue(2)
      prismaTest.order.aggregate = vi.fn().mockResolvedValue({
        _sum: { totalAmount: 300 },
        _avg: { totalAmount: 150 }
      })

      const api = testApi(getSalesReportsHandler)
      const startDate = new Date('2026-01-01').toISOString()
      const endDate = new Date('2026-01-31').toISOString()
      
      const res = await api.get(`/api/v1/reporting/sales?startDate=${startDate}&endDate=${endDate}`)

      expect(res.status).toBe(200)
      expect(res.body.data.aggregations.totalRevenue).toBe(300)
      expect(res.body.data.aggregations.averageOrderValue).toBe(150)
      expect(res.body.data.aggregations.orderCount).toBe(2)
    })

    it('should strictly enforce branch isolation for non-admins', async () => {
      // Mock user as MANAGER of BRANCH-A
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'u2', user_metadata: { role: 'MANAGER', branchId: 'BRANCH-A' } } }
      })
      prismaTest.user.findUnique = vi.fn().mockResolvedValue({ id: 'u2', role: 'MANAGER', branchId: 'BRANCH-A', status: 'ACTIVE' })
      
      prismaTest.order.findMany = vi.fn().mockResolvedValue([])
      prismaTest.order.count = vi.fn().mockResolvedValue(0)
      prismaTest.order.aggregate = vi.fn().mockResolvedValue({ _sum: {}, _avg: {} })

      const api = testApi(getSalesReportsHandler)
      const startDate = new Date().toISOString()
      const endDate = new Date().toISOString()
      
      // Attempt to query BRANCH-B
      await api.get(`/api/v1/reporting/sales?startDate=${startDate}&endDate=${endDate}&branchId=BRANCH-B`)

      // Even though branchId=BRANCH-B was requested, the handler forces BRANCH-A due to RBAC
      expect(prismaTest.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ branchId: 'BRANCH-A' })
      }))
    })

    it('should validate query filters and reject missing dates', async () => {
      const api = testApi(getSalesReportsHandler)
      const res = await api.get('/api/v1/reporting/sales?page=1') // missing dates

      expect(res.status).toBe(400)
      expect(res.body.code).toBe('VALIDATION_ERROR')
    })
  })
})
