import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { generateCaMonthlyReport } from '@/lib/inventory/eod-audit';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role?.toUpperCase();
    const rawPerms = (session?.user as any)?.customPermissions;
    let customPerms: Record<string, boolean> = {};
    if (rawPerms) {
      try {
        customPerms = typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms;
      } catch (e) {}
    }

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canAccessMonthlyReport = role === 'ADMIN' || customPerms['inv_ca_monthly_report'] === true;
    if (!canAccessMonthlyReport) {
      return NextResponse.json({ 
        success: false, 
        error: "Forbidden: Monthly Tax & Financial Statements for CA are strictly confidential and restricted by Rishi Bhai." 
      }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);

    const monthParam = searchParams.get('month'); // 1-12
    const yearParam = searchParams.get('year'); // e.g. 2026
    let branchId = searchParams.get('branchId') || 'ALL';

    // Branch Isolation: strictly lock SALESPERSON to their assigned branch
    if (role === 'SALESPERSON') {
      const userBranchId = (session.user as any)?.branchId;
      if (!userBranchId) {
        return NextResponse.json({ success: false, error: "Forbidden: No branch assigned to your salesperson account." }, { status: 403 });
      }
      branchId = userBranchId;
    } else if (role !== 'ADMIN' && branchId === 'ALL') {
      const userBranchId = (session.user as any)?.branchId;
      if (userBranchId) branchId = userBranchId;
    }

    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    // Delegate compilation to domain lifecycle report generator
    const report = await generateCaMonthlyReport({
      month,
      year,
      branchId: branchId === 'ALL' ? undefined : branchId,
      userRole: role,
      hasPermission: canAccessMonthlyReport
    }, prisma);

    return NextResponse.json({
      success: true,
      ...report,
      generatedBy: session?.user?.name || report.generatedBy || "Store Admin"
    });
  } catch (error: any) {
    console.error("GET /api/v1/admin/inventory/monthly-report error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
