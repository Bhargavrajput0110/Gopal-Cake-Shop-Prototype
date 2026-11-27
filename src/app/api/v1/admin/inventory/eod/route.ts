import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { executeEodClosing } from '@/lib/inventory/eod-audit';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any)?.role?.toUpperCase();
    const rawPerms = (session.user as any)?.customPermissions;
    let customPerms: Record<string, boolean> = {};
    if (rawPerms) {
      try {
        customPerms = typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms;
      } catch (e) {}
    }

    const canRunEOD = role === 'ADMIN' || 
      role === 'MANAGER' || 
      customPerms['inventory_management'] === true || 
      customPerms['inv_eod_closing'] === true;
    if (!canRunEOD) {
      return NextResponse.json({ 
        success: false, 
        error: "Forbidden: You do not have permission to run the End-of-Day store closing wizard." 
      }, { status: 403 });
    }
    const body = await req.json();
    let { 
      branchId, 
      dispositions = [], 
      cashReconciliation, 
      closingNotes 
    } = body;

    // Branch Isolation: strictly lock SALESPERSON to their assigned branch
    if (role === 'SALESPERSON') {
      const userBranchId = (session.user as any)?.branchId;
      if (!userBranchId) {
        return NextResponse.json({ success: false, error: "Forbidden: No branch is assigned to your salesperson account." }, { status: 403 });
      }
      branchId = userBranchId;
    }

    if (!branchId) {
      return NextResponse.json({ success: false, error: "branchId is required" }, { status: 400 });
    }

    const userId = session?.user?.id || undefined;

    // Delegate execution to domain lifecycle function
    const result = await executeEodClosing({
      branchId,
      dispositions,
      cashReconciliation,
      closingNotes,
      actorId: userId
    }, prisma);

    return NextResponse.json({
      success: true,
      message: "End-of-Day closing and register reconciliation completed successfully.",
      summary: result
    });
  } catch (error: any) {
    console.error("POST /api/v1/admin/inventory/eod error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
