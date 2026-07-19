import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { testApi } from '../../utils/api-tester'
import { GET as getSettingsHandler, PUT as updateSettingsHandler } from '@/app/api/v1/settings/route'
import { resetDatabase } from '../../setup/db-reset'
import { prismaTest } from '../../setup/prisma-test'

vi.mock('@/lib/prisma', async () => {
  const actual = await vi.importActual<any>('../../setup/prisma-test')
  return { prisma: actual.prismaTest }
})

import { revalidateTag } from 'next/cache'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

const mockGetUser = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser
    }
  }))
}))

describe('Phase 5.1: Administrative APIs - Configuration (@integration)', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
    
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

  describe('GET /api/v1/settings', () => {
    it('should return 200 and list settings for Admin', async () => {
      prismaTest.settings.findMany = vi.fn().mockResolvedValue([{ id: 's1', key: 'STORE_HOURS', value: '9-5', updatedAt: new Date() }])

      const api = testApi(getSettingsHandler)
      const res = await api.get('/api/v1/settings')

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(1)
    })

    it('should reject access for CHEF (RBAC)', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'u-chef-1', email: 'chef@example.com', user_metadata: { role: 'CHEF', branchId: 'BRANCH-A' } }
        }
      })
      prismaTest.user.findUnique = vi.fn().mockResolvedValue({ id: 'u-chef-1', role: 'CHEF', branchId: 'BRANCH-A', status: 'ACTIVE' })

      const api = testApi(getSettingsHandler)
      const res = await api.get('/api/v1/settings')

      expect(res.status).toBe(403) // Forbidden via role check inside the handler
    })
  })

  describe('PUT /api/v1/settings', () => {
    it('should update configuration, write audit log, and invalidate cache', async () => {
      const txMocks = {
        settings: { update: vi.fn().mockResolvedValue({ id: 's1', key: 'STORE_HOURS', value: '10-6', updatedAt: new Date() }) },
        auditLog: { create: vi.fn().mockResolvedValue({}) }
      }
      prismaTest.$transaction = vi.fn().mockImplementation(async (cb) => await cb(txMocks))

      const api = testApi(updateSettingsHandler)
      const res = await api.put('/api/v1/settings', { key: 'STORE_HOURS', value: '10-6' })

      expect(res.status).toBe(200)
      
      // Verify Side effects
      expect(txMocks.settings.update).toHaveBeenCalled()
      expect(txMocks.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'UPDATE_SETTING', tableName: 'SETTINGS' })
      }))
      
      // Verify Cache Invalidation
      expect(revalidateTag).toHaveBeenCalledWith('settings')
    })
  })
})
