import { withApiHandler } from '@/lib/withApiHandler'
import { CouponService } from '@/services/CouponService'
import { CreateCouponSchema } from '@/dtos/CouponSchemas'
import { createdResponse, paginatedResponse } from '@/lib/apiUtils'

/**
 * @swagger
 * /api/v1/coupons:
 *   get:
 *     summary: List coupons
 *   post:
 *     summary: Create a coupon
 */
export const GET = withApiHandler(async ({ req, appRole, branchId, requestId }) => {
  const { searchParams } = req.nextUrl
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const { data, total } = await CouponService.listCoupons(branchId, appRole, page, limit)
  return paginatedResponse(data, page, limit, total, 'Coupons fetched successfully', requestId)
})

export const POST = withApiHandler(async ({ req, appRole, branchId, requestId }) => {
  const body = await req.json()
  const payload = CreateCouponSchema.parse(body)

  const coupon = await CouponService.createCoupon(payload, branchId, appRole)
  return createdResponse(coupon, 'Coupon created successfully', requestId)
})
