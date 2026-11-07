import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// ── Shared auth helper ──────────────────────────────────────────────────────
async function getSessionAndPerms() {
  const session = await auth();
  if (!session?.user) return { session: null, role: '', customPerms: {}, allowed: false };

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
    customPerms['inv_brownie_trays'] === true;

  return { session, role, customPerms, allowed };
}

function effectiveBranchId(requestedId: string | null, role: string, session: any): string | null {
  if (role === 'SALESPERSON') {
    return (session.user as any)?.branchId || null;
  }
  return requestedId;
}
// ───────────────────────────────────────────────────────────────────────────

// GET: Fetch brownie trays by branch & date filter
export async function GET(req: NextRequest) {
  try {
    const { session, role, allowed } = await getSessionAndPerms();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden: Brownie Tray access not permitted.' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const rawBranchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const dateFilter = searchParams.get('dateFilter') || 'ALL';

    // Branch isolation for SALESPERSON
    const branchId = effectiveBranchId(rawBranchId, role, session);

    const where: any = {};
    if (branchId && branchId !== 'ALL') {
      where.branchId = branchId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    if (dateFilter === 'TODAY') {
      where.createdAt = { gte: startOfToday, lte: endOfToday };
    } else if (dateFilter === 'YESTERDAY') {
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const endOfYesterday = new Date(startOfYesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startOfYesterday, lte: endOfYesterday };
    } else if (dateFilter === 'LAST_7_DAYS') {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.createdAt = { gte: sevenDaysAgo, lte: endOfToday };
    }

    const trays = await prisma.brownieTray.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } }
      },
      orderBy: [{ createdAt: 'desc' }]
    });

    const activeTrays = trays.filter(t => t.status === 'CUT_INTO_PIECES' || t.status === 'UNOPENED');
    const totalPiecesAvailable = activeTrays.reduce((sum, t) => sum + Math.max(0, t.totalPieces - t.soldPieces), 0);
    const totalPiecesSold = trays.reduce((sum, t) => sum + t.soldPieces, 0);

    return NextResponse.json({
      success: true,
      trays,
      stats: {
        activeTraysCount: activeTrays.length,
        totalPiecesAvailable,
        totalPiecesSold,
        totalTraysRecorded: trays.length
      }
    });
  } catch (err: any) {
    console.error('GET /api/v1/admin/inventory/brownies error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Inward tray, Cut tray into pieces, or sell piece
export async function POST(req: NextRequest) {
  try {
    const { session, role, allowed } = await getSessionAndPerms();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden: Brownie Tray access not permitted.' }, { status: 403 });

    const body = await req.json();
    const { action = 'INWARD_TRAY' } = body;

    // 1. INWARD NEW TRAY FROM WARASIYA FACTORY
    if (action === 'INWARD_TRAY') {
      const { branchId: rawBrId, title = 'Walnut Choco Brownie Tray', flavor = 'Walnut Dark Choco', piecePrice = 80, initialPieces = 50, cutNow = true, cutBy, bestBeforeDate, shelfLifeDays = 4 } = body;
      const branchId = effectiveBranchId(rawBrId, role, session);

      if (!branchId || branchId === 'ALL') {
        return NextResponse.json({ success: false, error: 'Please select an outlet branch for this tray' }, { status: 400 });
      }

      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      const branchCode = branch?.code || 'BR';
      const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const trayCode = `TRAY-BRW-${branchCode}-${datePart}-${randomSuffix}`;

      let computedBestBefore: Date | null = null;
      if (bestBeforeDate) {
        computedBestBefore = new Date(bestBeforeDate);
      } else if (shelfLifeDays) {
        computedBestBefore = new Date();
        computedBestBefore.setDate(computedBestBefore.getDate() + Number(shelfLifeDays));
        computedBestBefore.setHours(23, 59, 59, 999);
      }

      const tray = await prisma.brownieTray.create({
        data: {
          trayCode,
          title,
          flavor,
          branchId,
          piecePrice: Number(piecePrice) || 80,
          totalPieces: Number(initialPieces) || 50,
          soldPieces: 0,
          status: cutNow ? 'CUT_INTO_PIECES' : 'UNOPENED',
          cutBy: cutNow ? (cutBy || 'Outlet Staff') : null,
          bestBeforeDate: computedBestBefore,
          ...(cutNow ? { cutAt: new Date() } : {})
        },
        include: { branch: true }
      });

      return NextResponse.json({
        success: true,
        message: `Brownie Tray #${tray.trayCode} inwarded (${tray.totalPieces} pieces ready to sell)`,
        tray
      });
    }

    // 2. CUT TRAY
    if (action === 'CUT_TRAY') {
      const { id, pieces = 50, cutBy } = body;
      if (!id) return NextResponse.json({ success: false, error: 'Tray ID required' }, { status: 400 });

      const tray = await prisma.brownieTray.update({
        where: { id },
        data: {
          totalPieces: Math.max(1, Number(pieces)),
          status: 'CUT_INTO_PIECES',
          cutBy: cutBy || 'Kitchen Staff',
          cutAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: `Tray cut into ${tray.totalPieces} pieces ready for counter sale`,
        tray
      });
    }

    // 3. SELL PIECE
    if (action === 'SELL_PIECE') {
      const { branchId: rawBrId, trayId, quantity = 1 } = body;
      const branchId = effectiveBranchId(rawBrId, role, session);

      let tray;
      if (trayId) {
        tray = await prisma.brownieTray.findUnique({ where: { id: trayId } });
        // Branch check for SALESPERSON
        if (tray && role === 'SALESPERSON' && branchId && tray.branchId !== branchId) {
          return NextResponse.json({ success: false, error: 'Forbidden: Tray belongs to a different branch.' }, { status: 403 });
        }
      } else if (branchId) {
        tray = await prisma.brownieTray.findFirst({
          where: {
            branchId,
            status: 'CUT_INTO_PIECES',
            totalPieces: { gt: prisma.brownieTray.fields.soldPieces }
          },
          orderBy: { createdAt: 'asc' }
        });
      }

      if (!tray) {
        return NextResponse.json({ success: false, error: 'No active cut brownie tray available at this branch' }, { status: 404 });
      }

      const now = new Date();
      if (tray.bestBeforeDate && new Date(tray.bestBeforeDate) < now) {
        return NextResponse.json({
          success: false,
          error: `EXPIRED TRAY: This brownie tray passed its best before date (${new Date(tray.bestBeforeDate).toLocaleDateString()}) and cannot be sold.`
        }, { status: 410 });
      }

      const qtyToSell = Math.max(1, Number(quantity));
      const newSold = tray.soldPieces + qtyToSell;
      const isCompleted = newSold >= tray.totalPieces;

      const updated = await prisma.brownieTray.update({
        where: { id: tray.id },
        data: {
          soldPieces: newSold,
          status: isCompleted ? 'COMPLETED' : 'CUT_INTO_PIECES',
          completedAt: isCompleted ? new Date() : null
        }
      });

      return NextResponse.json({
        success: true,
        message: `Sold ${qtyToSell} brownie piece(s). Tray remaining: ${Math.max(0, updated.totalPieces - updated.soldPieces)} / ${updated.totalPieces}`,
        tray: updated
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('POST /api/v1/admin/inventory/brownies error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Modify an existing Brownie Tray (requires edit permission)
export async function PUT(req: NextRequest) {
  try {
    const { session, role, customPerms, allowed } = await getSessionAndPerms();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden: Brownie Tray access not permitted.' }, { status: 403 });

    const canEdit = role === 'ADMIN' || role === 'MANAGER' || customPerms['inv_edit_delete'] === true;
    if (!canEdit) {
      return NextResponse.json({ success: false, error: 'Forbidden: Modify permission (inv_edit_delete) required.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, flavor, totalPieces, piecePrice, status, bestBeforeDate } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Tray ID required' }, { status: 400 });

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (flavor !== undefined) dataToUpdate.flavor = flavor;
    if (totalPieces !== undefined) dataToUpdate.totalPieces = Math.max(1, Number(totalPieces));
    if (piecePrice !== undefined) dataToUpdate.piecePrice = Number(piecePrice);
    if (status !== undefined) dataToUpdate.status = status;
    if (bestBeforeDate !== undefined) {
      dataToUpdate.bestBeforeDate = bestBeforeDate ? new Date(bestBeforeDate) : null;
    }

    const updated = await prisma.brownieTray.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, message: 'Brownie tray updated successfully', tray: updated });
  } catch (err: any) {
    console.error('PUT /api/v1/admin/inventory/brownies error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a brownie tray (requires edit/delete permission)
export async function DELETE(req: NextRequest) {
  try {
    const { session, role, customPerms, allowed } = await getSessionAndPerms();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden: Brownie Tray access not permitted.' }, { status: 403 });

    const canDelete = role === 'ADMIN' || customPerms['inv_edit_delete'] === true;
    if (!canDelete) {
      return NextResponse.json({ success: false, error: 'Forbidden: Delete permission (inv_edit_delete) required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'Tray ID required' }, { status: 400 });

    await prisma.brownieTray.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Brownie tray deleted successfully' });
  } catch (err: any) {
    console.error('DELETE /api/v1/admin/inventory/brownies error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
