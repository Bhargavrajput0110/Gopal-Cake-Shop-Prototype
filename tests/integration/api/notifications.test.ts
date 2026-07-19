import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { testApi } from '../../utils/api-tester'
import { GET as getInboxHandler } from '@/app/api/v1/notifications/inbox/route'
import { PATCH as updateInboxHandler } from '@/app/api/v1/notifications/inbox/[id]/route'
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

describe('Phase 5.3: Administrative APIs - Notifications (@integration)', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
    
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'user@example.com', user_metadata: { role: 'MANAGER', branchId: null } }
      }
    })
    prismaTest.user.findUnique = vi.fn().mockResolvedValue({ id: 'u1', role: 'MANAGER', branchId: null, status: 'ACTIVE' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/v1/notifications/inbox', () => {
    it('should retrieve notifications with correct ordering and filter out expired', async () => {
      // Mock db returns
      prismaTest.inAppNotification.findMany = vi.fn().mockResolvedValue([
        { id: '1', priority: 'HIGH', isRead: false, createdAt: new Date() },
        { id: '2', priority: 'NORMAL', isRead: false, createdAt: new Date() },
        { id: '3', priority: 'NORMAL', isRead: true, createdAt: new Date() },
        { id: '4', priority: 'LOW', isRead: false, expiresAt: new Date(Date.now() - 10000) } // Expired
      ])

      const api = testApi(getInboxHandler)
      const res = await api.get('/api/v1/notifications/inbox')

      expect(res.status).toBe(200)
      // Check filtering: item 4 should be filtered out because it's expired
      expect(res.body.data.length).toBe(3)
      
      // The handler explicitly passes the nested ordering array to Prisma
      expect(prismaTest.inAppNotification.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: [
          { isRead: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      }))
    })
  })

  describe('PATCH /api/v1/notifications/inbox/[id]', () => {
    it('should mark a notification as read and verify ownership', async () => {
      prismaTest.inAppNotification.findUnique = vi.fn().mockResolvedValue({ id: 'notif-1', userId: 'u1' })
      prismaTest.inAppNotification.update = vi.fn().mockResolvedValue({ id: 'notif-1', isRead: true })

      const api = testApi(updateInboxHandler)
      const res = await api.patch('/api/v1/notifications/inbox/notif-1', { action: 'read' }, {}, { id: 'notif-1' })

      expect(res.status).toBe(200)
      expect(prismaTest.inAppNotification.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'notif-1' },
        data: { isRead: true }
      }))
    })

    it('should dismiss a notification', async () => {
      prismaTest.inAppNotification.findUnique = vi.fn().mockResolvedValue({ id: 'notif-1', userId: 'u1' })
      prismaTest.inAppNotification.update = vi.fn().mockResolvedValue({ id: 'notif-1', isDismissed: true })

      const api = testApi(updateInboxHandler)
      const res = await api.patch('/api/v1/notifications/inbox/notif-1', { action: 'dismiss' }, {}, { id: 'notif-1' })

      expect(res.status).toBe(200)
      expect(prismaTest.inAppNotification.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'notif-1' },
        data: { isDismissed: true }
      }))
    })

    it('should reject access to another users notification', async () => {
      // Notification belongs to 'u2'
      prismaTest.inAppNotification.findUnique = vi.fn().mockResolvedValue({ id: 'notif-1', userId: 'u2' })

      const api = testApi(updateInboxHandler)
      const res = await api.patch('/api/v1/notifications/inbox/notif-1', { action: 'read' }, {}, { id: 'notif-1' })

      expect(res.status).toBe(404) // Handler returns 404 if ownership fails
    })
  })
})
