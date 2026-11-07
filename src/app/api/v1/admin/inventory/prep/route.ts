import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// ── Shared auth helper ──────────────────────────────────────────────────────
async function getSessionAndPerms() {
  const session = await auth();
  if (!session?.user) return { session: null, role: '', customPerms: {} as Record<string, boolean>, allowed: false };

  const role = ((session.user as any)?.role || '').toUpperCase() as string;
  const rawPerms = (session.user as any)?.customPermissions;
  let customPerms: Record<string, boolean> = {};
  if (rawPerms) {
    try {
      customPerms = typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms;
    } catch (e) {}
  }

  const allowed =
    role === 'ADMIN' ||
    role === 'MANAGER' ||
    customPerms['inventory_management'] === true ||
    customPerms['inv_kitchen_prep'] === true;

  return { session, role, customPerms, allowed };
}

function effectiveBranchId(requestedId: string | null | undefined, role: string, session: any): string | null {
  if (role === 'SALESPERSON') {
    return (session.user as any)?.branchId || null;
  }
  return requestedId || null;
}
// ───────────────────────────────────────────────────────────────────────────

// GET: Fetch prep stocks (Sponges, Creams, Fillings) with branch & category filtering
export async function GET(req: NextRequest) {
  try {
    const { session, role, allowed } = await getSessionAndPerms();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden: Kitchen Prep access not permitted.' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const rawBranchId = searchParams.get('branchId');
    const category = searchParams.get('category');

    const branchId = effectiveBranchId(rawBranchId, role, session);

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
    console.error('GET /api/v1/admin/inventory/prep error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Add new prep stock or Chef Log / Quick Deduct
export async function POST(req: NextRequest) {
  try {
    const { session, role, customPerms, allowed } = await getSessionAndPerms();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden: Kitchen Prep access not permitted.' }, { status: 403 });

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
      branchId: rawBranchId,
      adjustmentQty,
      operation = 'SUBTRACT',
      notes,
      bestBeforeDate,
      shelfLifeDays = 3
    } = body;

    const branchId = effectiveBranchId(rawBranchId, role, session);

    // Action: Chef Log / Quick Adjust (-1, -5, +10)
    if (action === 'CHEF_LOG' || action === 'ADJUST_STOCK') {
      if (!id || adjustmentQty === undefined) {
        return NextResponse.json({ success: false, error: 'Item ID and adjustment quantity are required' }, { status: 400 });
      }

      const existing = await prisma.prepStock.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Prep stock item not found' }, { status: 404 });
      }

      // Branch isolation for SALESPERSON
      if (role === 'SALESPERSON' && branchId && existing.branchId && existing.branchId !== branchId) {
        return NextResponse.json({ success: false, error: 'Forbidden: Item belongs to a different branch.' }, { status: 403 });
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

    // Action: Create or Update — requires edit permission
    const canEdit = role === 'ADMIN' || role === 'MANAGER' || customPerms['inv_edit_delete'] === true;
    if (!canEdit) {
      return NextResponse.json({ success: false, error: 'Forbidden: Modify permission (inv_edit_delete) required to add/update prep items.' }, { status: 403 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Item name is required' }, { status: 400 });
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
    console.error('POST /api/v1/admin/inventory/prep error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Modify an existing prep stock item
export async function PUT(req: NextRequest) {
  try {
    const { session, role, customPerms, allowed } = await getSessionAndPerms();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden: Kitchen Prep access not permitted.' }, { status: 403 });

    const canEdit = role === 'ADMIN' || role === 'MANAGER' || customPerms['inv_edit_delete'] === true;
    if (!canEdit) {
      return NextResponse.json({ success: false, error: 'Forbidden: Modify permission (inv_edit_delete) required.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, category, flavor, currentStock, minAlertLevel, unit, bestBeforeDate } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Item ID required' }, { status: 400 });

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

    return NextResponse.json({ success: true, message: 'Prep stock item updated successfully', item: updated });
  } catch (err: any) {
    console.error('PUT /api/v1/admin/inventory/prep error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a prep stock item
export async function DELETE(req: NextRequest) {
  try {
    const { session, role, customPerms, allowed } = await getSessionAndPerms();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden: Kitchen Prep access not permitted.' }, { status: 403 });

    const canDelete = role === 'ADMIN' || customPerms['inv_edit_delete'] === true;
    if (!canDelete) {
      return NextResponse.json({ success: false, error: 'Forbidden: Delete permission (inv_edit_delete) required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'Item ID required' }, { status: 400 });

    await prisma.prepStock.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Prep item deleted successfully' });
  } catch (err: any) {
    console.error('DELETE /api/v1/admin/inventory/prep error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
