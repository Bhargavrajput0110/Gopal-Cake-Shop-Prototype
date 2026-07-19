import { getIsolatedPrisma } from '@/lib/prisma'
import { CreateCouponDTO, UpdateCouponDTO, CouponResponseDTO } from '@/dtos/CouponSchemas'
import { Prisma } from '@prisma/client'

export class CouponService {
  static async listCoupons(
    branchId: string | null,
    role: string | null,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: CouponResponseDTO[], total: number }> {
    const db = getIsolatedPrisma(branchId, role)
    const skip = (page - 1) * limit
    
    const [coupons, total] = await Promise.all([
      db.coupon.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.coupon.count(),
    ])

    return {
      data: coupons.map(c => ({
        id: c.id,
        code: c.code,
        discountType: c.discountType,
        discountValue: Number(c.discountValue),
        isActive: c.isActive,
      })),
      total,
    }
  }

  static async createCoupon(
    data: CreateCouponDTO,
    branchId: string | null,
    role: string | null
  ): Promise<CouponResponseDTO> {
    const db = getIsolatedPrisma(branchId, role)
    
    const c = await db.coupon.create({
      data: {
        code: data.code,
        discountType: data.discountType,
        discountValue: new Prisma.Decimal(data.discountValue),
        minOrderValue: data.minOrderValue ? new Prisma.Decimal(data.minOrderValue) : null,
        maxDiscount: data.maxDiscount ? new Prisma.Decimal(data.maxDiscount) : null,
        usageLimit: data.usageLimit,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        isActive: data.isActive ?? true,
        applicableBranchId: data.applicableBranchId,
        applicableCategoryId: data.applicableCategoryId,
      },
    })

    return {
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
      isActive: c.isActive,
    }
  }
}
