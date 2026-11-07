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

  // Raw Ingredients tab is ADMIN-sensitive (pantry cost visibility)
  const allowed =
    role === 'ADMIN' ||
    role === 'MANAGER' ||
    customPerms['inventory_management'] === true ||
    customPerms['inv_raw_ingredients'] === true;

  return { session, role, customPerms, allowed };
}

function effectiveBranchId(requestedId: string | null | undefined, role: string, session: any): string | null {
  if (role === 'SALESPERSON') {
    return (session.user as any)?.branchId || null;
  }
  return requestedId || null;
}
// ───────────────────────────────────────────────────────────────────────────

// GET all raw ingredients with branch filtering
export async function GET(req: NextRequest) {
  try {
    const { session, role, allowed } = await getSessionAndPerms();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden: Raw Ingredients access not permitted.' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const rawBranchId = searchParams.get('branchId');
    const branchId = effectiveBranchId(rawBranchId, role, session);

    const where: any = {};
    if (branchId && branchId !== 'ALL') {
      where.OR = [
        { branchId: branchId },
        { branchId: null } // items common to all or central kitchen
      ];
    }

    const ingredients = await prisma.rawIngredient.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } }
      },
      orderBy: { name: 'asc' }
    });

    const totalStockKg = ingredients
      .filter(i => i.unit === 'kg')
      .reduce((sum, i) => sum + Number(i.currentStock), 0);

    const lowStockAlerts = ingredients.filter(
      i => Number(i.currentStock) <= Number(i.minAlertLevel)
    ).length;

    return NextResponse.json({
      success: true,
      ingredients,
      stats: {
        totalItemsCount: ingredients.length,
        totalStockKg: Math.round(totalStockKg),
        lowStockAlerts
      }
    });
  } catch (err: any) {
    console.error('GET /api/v1/admin/inventory/raw error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Add or adjust raw ingredient stock with branch association
export async function POST(req: NextRequest) {
  try {
    const { session, role, customPerms, allowed } = await getSessionAndPerms();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden: Raw Ingredients access not permitted.' }, { status: 403 });

    const body = await req.json();
    const { name, category, currentStock, unit, minAlertLevel, costPerUnit, branchId: rawBranchId, notes, bestBeforeDate, shelfLifeDays, action = 'CREATE_OR_UPDATE' } = body;

    const branchId = effectiveBranchId(rawBranchId, role, session);

    if (action === 'ADJUST_STOCK') {
      const { id, adjustmentQty, operation = 'ADD' } = body;
      if (!id) return NextResponse.json({ success: false, error: 'Ingredient ID required' }, { status: 400 });

      const existing = await prisma.rawIngredient.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Ingredient not found' }, { status: 404 });
      }

      // Branch isolation for SALESPERSON
      if (role === 'SALESPERSON' && branchId && existing.branchId && existing.branchId !== branchId) {
        return NextResponse.json({ success: false, error: 'Forbidden: Ingredient belongs to a different branch.' }, { status: 403 });
      }

      const newQty = operation === 'ADD'
        ? Number(existing.currentStock) + Number(adjustmentQty)
        : Math.max(0, Number(existing.currentStock) - Number(adjustmentQty));

      const updated = await prisma.rawIngredient.update({
        where: { id },
        data: { currentStock: newQty }
      });

      return NextResponse.json({
        success: true,
        message: `Updated ${existing.name} stock to ${newQty} ${existing.unit}`,
        ingredient: updated
      });
    }

    // Create / Update: requires edit permission
    const canEdit = role === 'ADMIN' || role === 'MANAGER' || customPerms['inv_edit_delete'] === true;
    if (!canEdit) {
      return NextResponse.json({ success: false, error: 'Forbidden: Modify permission (inv_edit_delete) required to add/update raw ingredients.' }, { status: 403 });
    }

    if (!name) {
      return NextResponse.json({ success: false, error: 'Ingredient name is required' }, { status: 400 });
    }

    let computedBestBefore: Date | null = null;
    if (bestBeforeDate) {
      computedBestBefore = new Date(bestBeforeDate);
    } else if (shelfLifeDays) {
      computedBestBefore = new Date();
      computedBestBefore.setDate(computedBestBefore.getDate() + Number(shelfLifeDays));
      computedBestBefore.setHours(23, 59, 59, 999);
    }

    // Upsert by name + branchId
    const existing = await prisma.rawIngredient.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(branchId ? { branchId } : {})
      }
    });

    let ingredient;
    if (existing) {
      ingredient = await prisma.rawIngredient.update({
        where: { id: existing.id },
        data: {
          category: category || existing.category,
          currentStock: Number(currentStock) !== undefined ? Number(currentStock) : existing.currentStock,
          unit: unit || existing.unit,
          minAlertLevel: minAlertLevel !== undefined ? Number(minAlertLevel) : existing.minAlertLevel,
          costPerUnit: costPerUnit !== undefined ? Number(costPerUnit) : existing.costPerUnit,
          branchId: branchId !== undefined ? branchId : existing.branchId,
          notes: notes || existing.notes,
          bestBeforeDate: computedBestBefore || existing.bestBeforeDate
        }
      });
    } else {
      ingredient = await prisma.rawIngredient.create({
        data: {
          name: name.trim(),
          category: category || 'Dairy',
          currentStock: Number(currentStock) || 0,
          unit: unit || 'kg',
          minAlertLevel: Number(minAlertLevel) || 5,
          costPerUnit: Number(costPerUnit) || 0,
          branchId: branchId || null,
          notes,
          bestBeforeDate: computedBestBefore
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Raw ingredient "${ingredient.name}" saved successfully`,
      ingredient
    });
  } catch (err: any) {
    console.error('POST /api/v1/admin/inventory/raw error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Modify an existing raw ingredient
export async function PUT(req: NextRequest) {
  try {
    const { session, role, customPerms, allowed } = await getSessionAndPerms();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden: Raw Ingredients access not permitted.' }, { status: 403 });

    const canEdit = role === 'ADMIN' || role === 'MANAGER' || customPerms['inv_edit_delete'] === true;
    if (!canEdit) {
      return NextResponse.json({ success: false, error: 'Forbidden: Modify permission (inv_edit_delete) required.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, category, currentStock, unit, minAlertLevel, costPerUnit, bestBeforeDate } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Ingredient ID required' }, { status: 400 });

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (category !== undefined) dataToUpdate.category = category;
    if (currentStock !== undefined) dataToUpdate.currentStock = Number(currentStock);
    if (unit !== undefined) dataToUpdate.unit = unit;
    if (minAlertLevel !== undefined) dataToUpdate.minAlertLevel = Number(minAlertLevel);
    if (costPerUnit !== undefined) dataToUpdate.costPerUnit = Number(costPerUnit);
    if (bestBeforeDate !== undefined) {
      dataToUpdate.bestBeforeDate = bestBeforeDate ? new Date(bestBeforeDate) : null;
    }

    const updated = await prisma.rawIngredient.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, message: 'Raw ingredient updated successfully', ingredient: updated });
  } catch (err: any) {
    console.error('PUT /api/v1/admin/inventory/raw error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a raw ingredient
export async function DELETE(req: NextRequest) {
  try {
    const { session, role, customPerms, allowed } = await getSessionAndPerms();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden: Raw Ingredients access not permitted.' }, { status: 403 });

    const canDelete = role === 'ADMIN' || customPerms['inv_edit_delete'] === true;
    if (!canDelete) {
      return NextResponse.json({ success: false, error: 'Forbidden: Delete permission (inv_edit_delete) required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'Ingredient ID required' }, { status: 400 });

    await prisma.rawIngredient.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Raw ingredient deleted successfully' });
  } catch (err: any) {
    console.error('DELETE /api/v1/admin/inventory/raw error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
