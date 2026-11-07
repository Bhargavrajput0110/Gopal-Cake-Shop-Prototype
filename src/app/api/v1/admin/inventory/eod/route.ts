import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { LedgerEntryType, PaymentMethod, PaymentStatus } from '@prisma/client';

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
    const { 
      branchId, 
      dispositions = [], 
      cashReconciliation, 
      closingNotes 
    } = body;

    if (!branchId) {
      return NextResponse.json({ success: false, error: "branchId is required" }, { status: 400 });
    }

    const now = new Date();
    const userId = session?.user?.id || null;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Process Hot Bakes Leftover Dispositions
      const processedBatches: any[] = [];
      for (const disp of dispositions) {
        if (!disp.batchId) continue;
        const batch = await tx.inventoryBatch.findUnique({
          where: { id: disp.batchId }
        });
        if (!batch) continue;

        const remainingQty = Number(disp.remainingQty) || 0;
        const action = disp.action || 'ROLLOVER'; // 'DISCARD' | 'STAFF_MEAL' | 'ROLLOVER'
        const reason = disp.reason || (action === 'STAFF_MEAL' ? 'Staff Consumed' : 'Unsold at closing');

        let updatedData: any = {
          isClosed: true,
          closedAt: now,
          notes: [batch.notes, `[EOD Close: ${action} - ${remainingQty} pcs (${reason})]`].filter(Boolean).join(' ')
        };

        if (action === 'DISCARD' || action === 'STAFF_MEAL') {
          updatedData.damagedQty = { increment: remainingQty };
          updatedData.closingQty = 0;
        } else if (action === 'ROLLOVER') {
          updatedData.closingQty = remainingQty;
        }

        const updated = await tx.inventoryBatch.update({
          where: { id: disp.batchId },
          data: updatedData
        });
        processedBatches.push(updated);
      }

      // 2. Mark all today's active batches for this branch as closed
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      await tx.inventoryBatch.updateMany({
        where: {
          branchId,
          isClosed: false,
          createdAt: { gte: startOfToday }
        },
        data: {
          isClosed: true,
          closedAt: now
        }
      });

      // 3. Record Cash Reconciliation Ledger Entry if provided
      let ledgerEntry = null;
      if (cashReconciliation && (cashReconciliation.physicalCash !== undefined || cashReconciliation.systemCash !== undefined)) {
        const sysCash = Number(cashReconciliation.systemCash) || 0;
        const phyCash = Number(cashReconciliation.physicalCash) || 0;
        const variance = phyCash - sysCash;

        ledgerEntry = await tx.ledgerEntry.create({
          data: {
            type: LedgerEntryType.PAYMENT,
            amount: phyCash,
            currency: 'INR',
            method: PaymentMethod.CASH,
            status: PaymentStatus.SUCCESS,
            actorId: userId,
            branchId,
            notes: `[EOD CASH CLOSE] System: ₹${sysCash} | Physical Count: ₹${phyCash} | Variance: ${variance >= 0 ? '+' : ''}₹${variance} ${closingNotes ? `| Notes: ${closingNotes}` : ''}`
          }
        });
      }

      return {
        processedBatchesCount: processedBatches.length,
        ledgerEntryId: ledgerEntry?.id || null,
        closedAt: now
      };
    });

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

