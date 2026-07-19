import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { ReportingService } from '@/services/ReportingService'
import { z } from 'zod'

const ReportingQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  branchId: z.string().optional()
})

export const GET = withApiHandler(async (ctx) => {
  const searchParams = Object.fromEntries(ctx.req.nextUrl.searchParams.entries())
  const query = ReportingQuerySchema.parse(searchParams)

  let targetBranch = query.branchId || null
  if (ctx.appRole !== 'ADMIN') {
    targetBranch = ctx.branchId
  }

  const result = await ReportingService.getDeliveryMetrics({
    startDate: new Date(query.startDate),
    endDate: new Date(query.endDate),
    branchId: targetBranch
  })

  return NextResponse.json({ success: true, data: result })
}, false, 'manage_reports')
