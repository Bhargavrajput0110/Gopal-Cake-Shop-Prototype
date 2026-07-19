import { withApiHandler } from '@/lib/withApiHandler'
import { CustomerService } from '@/services/CustomerService'
import { successResponse, errorResponse } from '@/lib/apiUtils'

/**
 * @swagger
 * /api/v1/customers/me:
 *   get:
 *     summary: Get current logged in customer
 */
export const GET = withApiHandler(async ({ user, requestId }) => {
  // We assume the phone number is stored in user_metadata for customers.
  // In a real OTP setup, the user email or phone is primary.
  const phone = user.phone || user.user_metadata?.phone
  if (!phone) {
    return errorResponse('Customer profile not linked', 'NOT_FOUND', 404, [], requestId)
  }

  const customer = await CustomerService.getCustomerByPhone(phone)
  if (!customer) {
    return errorResponse('Customer not found in CRM', 'NOT_FOUND', 404, [], requestId)
  }

  return successResponse(customer, 'Customer fetched successfully', requestId)
})
