import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch prep stocks (Sponges, Creams, Fillings) with branch & category filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const category = searchParams.get('category'); // SPONGE, CREAM, FILLING, BASE, SYRUP

    const where: any = {};
    if (branchId && branchId !== 'ALL') {
      where.OR = [
        { branchId: branchId },
        { branchId: null } // Central Warasiya factory / common to all
      ];
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const items = await prisma.prepStock.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } }
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    const totalSpongesCount = items
      .filter(i => i.category === 'SPONGE')
      .reduce((sum, i) => sum + Number(i.currentStock), 0);

    const totalCreamsKg = items
      .filter(i => i.category === 'CREAM')
      .reduce((sum, i) => sum + Number(i.currentStock), 0);

    const lowStockAlerts = items.filter(
      i => Number(i.currentStock) <= Number(i.minAlertLevel)
    ).length;

    return NextResponse.json({
      success: true,
      items,
      stats: {
        totalItemsCount: items.length,
        totalSpongesCount: Math.round(totalSpongesCount),
        totalCreamsKg: Math.round(totalCreamsKg),
        lowStockAlerts
      }
    });
  } catch (err: any) {
    console.error("GET /api/v1/admin/inventory/prep error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Add new prep stock or Chef Log / Quick Deduct
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      action = 'CREATE_OR_UPDATE', 
      id, 
      name, 
      category = 'SPONGE', 
      flavor, 
      currentStock = 0, 
      unit = 'pcs', 
      minAlertLevel = 5, 
      costPerUnit = 0, 
      branchId, 
      adjustmentQty, 
      operation = 'SUBTRACT',
      notes,
      bestBeforeDate,
      shelfLifeDays = 3
    } = body;

    // Action: Chef Log / Quick Adjust (-1, -5, +10)
    if (action === 'CHEF_LOG' || action === 'ADJUST_STOCK') {
      if (!id || adjustmentQty === undefined) {
        return NextResponse.json({ success: false, error: "Item ID and adjustment quantity are required" }, { status: 400 });
      }

      const existing = await prisma.prepStock.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ success: false, error: "Prep stock item not found" }, { status: 404 });
      }

      const newStock = operation === 'ADD'
        ? Number(existing.currentStock) + Number(adjustmentQty)
        : Math.max(0, Number(existing.currentStock) - Number(adjustmentQty));

      const updated = await prisma.prepStock.update({
        where: { id },
        data: { currentStock: newStock }
      });

      return NextResponse.json({
        success: true,
        message: `${operation === 'ADD' ? 'Added' : 'Chef consumed'} ${adjustmentQty} ${existing.unit} of ${existing.name}. Remaining: ${newStock}`,
        item: updated
      });
    }

    // Action: Create or Update Prep Item
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Item name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    let computedBestBefore: Date | null = null;
    if (bestBeforeDate) {
      computedBestBefore = new Date(bestBeforeDate);
    } else if (shelfLifeDays) {
      computedBestBefore = new Date();
      computedBestBefore.setDate(computedBestBefore.getDate() + Number(shelfLifeDays));
      computedBestBefore.setHours(23, 59, 59, 999);
    }

    const existing = await prisma.prepStock.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
        ...(branchId && branchId !== 'ALL' ? { branchId } : {})
      }
    });

    let item;
    if (existing) {
      item = await prisma.prepStock.update({
        where: { id: existing.id },
        data: {
          category,
          flavor: flavor || existing.flavor,
          currentStock: currentStock !== undefined ? Number(currentStock) : existing.currentStock,
          unit: unit || existing.unit,
          minAlertLevel: minAlertLevel !== undefined ? Number(minAlertLevel) : existing.minAlertLevel,
          costPerUnit: costPerUnit !== undefined ? Number(costPerUnit) : existing.costPerUnit,
          branchId: branchId && branchId !== 'ALL' ? branchId : null,
          notes: notes || existing.notes,
          bestBeforeDate: computedBestBefore || existing.bestBeforeDate
        }
      });
    } else {
      item = await prisma.prepStock.create({
        data: {
          name: trimmedName,
          category,
          flavor: flavor || null,
          currentStock: Number(currentStock) || 0,
          unit: unit || 'pcs',
          minAlertLevel: Number(minAlertLevel) || 5,
          costPerUnit: Number(costPerUnit) || 0,
          branchId: branchId && branchId !== 'ALL' ? branchId : null,
          notes: notes || null,
          bestBeforeDate: computedBestBefore
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Prep stock item "${item.name}" saved successfully`,
      item
    });
  } catch (err: any) {
    console.error("POST /api/v1/admin/inventory/prep error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Modify an existing prep stock item
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, category, flavor, currentStock, minAlertLevel, unit, bestBeforeDate } = body;

    if (!id) return NextResponse.json({ success: false, error: "Item ID required" }, { status: 400 });

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (category !== undefined) dataToUpdate.category = category;
    if (flavor !== undefined) dataToUpdate.flavor = flavor;
    if (currentStock !== undefined) dataToUpdate.currentStock = Number(currentStock);
    if (minAlertLevel !== undefined) dataToUpdate.minAlertLevel = Number(minAlertLevel);
    if (unit !== undefined) dataToUpdate.unit = unit;
    if (bestBeforeDate !== undefined) {
      dataToUpdate.bestBeforeDate = bestBeforeDate ? new Date(bestBeforeDate) : null;
    }

    const updated = await prisma.prepStock.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({
      success: true,
      message: "Prep stock item updated successfully",
      item: updated
    });
  } catch (err: any) {
    console.error("PUT /api/v1/admin/inventory/prep error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a prep stock item
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: "Item ID required" }, { status: 400 });

    await prisma.prepStock.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Prep item deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/v1/admin/inventory/prep error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
