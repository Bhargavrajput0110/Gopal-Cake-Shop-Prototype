import { z } from 'zod'

export const CreateCouponSchema = z.object({
  code: z.string().min(3),
  discountType: z.enum(['FLAT', 'PERCENTAGE']),
  discountValue: z.number().positive(),
  minOrderValue: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  applicableBranchId: z.string().optional(),
  applicableCategoryId: z.string().optional(),
})

export type CreateCouponDTO = z.infer<typeof CreateCouponSchema>

export const UpdateCouponSchema = CreateCouponSchema.partial()
export type UpdateCouponDTO = z.infer<typeof UpdateCouponSchema>

export type CouponResponseDTO = {
  id: string
  code: string
  discountType: string
  discountValue: number
  isActive: boolean
}
