import { withApiHandler } from '@/lib/withApiHandler'
import { OrderService } from '@/services/OrderService'
import { CreateDraftOrderSchema } from '@/dtos/OrderSchemas'
import { successResponse, createdResponse, paginatedResponse } from '@/lib/apiUtils'

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: List draft orders
 *     description: Returns a paginated list of orders, isolated by branch for branch staff.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 */
export const GET = withApiHandler(async ({ req, appRole, branchId, requestId }) => {
  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const status = searchParams.get('status') || undefined
  const branch = searchParams.get('branch') || undefined
  const search = searchParams.get('search') || undefined
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined
  const sortField = searchParams.get('sortField') || undefined
  const sortOrder = searchParams.get('sortOrder') || undefined

  const { data, total } = await OrderService.listOrders(branchId, appRole, page, limit, { status, branch, search, startDate, endDate, sortField, sortOrder })
  return paginatedResponse(data, page, limit, total, 'Orders fetched successfully', requestId)
})

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create a draft order
 */
export const POST = withApiHandler(async ({ req, appRole, branchId, requestId }) => {
  const body = await req.json()
  const payload = CreateDraftOrderSchema.parse(body)

  const order = await OrderService.createDraftOrder(payload, branchId, appRole)
  return createdResponse(order, 'Draft order created successfully', requestId)
}, true)
