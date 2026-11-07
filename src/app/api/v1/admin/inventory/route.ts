import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InventoryCategory, InventoryUnitStatus } from '@prisma/client';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
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

    const hasInventoryAccess = role === 'ADMIN' || 
      role === 'MANAGER' || 
      customPerms['inventory_management'] === true ||
      customPerms['inv_view'] === true ||
      customPerms['inv_inward'] === true ||
      customPerms['inv_hot_bakes'] === true ||
      customPerms['inv_brownie_trays'] === true ||
      customPerms['inv_kitchen_prep'] === true ||
      customPerms['inv_raw_ingredients'] === true ||
      customPerms['inv_eod_closing'] === true;
    if (!hasInventoryAccess) {
      return NextResponse.json({ 
        success: false, 
        error: "Forbidden: You do not have permission to view or manage inventory." 
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const requestedBranchId = searchParams.get('branchId');
    const category = searchParams.get('category') as InventoryCategory | null;
    const search = searchParams.get('search');
    const dateFilter = searchParams.get('dateFilter') || 'ALL'; // TODAY, YESTERDAY, LAST_7_DAYS, ALL, or CUSTOM
    const dateStr = searchParams.get('date');

    // Branch Scoping:
    // If user is SALESPERSON, strictly enforce their assigned branch!
    let effectiveBranchId = requestedBranchId;
    if (role === 'SALESPERSON') {
      const userBranchId = (session.user as any)?.branchId;
      if (!userBranchId) {
        return NextResponse.json({ 
          success: false, 
          error: "Forbidden: No branch is assigned to your salesperson account." 
        }, { status: 403 });
      }
      effectiveBranchId = userBranchId;
    }

    const now = new Date();

    // 0. Proactively auto-mark expired items
    await prisma.inventoryUnit.updateMany({
      where: {
        status: InventoryUnitStatus.IN_STOCK,
        bestBeforeDate: { lt: now }
      },
      data: {
        status: InventoryUnitStatus.EXPIRED
      }
    });

    const whereBatch: any = {};
    if (effectiveBranchId && effectiveBranchId !== 'ALL') {
      whereBatch.branchId = effectiveBranchId;
    }
    if (category) {
      whereBatch.category = category;
    }

    // Day-wise filtering logic
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

    if (dateFilter === 'TODAY') {
      whereBatch.batchDate = { gte: startOfToday, lte: endOfToday };
    } else if (dateFilter === 'YESTERDAY') {
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const endOfYesterday = new Date(startOfYesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      whereBatch.batchDate = { gte: startOfYesterday, lte: endOfYesterday };
    } else if (dateFilter === 'LAST_7_DAYS') {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      whereBatch.batchDate = { gte: sevenDaysAgo, lte: endOfToday };
    } else if (dateFilter === 'DEAD_STOCK') {
      whereBatch.units = {
        some: {
          OR: [
            { status: InventoryUnitStatus.IN_STOCK, category: InventoryCategory.FRESH_BAKES, createdAt: { lte: twoDaysAgo } },
            { status: InventoryUnitStatus.EXPIRED },
            { status: InventoryUnitStatus.IN_STOCK, bestBeforeDate: { lt: now } }
          ]
        }
      };
    } else if (dateStr) {
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);
      whereBatch.batchDate = { gte: startOfDay, lte: endOfDay };
    }

    const batches = await prisma.inventoryBatch.findMany({
      where: whereBatch,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        units: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 60
    });

    // Compute live inventory counts across branches
    const totalInStock = await prisma.inventoryUnit.count({
      where: {
        status: InventoryUnitStatus.IN_STOCK,
        ...(effectiveBranchId && effectiveBranchId !== 'ALL' ? { branchId: effectiveBranchId } : {}),
        ...(category ? { category } : {})
      }
    });

    // Today's fresh stock (created today & in stock)
    const todayStock = await prisma.inventoryUnit.count({
      where: {
        status: InventoryUnitStatus.IN_STOCK,
        createdAt: { gte: startOfToday, lte: endOfToday },
        ...(effectiveBranchId && effectiveBranchId !== 'ALL' ? { branchId: effectiveBranchId } : {}),
        ...(category ? { category } : {})
      }
    });

    const totalSoldToday = await prisma.inventoryUnit.count({
      where: {
        status: InventoryUnitStatus.SOLD,
        soldAt: { gte: startOfToday },
        ...(effectiveBranchId && effectiveBranchId !== 'ALL' ? { branchId: effectiveBranchId } : {})
      }
    });

    const totalExpired = await prisma.inventoryUnit.count({
      where: {
        status: InventoryUnitStatus.EXPIRED,
        ...(effectiveBranchId && effectiveBranchId !== 'ALL' ? { branchId: effectiveBranchId } : {})
      }
    });

    const totalDamaged = await prisma.inventoryUnit.count({
      where: {
        status: InventoryUnitStatus.DAMAGED,
        ...(effectiveBranchId && effectiveBranchId !== 'ALL' ? { branchId: effectiveBranchId } : {})
      }
    });

    // Wastage & Spoilage breakdown by reason tags (Feature 4)
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(startOfYesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startOfDay = dateStr ? new Date(dateStr) : null;
    if (startOfDay) startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = dateStr ? new Date(dateStr) : null;
    if (endOfDay) endOfDay.setHours(23, 59, 59, 999);

    const wastageDateRange = 
      dateFilter === 'TODAY' ? { updatedAt: { gte: startOfToday, lte: endOfToday } } :
      dateFilter === 'YESTERDAY' ? { updatedAt: { gte: startOfYesterday, lte: endOfYesterday } } :
      dateFilter === 'LAST_7_DAYS' ? { updatedAt: { gte: sevenDaysAgo, lte: endOfToday } } :
      (startOfDay && endOfDay) ? { updatedAt: { gte: startOfDay, lte: endOfDay } } : {};

    const wastageUnits = await prisma.inventoryUnit.findMany({
      where: {
        status: { in: [InventoryUnitStatus.DAMAGED, InventoryUnitStatus.EXPIRED] },
        ...(effectiveBranchId && effectiveBranchId !== 'ALL' ? { branchId: effectiveBranchId } : {}),
        ...wastageDateRange
      },
      select: {
        status: true,
        damageReason: true,
        sellingPrice: true
      }
    });

    const reasonMap: Record<string, { count: number; lossAmount: number }> = {};
    let totalWastageLoss = 0;

    for (const u of wastageUnits) {
      const reason = u.damageReason || (u.status === 'EXPIRED' ? 'Unsold expired' : 'Unspecified damage');
      const loss = Number(u.sellingPrice) || 0;
      totalWastageLoss += loss;
      if (!reasonMap[reason]) {
        reasonMap[reason] = { count: 0, lossAmount: 0 };
      }
      reasonMap[reason].count += 1;
      reasonMap[reason].lossAmount += loss;
    }

    const wastageBreakdown = Object.entries(reasonMap).map(([reason, data]) => ({
      reason,
      count: data.count,
      lossAmount: data.lossAmount,
      percentage: wastageUnits.length > 0 ? Math.round((data.count / wastageUnits.length) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // Role-based Revenue & Discount Metrics (Strictly ADMIN only)
    const isAdmin = role === 'ADMIN';

    let revenueStats: {
      totalRevenue: number;
      totalDiscountGiven: number;
      totalOriginalValue: number;
      realizationRate: number;
      soldUnitsCount: number;
    } | null = null;

    const canSeeFinancials = isAdmin || customPerms['inv_financials'] === true;
    if (canSeeFinancials) {
      const soldDateRange = 
        dateFilter === 'TODAY' ? { soldAt: { gte: startOfToday, lte: endOfToday } } :
        dateFilter === 'YESTERDAY' ? { soldAt: { gte: startOfYesterday, lte: endOfYesterday } } :
        dateFilter === 'LAST_7_DAYS' ? { soldAt: { gte: sevenDaysAgo, lte: endOfToday } } :
        (startOfDay && endOfDay) ? { soldAt: { gte: startOfDay, lte: endOfDay } } : {};

      const soldUnits = await prisma.inventoryUnit.findMany({
        where: {
          status: InventoryUnitStatus.SOLD,
          ...(effectiveBranchId && effectiveBranchId !== 'ALL' ? { branchId: effectiveBranchId } : {}),
          ...soldDateRange
        },
        select: {
          sellingPrice: true,
          soldPrice: true
        }
      });

      let totalRevenue = 0;
      let totalOriginalValue = 0;
      let totalDiscountGiven = 0;

      for (const u of soldUnits) {
        const orig = Number(u.sellingPrice) || 0;
        const sold = u.soldPrice !== null && u.soldPrice !== undefined ? Number(u.soldPrice) : orig;
        totalRevenue += sold;
        totalOriginalValue += orig;
        if (orig > sold) {
          totalDiscountGiven += (orig - sold);
        }
      }

      const realizationRate = totalOriginalValue > 0 ? (totalRevenue / totalOriginalValue) * 100 : 100;

      revenueStats = {
        totalRevenue,
        totalDiscountGiven,
        totalOriginalValue,
        realizationRate,
        soldUnitsCount: soldUnits.length
      };
    }

    // Dead Stock Calculation (Cakes unsold >48h, Expired items, BestBefore passed)
    const deadStockWhere: any = {
      OR: [
        {
          status: InventoryUnitStatus.IN_STOCK,
          category: InventoryCategory.FRESH_BAKES,
          createdAt: { lte: twoDaysAgo }
        },
        {
          status: InventoryUnitStatus.EXPIRED
        },
        {
          status: InventoryUnitStatus.IN_STOCK,
          bestBeforeDate: { lt: now }
        }
      ],
      ...(effectiveBranchId && effectiveBranchId !== 'ALL' ? { branchId: effectiveBranchId } : {})
    };

    const deadUnits = await prisma.inventoryUnit.findMany({
      where: deadStockWhere,
      select: {
        id: true,
        sellingPrice: true,
      }
    });

    const totalDeadStock = deadUnits.length;
    const deadStockLockedCapital = deadUnits.reduce((sum: number, u: any) => sum + Number(u.sellingPrice || 0), 0);

    // Daily Stock Movement Register Calculation: Opening + Inward - Sold - Damaged = Closing
    const dailyMovementRegister = {
      openingStock: Math.max(0, totalInStock + totalSoldToday + totalDamaged - todayStock),
      inwardToday: todayStock,
      soldToday: totalSoldToday,
      damagedToday: totalDamaged,
      closingStock: totalInStock
    };

    // If Salesperson, only return their assigned branch in the list
    const branches = (role === 'SALESPERSON' && effectiveBranchId)
      ? await prisma.branch.findMany({
          where: { id: effectiveBranchId, isActive: true },
          select: { id: true, name: true, code: true }
        })
      : await prisma.branch.findMany({
          where: { isActive: true },
          select: { id: true, name: true, code: true }
        });

    return NextResponse.json({
      success: true,
      batches,
      stats: {
        totalInStock,
        todayStock,
        totalSoldToday,
        totalExpired,
        totalDamaged,
        totalWastageLoss,
        totalDeadStock,
        deadStockLockedCapital
      },
      dailyMovementRegister,
      wastageBreakdown,
      revenueStats,
      isAdmin,
      branches
    });
  } catch (error: any) {
    console.error("GET /api/v1/admin/inventory error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create morning inward batch with unique serial barcodes & best before dates
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

    const hasInventoryAccess = role === 'ADMIN' || 
      role === 'MANAGER' || 
      customPerms['inventory_management'] === true ||
      customPerms['inv_view'] === true ||
      customPerms['inv_inward'] === true ||
      customPerms['inv_hot_bakes'] === true ||
      customPerms['inv_brownie_trays'] === true ||
      customPerms['inv_kitchen_prep'] === true ||
      customPerms['inv_raw_ingredients'] === true ||
      customPerms['inv_eod_closing'] === true;
    if (!hasInventoryAccess) {
      return NextResponse.json({ success: false, error: "Forbidden: Inventory access denied." }, { status: 403 });
    }

    const canDelete = role === 'ADMIN' || customPerms['inv_edit_delete'] === true;
    if (!canDelete) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not have permission to delete inventory items." }, { status: 403 });
    }

    const body = await req.json();
    let { 
      branchId, 
      category, 
      items = [], 
      title, 
      notes, 
      isBarcodeTracked = true, 
      openingQty, 
      bestBeforeDate,
      shelfLifeDays = 2 
    } = body;

    // Enforce branch for SALESPERSON
    if (role === 'SALESPERSON') {
      const userBranchId = (session.user as any)?.branchId;
      if (!userBranchId) {
        return NextResponse.json({ success: false, error: "No branch assigned to your salesperson account." }, { status: 403 });
      }
      branchId = userBranchId;
    }

    if (!branchId || !category) {
      return NextResponse.json({
        success: false,
        error: "Branch and category are required"
      }, { status: 400 });
    }

    // Determine Best Before Date
    let computedBestBefore: Date | null = null;
    if (bestBeforeDate) {
      computedBestBefore = new Date(bestBeforeDate);
    } else if (shelfLifeDays) {
      computedBestBefore = new Date();
      computedBestBefore.setDate(computedBestBefore.getDate() + Number(shelfLifeDays));
      computedBestBefore.setHours(23, 59, 59, 999);
    }

    // 1. Hot Bakes (Puffs) - Quantity based counter stock (No barcodes)
    if (!isBarcodeTracked) {
      const qty = Number(openingQty) || 1;
      const batch = await prisma.inventoryBatch.create({
        data: {
          branchId,
          category: category as InventoryCategory,
          title: title || `${category} Batch`,
          notes,
          openingQty: qty,
          closingQty: qty,
          isBarcodeTracked: false,
          bestBeforeDate: computedBestBefore
        },
        include: { branch: true }
      });

      return NextResponse.json({
        success: true,
        message: `Inwarded ${qty} hot bakes for counter sale`,
        batch
      });
    }

    // 2. Barcode Tracked Finished Goods (Cakes, Bouquets, Add-ons)
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: "At least one item required for barcode generation"
      }, { status: 400 });
    }

    const totalQty = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);

    const batch = await prisma.inventoryBatch.create({
      data: {
        branchId,
        category: category as InventoryCategory,
        title: title || `${category.replace('_', ' ')} Batch`,
        notes,
        openingQty: totalQty,
        closingQty: totalQty,
        isBarcodeTracked: true,
        bestBeforeDate: computedBestBefore
      }
    });

    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const catCode = category === 'FRESH_BAKES' ? 'FB'
                  : category === 'HOT_BAKES' ? 'HB'
                  : category === 'BOUQUETS' ? 'BQ'
                  : 'SG';

    const unitsToCreate: any[] = [];
    let sequence = 1;

    for (const it of items) {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.sellingPrice) || 0;
      const weight = it.variantWeight || "500g";
      const flavor = it.flavor || null;
      const itemTitle = it.itemTitle || "Bakery Item";
      const productId = it.productId || null;
      const itemBestBefore = it.bestBeforeDate ? new Date(it.bestBeforeDate) : computedBestBefore;

      for (let i = 0; i < qty; i++) {
        const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        const barcode = `GCS-${catCode}-${datePart}-${String(sequence).padStart(3, '0')}${randHex}`;
        sequence++;

        unitsToCreate.push({
          barcode,
          batchId: batch.id,
          branchId,
          productId,
          itemTitle,
          category: category as InventoryCategory,
          variantWeight: weight,
          flavor,
          sellingPrice: price,
          bestBeforeDate: itemBestBefore,
          status: InventoryUnitStatus.IN_STOCK
        });
      }
    }

    await prisma.inventoryUnit.createMany({
      data: unitsToCreate
    });

    const createdUnits = await prisma.inventoryUnit.findMany({
      where: { batchId: batch.id },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      success: true,
      message: `Created batch with ${createdUnits.length} unique barcode units`,
      batch: {
        ...batch,
        units: createdUnits
      }
    });
  } catch (error: any) {
    console.error("POST /api/v1/admin/inventory error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Modify an existing batch or inventory unit
export async function PUT(req: NextRequest) {
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

    const hasInventoryAccess = role === 'ADMIN' || 
      role === 'MANAGER' || 
      customPerms['inventory_management'] === true ||
      customPerms['inv_view'] === true ||
      customPerms['inv_inward'] === true ||
      customPerms['inv_hot_bakes'] === true ||
      customPerms['inv_brownie_trays'] === true ||
      customPerms['inv_kitchen_prep'] === true ||
      customPerms['inv_raw_ingredients'] === true ||
      customPerms['inv_eod_closing'] === true;
    if (!hasInventoryAccess) {
      return NextResponse.json({ success: false, error: "Forbidden: Inventory access denied." }, { status: 403 });
    }

    const body = await req.json();
    const { batchId, unitId, title, closingQty, sellingPrice, soldPrice, itemTitle, flavor, variantWeight, bestBeforeDate, status, notes, damageReason } = body;

    const canReportDamage = role === 'ADMIN' || 
      role === 'MANAGER' || 
      role === 'CHEF' || 
      customPerms['inventory_management'] === true || 
      customPerms['inv_spoilage_damage'] === true;
    const canEditDetails = role === 'ADMIN' || customPerms['inv_edit_delete'] === true;

    if (status === 'DAMAGED' && !canReportDamage) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not have permission to report damaged items." }, { status: 403 });
    }

    if ((sellingPrice !== undefined || itemTitle || flavor || variantWeight || bestBeforeDate || title) && !canEditDetails && status !== 'DAMAGED') {
      return NextResponse.json({ success: false, error: "Forbidden: You do not have permission to modify inventory item details." }, { status: 403 });
    }

    // Enforce branch ownership for SALESPERSON
    if (role === 'SALESPERSON') {
      const userBranchId = (session.user as any)?.branchId;
      if (unitId) {
        const existingUnit = await prisma.inventoryUnit.findUnique({ where: { id: unitId } });
        if (!existingUnit || existingUnit.branchId !== userBranchId) {
          return NextResponse.json({ success: false, error: "Forbidden: You cannot modify stock outside your assigned branch." }, { status: 403 });
        }
      }
      if (batchId) {
        const existingBatch = await prisma.inventoryBatch.findUnique({ where: { id: batchId } });
        if (!existingBatch || existingBatch.branchId !== userBranchId) {
          return NextResponse.json({ success: false, error: "Forbidden: You cannot modify batches outside your assigned branch." }, { status: 403 });
        }
      }
    }

    // Modify single unit
    if (unitId) {
      const dataToUpdate: any = {};
      if (itemTitle !== undefined) dataToUpdate.itemTitle = itemTitle;
      if (flavor !== undefined) dataToUpdate.flavor = flavor;
      if (variantWeight !== undefined) dataToUpdate.variantWeight = variantWeight;
      if (sellingPrice !== undefined) dataToUpdate.sellingPrice = Number(sellingPrice);
      if (soldPrice !== undefined) dataToUpdate.soldPrice = soldPrice !== null ? Number(soldPrice) : null;
      if (status !== undefined) {
        dataToUpdate.status = status;
        if (status === 'DAMAGED' || status === 'EXPIRED') {
          dataToUpdate.damagedAt = new Date();
        }
      }
      if (damageReason !== undefined) dataToUpdate.damageReason = damageReason;
      if (bestBeforeDate !== undefined) {
        dataToUpdate.bestBeforeDate = bestBeforeDate ? new Date(bestBeforeDate) : null;
      }

      const updated = await prisma.inventoryUnit.update({
        where: { id: unitId },
        data: dataToUpdate
      });

      return NextResponse.json({
        success: true,
        message: "Inventory unit updated successfully",
        unit: updated
      });
    }

    // Modify parent batch
    if (batchId) {
      const dataToUpdate: any = {};
      if (title !== undefined) dataToUpdate.title = title;
      if (closingQty !== undefined) dataToUpdate.closingQty = Number(closingQty);
      if (notes !== undefined) dataToUpdate.notes = notes;
      if (bestBeforeDate !== undefined) {
        dataToUpdate.bestBeforeDate = bestBeforeDate ? new Date(bestBeforeDate) : null;
      }

      const updated = await prisma.inventoryBatch.update({
        where: { id: batchId },
        data: dataToUpdate
      });

      return NextResponse.json({
        success: true,
        message: "Inventory batch updated successfully",
        batch: updated
      });
    }

    return NextResponse.json({ success: false, error: "unitId or batchId is required" }, { status: 400 });
  } catch (error: any) {
    console.error("PUT /api/v1/admin/inventory error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a batch or unit
export async function DELETE(req: NextRequest) {
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

    const hasInventoryAccess = role === 'ADMIN' || 
      role === 'MANAGER' || 
      customPerms['inventory_management'] === true ||
      customPerms['inv_view'] === true ||
      customPerms['inv_inward'] === true ||
      customPerms['inv_hot_bakes'] === true ||
      customPerms['inv_brownie_trays'] === true ||
      customPerms['inv_kitchen_prep'] === true ||
      customPerms['inv_raw_ingredients'] === true ||
      customPerms['inv_eod_closing'] === true;
    if (!hasInventoryAccess) {
      return NextResponse.json({ success: false, error: "Forbidden: Inventory access denied." }, { status: 403 });
    }

    const canDelete = role === 'ADMIN' || customPerms['inv_edit_delete'] === true;
    if (!canDelete) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not have permission to delete inventory items." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');
    const unitId = searchParams.get('unitId');

    // Enforce branch ownership for SALESPERSON
    if (role === 'SALESPERSON') {
      const userBranchId = (session.user as any)?.branchId;
      if (unitId) {
        const unit = await prisma.inventoryUnit.findUnique({ where: { id: unitId } });
        if (!unit || unit.branchId !== userBranchId) {
          return NextResponse.json({ success: false, error: "Forbidden: Cannot delete items outside your assigned branch." }, { status: 403 });
        }
      }
      if (batchId) {
        const batch = await prisma.inventoryBatch.findUnique({ where: { id: batchId } });
        if (!batch || batch.branchId !== userBranchId) {
          return NextResponse.json({ success: false, error: "Forbidden: Cannot delete batches outside your assigned branch." }, { status: 403 });
        }
      }
    }

    if (unitId) {
      const unit = await prisma.inventoryUnit.findUnique({ where: { id: unitId } });
      if (!unit) {
        return NextResponse.json({ success: false, error: "Unit not found" }, { status: 404 });
      }

      await prisma.inventoryUnit.delete({ where: { id: unitId } });
      
      // Decrement closing qty on parent batch
      await prisma.inventoryBatch.update({
        where: { id: unit.batchId },
        data: { closingQty: { decrement: 1 } }
      }).catch(() => null);

      return NextResponse.json({ success: true, message: "Unit deleted successfully" });
    }

    if (batchId) {
      await prisma.inventoryBatch.delete({ where: { id: batchId } });
      return NextResponse.json({ success: true, message: "Batch and all attached units deleted successfully" });
    }

    return NextResponse.json({ success: false, error: "batchId or unitId required" }, { status: 400 });
  } catch (error: any) {
    console.error("DELETE /api/v1/admin/inventory error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
