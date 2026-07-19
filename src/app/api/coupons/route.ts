import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiHandler } from "@/lib/withApiHandler"
import { z } from "zod"

const createCouponSchema = z.object({
  code: z.string().min(1),
  discountType: z.enum(["FLAT", "PERCENTAGE"]),
  discountValue: z.number().positive(),
  minOrderValue: z.number().nullable().optional(),
  maxDiscount: z.number().nullable().optional(),
  usageLimit: z.number().nullable().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
})

export const GET = withApiHandler(async (ctx) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" }
  })
  return NextResponse.json(coupons)
})

export const POST = withApiHandler(async (ctx) => {
  const body = await ctx.req.json()
  const data = createCouponSchema.parse(body)

  const existing = await prisma.coupon.findUnique({
    where: { code: data.code }
  })
  
  if (existing) {
    return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
  }

  const coupon = await prisma.coupon.create({
    data: {
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
    }
  })

  return NextResponse.json(coupon)
})
