import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiHandler } from "@/lib/withApiHandler"
import { z } from "zod"

const updateCouponSchema = z.object({
  code: z.string().min(1).optional(),
  discountType: z.enum(["FLAT", "PERCENTAGE"]).optional(),
  discountValue: z.number().positive().optional(),
  minOrderValue: z.number().nullable().optional(),
  maxDiscount: z.number().nullable().optional(),
  usageLimit: z.number().nullable().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

export const PATCH = withApiHandler(async (ctx) => {
  const body = await ctx.req.json()
  const data = updateCouponSchema.parse(body)
  const id = ctx.params.id

  if (data.code) {
    const existing = await prisma.coupon.findUnique({ where: { code: data.code } })
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
    }
  }

  const updateData: any = { ...data }
  if (data.validFrom !== undefined) {
    updateData.validFrom = data.validFrom ? new Date(data.validFrom) : null
  }
  if (data.validUntil !== undefined) {
    updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: updateData
  })

  return NextResponse.json(coupon)
})

export const DELETE = withApiHandler(async (ctx) => {
  await prisma.coupon.delete({
    where: { id: ctx.params.id }
  })
  return NextResponse.json({ success: true })
})
