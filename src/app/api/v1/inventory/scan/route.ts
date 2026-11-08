import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InventoryUnitStatus } from '@prisma/client';
import { auth } from '@/auth';

// POST: Scan barcode at sales counter to lookup or deduct item
export async function POST(req: NextRequest) {
  try {
    // ── AUTH GUARD ─────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any)?.role?.toUpperCase() as string;
    const rawPerms = (session.user as any)?.customPermissions;
    let customPerms: Record<string, boolean> = {};
    if (rawPerms) {
      try {
        customPerms = typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms;
      } catch (e) {}
    }

    // Any user who can access inventory (inc. salesperson) can scan barcodes.
    const canScan =
      role === 'ADMIN' ||
      role === 'MANAGER' ||
      role === 'SALESPERSON' ||
      customPerms['inventory_management'] === true ||
      customPerms['inv_view'] === true ||
      customPerms['inv_inward'] === true ||
      customPerms['inv_hot_bakes'] === true ||
      customPerms['inv_brownie_trays'] === true ||
      customPerms['inv_kitchen_prep'] === true ||
      customPerms['inv_raw_ingredients'] === true ||
      customPerms['inv_eod_closing'] === true;

    if (!canScan) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to scan inventory barcodes.' },
        { status: 403 }
      );
    }

    // WASTAGE action requires explicit spoilage permission
    const body = await req.json();
    const { barcode, action = 'LOOKUP', orderId } = body;

    if (action === 'WASTAGE') {
      const canMarkWastage =
        role === 'ADMIN' ||
        role === 'MANAGER' ||
        customPerms['inv_spoilage_damage'] === true ||
        customPerms['inventory_management'] === true;
      if (!canMarkWastage) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have permission to mark items as wastage.' },
          { status: 403 }
        );
      }
    }
    // ──────────────────────────────────────────────────────────────────────

    if (!barcode) {
      return NextResponse.json({ success: false, error: 'Barcode is required' }, { status: 400 });
    }

    const trimmedBarcode = barcode.trim().toUpperCase();

    // Branch isolation for SALESPERSON: they can only scan their own branch's items
    const userBranchId = (session.user as any)?.branchId;

    const unit = await prisma.inventoryUnit.findUnique({
      where: { barcode: trimmedBarcode },
      include: {
        product: { select: { id: true, name: true, thumbnail: true, basePrice: true } },
        branch: { select: { id: true, name: true, code: true } },
        batch: { select: { id: true, title: true, batchDate: true } }
      }
    });

    if (!unit) {
      return NextResponse.json({
        success: false,
        notFound: true,
        error: `Barcode "${trimmedBarcode}" not found in inventory`
      }, { status: 404 });
    }

    // Branch check: SALESPERSON can only interact with their assigned branch
    if (role === 'SALESPERSON' && userBranchId && unit.branchId !== userBranchId) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: This item belongs to a different branch.'
      }, { status: 403 });
    }

    const now = new Date();
    const isPastBestBefore = Boolean(unit.bestBeforeDate && new Date(unit.bestBeforeDate) < now);
    if (unit.status === InventoryUnitStatus.EXPIRED || isPastBestBefore) {
      if (unit.status !== InventoryUnitStatus.EXPIRED) {
        await prisma.inventoryUnit.update({
          where: { id: unit.id },
          data: { status: InventoryUnitStatus.EXPIRED }
        });
      }
      return NextResponse.json({
        success: false,
        isExpired: true,
        error: `⛔ EXPIRED PRODUCT: Best before date was ${unit.bestBeforeDate ? new Date(unit.bestBeforeDate).toLocaleDateString() : 'past'}. Expired items cannot be sold.`,
        unit
      }, { status: 410 });
    }

    // If LOOKUP only (e.g. adding to cart before checkout)
    if (action === 'LOOKUP') {
      if (unit.status !== InventoryUnitStatus.IN_STOCK) {
        return NextResponse.json({
          success: false,
          isAlreadySold: unit.status === InventoryUnitStatus.SOLD,
          error: `Item was already marked as ${unit.status}${unit.soldAt ? ` on ${new Date(unit.soldAt).toLocaleTimeString()}` : ''}`,
          unit
        }, { status: 409 });
      }

      return NextResponse.json({
        success: true,
        unit: {
          id: unit.id,
          barcode: unit.barcode,
          itemTitle: unit.itemTitle,
          category: unit.category,
          variantWeight: unit.variantWeight,
          flavor: unit.flavor,
          sellingPrice: Number(unit.sellingPrice),
          productId: unit.productId,
          branchName: unit.branch?.name,
          thumbnail: unit.product?.thumbnail
        }
      });
    }

    // If DEDUCT / SELL
    if (action === 'SELL') {
      if (unit.status === InventoryUnitStatus.SOLD) {
        return NextResponse.json({
          success: false,
          error: `Double Scan Alert: This item was already sold in order #${unit.soldOrderId || 'N/A'}`
        }, { status: 409 });
      }

      const updated = await prisma.inventoryUnit.update({
        where: { id: unit.id },
        data: {
          status: InventoryUnitStatus.SOLD,
          soldAt: new Date(),
          soldOrderId: orderId || undefined,
          soldPrice: unit.sellingPrice
        }
      });

      // Update parent batch count
      await prisma.inventoryBatch.update({
        where: { id: unit.batchId },
        data: {
          soldQty: { increment: 1 },
          closingQty: { decrement: 1 }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Item marked as sold and deducted from counter inventory',
        unit: updated
      });
    }

    // If MARK WASTAGE / DAMAGED
    if (action === 'WASTAGE') {
      const { reason } = body;
      const updated = await prisma.inventoryUnit.update({
        where: { id: unit.id },
        data: {
          status: InventoryUnitStatus.DAMAGED,
          damagedAt: new Date(),
          damageReason: reason || 'Expired / Damaged'
        }
      });

      await prisma.inventoryBatch.update({
        where: { id: unit.batchId },
        data: {
          damagedQty: { increment: 1 },
          closingQty: { decrement: 1 }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Item marked as wastage',
        unit: updated
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/v1/inventory/scan error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
