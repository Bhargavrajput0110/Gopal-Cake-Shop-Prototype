import { withApiHandler } from '@/lib/withApiHandler'
import { CustomerService } from '@/services/CustomerService'
import { CreateCustomerSchema } from '@/dtos/CustomerSchemas'
import { successResponse, createdResponse, paginatedResponse, errorResponse } from '@/lib/apiUtils'

/**
 * @swagger
 * /api/v1/customers:
 *   get:
 *     summary: List all customers
 *     description: Admins and Sales can view customer list.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *   post:
 *     summary: Create a new customer
 */
export const GET = withApiHandler(async ({ req, appRole, requestId }) => {
  if (appRole !== 'ADMIN' && appRole !== 'SALESPERSON' && appRole !== 'MANAGER') {
    return errorResponse('Forbidden', 'FORBIDDEN', 403, [], requestId)
  }

  const { searchParams } = req.nextUrl
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const data = await CustomerService.listCustomers()
  const total = data.length
  
  // Fake pagination based on the fetched data (since v1 needs page/limit)
  const paginatedData = data.slice((page - 1) * limit, page * limit)
  return paginatedResponse(paginatedData, page, limit, total, 'Customers fetched successfully', requestId)
})

export const POST = withApiHandler(async ({ req, requestId }) => {
  // Public or internal can create customers (e.g. self-registration or staff creating)
  const body = await req.json()
  const payload = CreateCustomerSchema.parse(body)

  const customer = await CustomerService.createCustomer(payload)
  return createdResponse(customer, 'Customer created successfully', requestId)
})
