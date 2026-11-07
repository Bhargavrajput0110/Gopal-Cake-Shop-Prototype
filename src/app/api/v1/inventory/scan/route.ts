import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InventoryUnitStatus } from '@prisma/client';

// POST: Scan barcode at sales counter to lookup or deduct item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { barcode, action = 'LOOKUP', orderId, cashierName } = body;

    if (!barcode) {
      return NextResponse.json({ success: false, error: "Barcode is required" }, { status: 400 });
    }

    const trimmedBarcode = barcode.trim();

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
        message: "Item marked as sold and deducted from counter inventory",
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
          damageReason: reason || "Expired / Damaged"
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
        message: "Item marked as wastage",
        unit: updated
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/v1/inventory/scan error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
