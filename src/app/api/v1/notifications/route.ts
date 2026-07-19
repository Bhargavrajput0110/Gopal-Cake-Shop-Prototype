import { withApiHandler } from '@/lib/withApiHandler'
import { NotificationLogService } from '@/services/NotificationLogService'
import { paginatedResponse } from '@/lib/apiUtils'

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: List notification logs
 */
export const GET = withApiHandler(async ({ req, appRole, branchId, requestId }) => {
  const { searchParams } = req.nextUrl
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const { data, total } = await NotificationLogService.listLogs(branchId, appRole, page, limit)
  return paginatedResponse(data, page, limit, total, 'Notification logs fetched successfully', requestId)
})
