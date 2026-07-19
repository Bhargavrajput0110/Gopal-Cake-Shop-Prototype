import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { DashboardKPIService } from '@/services/ReportingService';
import { z } from 'zod';

const DashboardQuerySchema = z.object({
  date: z.string().datetime().optional(),
  branchId: z.string().optional(),
});

export const GET = withApiHandler(async (ctx) => {
  const searchParams = Object.fromEntries(ctx.req.nextUrl.searchParams.entries());
  const query = DashboardQuerySchema.parse(searchParams);

  // RBAC: Non-admins are always scoped to their own branch
  const branchId =
    ctx.appRole === 'ADMIN'
      ? (query.branchId ?? null)
      : ctx.branchId;

  const kpis = await DashboardKPIService.getKPIs({
    branchId,
    date: query.date ? new Date(query.date) : undefined,
  });

  return NextResponse.json(
    { success: true, data: kpis },
    { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' } }
  );
}, false, 'manage_reports');
