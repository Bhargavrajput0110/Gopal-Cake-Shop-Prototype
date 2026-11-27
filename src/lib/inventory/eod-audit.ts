/**
 * Gopal Cake Shop — EOD Closing Reconciliation & CA Monthly Audit Engine (Milestone M3)
 * Path: src/lib/inventory/eod-audit.ts
 *
 * Provides domain lifecycle functions for:
 * 1. End-of-Day (EOD) store closing, leftovers disposition & cash register reconciliation
 * 2. Spoilage and damage recording (Section 17(5)(h) CGST Input Tax Credit tracking)
 * 3. CA monthly financial & audit statement generation (5% reverse GST calculation)
 *
 * Pure helpers with zero native dependencies for cross-environment reliability.
 */

import { prisma } from '@/lib/prisma';
import { LedgerEntryType, PaymentMethod, PaymentStatus, InventoryUnitStatus } from '@prisma/client';

// ============================================================================
// 1. PURE CALCULATION & NORMALIZATION HELPERS
// ============================================================================

export interface GstSplitResult {
  netTaxableSales: number;
  gstRatePercent: number;
  estimatedGstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
}

/**
 * Calculates reverse GST (5% inclusive for bakery/confectionery).
 * Formula: GST Amount = (Gross Sales * 5) / 105
 * Split equally into CGST 2.5% and SGST 2.5%.
 */
export function calculateGstSplit(grossSales: number, gstRatePercent: number = 5): GstSplitResult {
  const gross = Math.max(0, Number(grossSales) || 0);
  if (gross === 0) {
    return {
      netTaxableSales: 0,
      gstRatePercent,
      estimatedGstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0
    };
  }

  const rate = gstRatePercent;
  const estimatedGstAmount = Math.round(((gross * rate) / (100 + rate)) * 100) / 100;
  const cgstAmount = Math.round((estimatedGstAmount / 2) * 100) / 100;
  const sgstAmount = Math.round((estimatedGstAmount - cgstAmount) * 100) / 100;

  return {
    netTaxableSales: gross,
    gstRatePercent: rate,
    estimatedGstAmount,
    cgstAmount,
    sgstAmount
  };
}

export interface CashVarianceResult {
  physicalCash: number;
  systemCash: number;
  variance: number;
}

/**
 * Calculates cash register variance with negative clamping.
 * Physical cash or system cash < 0 are clamped to 0.
 * Variance = physicalCash - systemCash.
 */
export function calculateCashVariance(physicalCash: number, systemCash: number): CashVarianceResult {
  const phys = Math.max(0, Number(physicalCash) || 0);
  const syst = Math.max(0, Number(systemCash) || 0);
  const variance = phys - syst;

  return {
    physicalCash: phys,
    systemCash: syst,
    variance
  };
}

export interface NormalizedReportPeriod {
  month: number;
  year: number;
  monthName: string;
  startOfMonth: Date;
  endOfMonth: Date;
}

const MONTH_NAMES = [
  '',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Normalizes input month (1-12) and year, falling back to current calendar month.
 */
export function normalizeReportPeriod(month?: number, year?: number): NormalizedReportPeriod {
  const now = new Date();
  const numMonth = Number(month);
  const normMonth = (!numMonth || numMonth < 1 || numMonth > 12) ? now.getMonth() + 1 : numMonth;
  const numYear = Number(year);
  const normYear = (!numYear || numYear < 2000) ? now.getFullYear() : numYear;

  const monthName = MONTH_NAMES[normMonth] || 'November';
  const startOfMonth = new Date(normYear, normMonth - 1, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(normYear, normMonth, 0, 23, 59, 59, 999);

  return {
    month: normMonth,
    year: normYear,
    monthName,
    startOfMonth,
    endOfMonth
  };
}

// ============================================================================
// 2. END-OF-DAY CLOSING RECONCILIATION
// ============================================================================

export interface EodBatchDispositionInput {
  batchId: string;
  remainingQty: number;
  action: 'DISCARD' | 'STAFF_MEAL' | 'ROLLOVER';
  reason?: string;
}

export interface EodCashReconciliationInput {
  physicalCash: number;
  systemCash: number;
  notes?: string;
}

export interface ExecuteEodClosingParams {
  branchId: string;
  dispositions?: EodBatchDispositionInput[];
  cashReconciliation?: EodCashReconciliationInput;
  closingNotes?: string;
  actorId?: string;
}

export interface EodClosingResult {
  closedBatchesCount: number;
  damagedRecorded: number;
  cashVariance: number;
  ledgerEntryId?: string | null;
  closedAt: Date;
}

/**
 * Executes full End-of-Day closing for a branch.
 * - Processes leftover dispositions (DISCARD, STAFF_MEAL, ROLLOVER)
 * - Closes all active batches for the branch
 * - Records cash reconciliation ledger entry
 */
export async function executeEodClosing(
  params: ExecuteEodClosingParams,
  dbClient?: any
): Promise<EodClosingResult> {
  if (!params.branchId) {
    throw new Error('branchId is required');
  }

  const client = dbClient || prisma;
  const now = new Date();
  let damagedRecorded = 0;

  // Execute in transaction if client supports $transaction
  const runInsideTx = async (tx: any) => {
    // 1. Process Hot Bakes Leftover Dispositions
    for (const disp of params.dispositions || []) {
      if (!disp.batchId) continue;
      const batch = await tx.inventoryBatch.findUnique({
        where: { id: disp.batchId }
      });
      if (!batch) continue;

      // Cross-branch safety guard: ignore batches belonging to other branches
      if (batch.branchId !== params.branchId) {
        continue;
      }

      const qty = Math.min(batch.closingQty, Math.max(0, Number(disp.remainingQty) || 0));
      const action = disp.action || 'ROLLOVER';
      const reason = disp.reason || (action === 'STAFF_MEAL' ? 'Staff Consumed' : 'Unsold at closing');

      let updatedData: any = {
        isClosed: true,
        closedAt: now,
        notes: [batch.notes, `[EOD Close: ${action} - ${qty} pcs (${reason})]`].filter(Boolean).join('; ')
      };

      if (action === 'DISCARD' || action === 'STAFF_MEAL') {
        updatedData.damagedQty = { increment: qty };
        updatedData.closingQty = Math.max(0, batch.closingQty - qty);
        damagedRecorded += qty;
      } else if (action === 'ROLLOVER') {
        // Preserves remaining closingQty
      }

      await tx.inventoryBatch.update({
        where: { id: disp.batchId },
        data: updatedData
      });
    }

    // 2. Auto-close all active batches for this branch
    const updateResult = await tx.inventoryBatch.updateMany({
      where: {
        branchId: params.branchId,
        isClosed: false
      },
      data: {
        isClosed: true,
        closedAt: now
      }
    });
    const closedBatchesCount = updateResult.count || 0;

    // 3. Cash Reconciliation & Ledger Entry
    const { physicalCash, systemCash, variance } = calculateCashVariance(
      params.cashReconciliation?.physicalCash ?? 0,
      params.cashReconciliation?.systemCash ?? 0
    );

    let ledgerEntryId: string | null = null;
    if (params.cashReconciliation) {
      const entry = await tx.ledgerEntry.create({
        data: {
          type: LedgerEntryType.PAYMENT,
          amount: physicalCash,
          currency: 'INR',
          method: PaymentMethod.CASH,
          status: PaymentStatus.SUCCESS,
          actorId: params.actorId || null,
          branchId: params.branchId,
          notes: `EOD Cash Reconciliation: Physical ₹${physicalCash}, System ₹${systemCash}, Variance ${variance >= 0 ? '+' : ''}₹${variance}${params.closingNotes ? ` | ${params.closingNotes}` : ''}`
        }
      });
      ledgerEntryId = entry.id;
    }

    return {
      closedBatchesCount,
      damagedRecorded,
      cashVariance: variance,
      ledgerEntryId,
      closedAt: now
    };
  };

  if (typeof client.$transaction === 'function') {
    return client.$transaction(runInsideTx);
  }
  return runInsideTx(client);
}

// ============================================================================
// 3. SPOILAGE & WASTAGE RECORDING
// ============================================================================

export interface RecordSpoilageParams {
  barcode?: string;
  batchId?: string;
  branchId?: string;
  quantity?: number;
  reasonCode: string;
  notes?: string;
  actorId?: string;
}

export async function recordSpoilage(
  params: RecordSpoilageParams,
  dbClient?: any
): Promise<{ status: string; updatedBatchOrUnit: any }> {
  const client = dbClient || prisma;
  const now = new Date();

  if (params.barcode) {
    const unit = await client.inventoryUnit.findUnique({
      where: { barcode: params.barcode.trim().toUpperCase() }
    });
    if (!unit) {
      throw new Error(`Inventory unit with barcode "${params.barcode}" not found`);
    }

    const updatedUnit = await client.inventoryUnit.update({
      where: { id: unit.id },
      data: {
        status: InventoryUnitStatus.DAMAGED,
        damagedAt: now,
        damageReason: params.reasonCode || 'Unspecified Spoilage'
      }
    });

    await client.inventoryBatch.update({
      where: { id: unit.batchId },
      data: {
        damagedQty: { increment: 1 },
        closingQty: { decrement: 1 }
      }
    });

    return { status: 'SUCCESS', updatedBatchOrUnit: updatedUnit };
  }

  if (params.batchId) {
    const qty = Math.max(1, params.quantity || 1);
    const updatedBatch = await client.inventoryBatch.update({
      where: { id: params.batchId },
      data: {
        damagedQty: { increment: qty },
        closingQty: { decrement: qty },
        notes: [params.notes, `[Spoilage: ${qty} pcs - ${params.reasonCode}]`].filter(Boolean).join('; ')
      }
    });
    return { status: 'SUCCESS', updatedBatchOrUnit: updatedBatch };
  }

  throw new Error('Either barcode or batchId is required to record spoilage');
}

// ============================================================================
// 4. CA MONTHLY FINANCIAL & AUDIT STATEMENT
// ============================================================================

export interface GenerateCaMonthlyReportParams {
  month?: number;
  year?: number;
  branchId?: string;
  userRole?: string;
  hasPermission?: boolean;
}

export interface CaMonthlyReportResult {
  period: {
    month: number;
    monthName: string;
    year: number;
    startDate?: string;
    endDate?: string;
    branch: { code: string; name: string };
  };
  company: {
    tradeName: string;
    legalOwner: string;
    gstin: string;
    state?: string;
    city?: string;
    natureOfBusiness?: string;
  };
  salesTurnover: {
    grossSales: number;
    discountsConceded: number;
    netTaxableSales: number;
    gstRatePercent: number;
    estimatedGstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    totalNetInvoiced: number;
    totalOrdersCount: number;
    paymentSplit: Record<string, number>;
  };
  stockInward?: {
    totalBatches: number;
    totalUnitsReceived: number;
    inwardAssetValuation: number;
  };
  spoilageWriteOff: {
    totalUnitsWrittenOff: number;
    totalLossAmount: number;
    reasonBreakdown: Array<{
      reason: string;
      count: number;
      lossAmount: number;
    }>;
  };
  monthEndInventoryValuation: {
    activeUnitsCount: number;
    inventoryAssetValuation: number;
  };
  generatedAt: string;
  generatedBy?: string;
}

export async function generateCaMonthlyReport(
  params: GenerateCaMonthlyReportParams,
  dbClient?: any
): Promise<CaMonthlyReportResult> {
  // Confidentiality Authorization Guard
  const role = params.userRole?.toUpperCase();
  const isAuthorized = role === 'ADMIN' || params.hasPermission === true;
  if (!isAuthorized) {
    throw new Error('Forbidden: Monthly Tax & Financial Statements for CA are strictly confidential');
  }

  const client = dbClient || prisma;
  const now = new Date();
  const period = normalizeReportPeriod(params.month, params.year);
  const branchFilter = params.branchId && params.branchId !== 'ALL' ? { branchId: params.branchId } : {};

  // Branch info lookup
  let branchInfo: { code: string; name: string } = {
    code: params.branchId || 'ALL',
    name: params.branchId && params.branchId !== 'ALL' ? `Branch ${params.branchId}` : 'All Outlets & Central Kitchen'
  };
  if (params.branchId && params.branchId !== 'ALL' && client.branch) {
    try {
      const b = await client.branch.findUnique({
        where: { id: params.branchId },
        select: { id: true, name: true, code: true }
      });
      if (b) {
        branchInfo = { code: b.code || b.id, name: b.name };
      }
    } catch {
      // ignore in test / mock clients
    }
  }

  // 1. Invoiced Orders
  const orders = await client.order.findMany({
    where: {
      createdAt: { gte: period.startOfMonth, lte: period.endOfMonth },
      status: { notIn: ['CANCELLED', 'REFUNDED', 'QUOTE_DRAFT'] },
      ...branchFilter
    },
    select: {
      id: true,
      totalAmount: true,
      discount: true,
      payments: {
        select: { method: true, amount: true, status: true }
      }
    }
  });

  let totalInvoicedRevenue = 0;
  let totalOrderDiscounts = 0;
  const paymentSplit: Record<string, number> = { CASH: 0, UPI: 0, CARD: 0, ONLINE: 0 };

  for (const ord of orders) {
    totalInvoicedRevenue += Number(ord.totalAmount || 0);
    totalOrderDiscounts += Number(ord.discount || 0);
    for (const p of ord.payments || []) {
      if (p.status === 'SUCCESS' || !p.status) {
        const m = p.method || 'CASH';
        paymentSplit[m] = (paymentSplit[m] || 0) + Number(p.amount || 0);
      }
    }
  }

  // 2. Sold Barcode Units
  const soldUnits = await client.inventoryUnit.findMany({
    where: {
      status: InventoryUnitStatus.SOLD,
      soldAt: { gte: period.startOfMonth, lte: period.endOfMonth },
      ...branchFilter
    },
    select: {
      sellingPrice: true,
      soldPrice: true
    }
  });

  let grossBarcodeTurnover = 0;
  let netBarcodeTurnover = 0;
  let totalBarcodeDiscounts = 0;
  for (const u of soldUnits) {
    const orig = Number(u.sellingPrice || 0);
    const sold = u.soldPrice !== null && u.soldPrice !== undefined ? Number(u.soldPrice) : orig;
    grossBarcodeTurnover += orig;
    netBarcodeTurnover += sold;
    if (orig > sold) totalBarcodeDiscounts += (orig - sold);
  }

  const finalGrossSales = Math.max(totalInvoicedRevenue + totalOrderDiscounts, grossBarcodeTurnover);
  const finalNetSales = Math.max(totalInvoicedRevenue, netBarcodeTurnover);
  const finalDiscountsConceded = Math.max(totalOrderDiscounts, totalBarcodeDiscounts);

  // Calculate GST Split via pure helper
  const gst = calculateGstSplit(finalGrossSales, 5);

  // 3. Stock Inward Receipts
  const inwardBatches = await client.inventoryBatch.findMany({
    where: {
      createdAt: { gte: period.startOfMonth, lte: period.endOfMonth },
      ...branchFilter
    },
    select: {
      id: true,
      openingQty: true
    }
  });
  const totalInwardUnits = inwardBatches.reduce((sum: number, b: any) => sum + (Number(b.openingQty) || 0), 0);
  const inwardAssetValuation = totalInwardUnits * 450;

  // 4. Wastage & Spoilage Write-Offs
  const wastageUnits = await client.inventoryUnit.findMany({
    where: {
      status: { in: [InventoryUnitStatus.DAMAGED, InventoryUnitStatus.EXPIRED] },
      updatedAt: { gte: period.startOfMonth, lte: period.endOfMonth },
      ...branchFilter
    },
    select: {
      status: true,
      damageReason: true,
      sellingPrice: true
    }
  });

  let totalWastageLoss = 0;
  const reasonMap: Record<string, { count: number; lossAmount: number }> = {};
  for (const u of wastageUnits) {
    const reason = u.damageReason || (u.status === 'EXPIRED' ? 'Unsold expired' : 'Unspecified damage');
    const loss = Number(u.sellingPrice || 0);
    totalWastageLoss += loss;
    if (!reasonMap[reason]) reasonMap[reason] = { count: 0, lossAmount: 0 };
    reasonMap[reason].count += 1;
    reasonMap[reason].lossAmount += loss;
  }

  // 5. Month-End Active Inventory Valuation
  const activeUnits = await client.inventoryUnit.findMany({
    where: {
      status: InventoryUnitStatus.IN_STOCK,
      ...branchFilter
    },
    select: {
      sellingPrice: true
    }
  });
  const closingInventoryCount = activeUnits.length;
  const closingInventoryValuation = activeUnits.reduce((sum: number, u: any) => sum + Number(u.sellingPrice || 0), 0);

  return {
    period: {
      month: period.month,
      monthName: period.monthName,
      year: period.year,
      startDate: period.startOfMonth.toISOString(),
      endDate: period.endOfMonth.toISOString(),
      branch: branchInfo
    },
    company: {
      tradeName: 'Gopal Cake Shop',
      legalOwner: 'Gopal Confectionery Pvt Ltd',
      gstin: '24AAAFG0000A1Z2',
      state: 'Gujarat (24)',
      city: 'Vadodara',
      natureOfBusiness: 'Bakery, Cakes, Desserts & Confectionery Manufacturing and Retail'
    },
    salesTurnover: {
      grossSales: finalGrossSales,
      discountsConceded: finalDiscountsConceded,
      netTaxableSales: gst.netTaxableSales,
      gstRatePercent: gst.gstRatePercent,
      estimatedGstAmount: gst.estimatedGstAmount,
      cgstAmount: gst.cgstAmount,
      sgstAmount: gst.sgstAmount,
      totalNetInvoiced: finalNetSales,
      totalOrdersCount: orders.length,
      paymentSplit
    },
    stockInward: {
      totalBatches: inwardBatches.length,
      totalUnitsReceived: totalInwardUnits,
      inwardAssetValuation
    },
    spoilageWriteOff: {
      totalUnitsWrittenOff: wastageUnits.length,
      totalLossAmount: totalWastageLoss,
      reasonBreakdown: Object.entries(reasonMap).map(([reason, d]) => ({
        reason,
        count: d.count,
        lossAmount: d.lossAmount
      }))
    },
    monthEndInventoryValuation: {
      activeUnitsCount: closingInventoryCount,
      inventoryAssetValuation: closingInventoryValuation
    },
    generatedAt: now.toISOString(),
    generatedBy: role || 'Store Admin'
  };
}
