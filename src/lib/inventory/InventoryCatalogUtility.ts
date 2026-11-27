/**
 * Gopal Cake Shop — Inventory Catalog Utility (Milestone M2)
 *
 * Implements:
 * 1. Zero-dependency RFC-4180 compliant CSV parser (parseRFC4180Csv).
 * 2. Robust JSON catalog parser (parseCatalogJson).
 * 3. Preprocessor and auto-caster for CSV/JSON rows (preprocessRawCatalogRow).
 * 4. Zod v4 schemas and discriminated union for all bakery categories.
 * 5. Programmatic inventory import and validation utility (InventoryCatalogUtility).
 * 6. Database seeding and population engine supporting dry-run, upsert, and branch fan-out.
 */

import { z } from 'zod';
import {
  BakeryCategoryEnum,
  type BakeryCategory,
  type BranchCode,
  type InventoryUnitOfMeasure,
  type StorageCondition,
  type PrepCategory,
  type RawIngredientCategory,
  type PackagingCategory,
  type CatalogItem,
  type FinishedGoodItem,
  type HotBakeItem,
  type BrownieTrayItem,
  type PrepStockItem,
  type RawIngredientItem,
  type PackagingItem,
  toCanonicalBranchId,
  fromCanonicalBranchId,
  toPrismaInventoryBatchInput,
  toPrismaInventoryUnitInput,
  toPrismaBrownieTrayInput,
  toPrismaPrepStockInput,
  toPrismaRawIngredientInput,
  getDefaultCatalogSeed,
} from './catalog-template';
import { prisma } from '../prisma';

// ============================================================================
// 1. INTERFACES & TYPES
// ============================================================================

export interface ImportOptions {
  defaultBranchCode?: BranchCode;
  dryRun?: boolean;
  autoGenerateSku?: boolean;
  allowPartial?: boolean;
  strict?: boolean;
}

export interface ValidationErrorItem {
  row: number;
  field: string;
  message: string;
  receivedValue?: any;
  rawRecord?: Record<string, any>;
}

export type ValidatedCatalogItem = CatalogItem;

export interface ValidationResult {
  valid: boolean;
  validItems: ValidatedCatalogItem[];
  invalidItems: ValidationErrorItem[];
  totalCount: number;
  errorCount: number;
  items: ValidatedCatalogItem[];  // Alias for test runner compatibility
  errors: ValidationErrorItem[];  // Alias for test runner compatibility
}

export type PopulateAction =
  | 'CREATED'
  | 'UPDATED'
  | 'SKIPPED'
  | 'WOULD_CREATE'
  | 'WOULD_UPDATE'
  | 'WOULD_SKIP'
  | 'FAILED';

export interface PopulateOptions {
  upsert?: boolean;
  dryRun?: boolean;
  targetBranch?: BranchCode;
  defaultQuantity?: number;
  batchTitle?: string;
  prisma?: any;
  stopOnError?: boolean;
  logger?: (msg: string) => void;
}

export interface ItemPopulateResult {
  sku: string;
  name: string;
  category: BakeryCategory;
  branchCode: BranchCode;
  branchId: string;
  model: 'InventoryBatch' | 'InventoryUnit' | 'BrownieTray' | 'PrepStock' | 'RawIngredient';
  action: PopulateAction;
  recordId?: string;
  details?: Record<string, any>;
  error?: string;
}

export interface PopulateSummary {
  success: boolean;
  totalProcessed: number;
  importedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  isDryRun: boolean;
  durationMs: number;
  batchesCreated: number;
  unitsCreated: number;
  brownieTraysCreated: number;
  prepStocksCreated: number;
  rawIngredientsCreated: number;
  details: ItemPopulateResult[];
  errors: string[];
}

// Canonical Branches Reference
export const CANONICAL_BRANCHES: { code: BranchCode; id: string }[] = [
  { code: 'VAR', id: 'varasiya' },
  { code: 'UMA', id: 'uma' },
  { code: 'KHD', id: 'khanderao' },
  { code: 'ELL', id: 'elora' },
];

// ============================================================================
// 2. ZERO-DEPENDENCY RFC-4180 CSV PARSER
// ============================================================================

/**
 * Deterministic RFC-4180 CSV Parser supporting:
 * - Double-quoted values containing commas, double quotes, and line breaks.
 * - Escaped double quotes represented as double consecutive quotes ("").
 * - CRLF (\r\n) and LF (\n) line terminations.
 * - UTF-8 Byte Order Mark (\uFEFF) stripping.
 * - Mandatory header check for 'name' and 'category'.
 */
export function parseRFC4180Csv(input: string): { rows: Record<string, string>[]; errors: string[] } {
  if (!input || !input.trim()) {
    return { rows: [], errors: ['Input data is empty'] };
  }

  let text = input;
  // Strip UTF-8 Byte Order Mark (BOM \uFEFF)
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && i + 1 < len && text[i + 1] === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(col => col !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
      } else {
        currentField += char;
        i++;
      }
    }
  }

  if (inQuotes) {
    return { rows: [], errors: ['Malformed CSV: Unclosed double quotation mark detected'] };
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(col => col !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) {
    return { rows: [], errors: ['CSV must contain header row and at least one data row'] };
  }

  const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
  if (!headers.includes('name') || !headers.includes('category')) {
    return { rows: [], errors: ['Missing required header columns: "name" and "category" are mandatory'] };
  }

  const resultRows: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const rowObj: Record<string, string> = {};
    headers.forEach((hdr, idx) => {
      rowObj[hdr] = rows[r][idx] !== undefined ? rows[r][idx] : '';
    });
    resultRows.push(rowObj);
  }

  return { rows: resultRows, errors: [] };
}

// ============================================================================
// 3. ROBUST JSON CATALOG PARSER
// ============================================================================

export function parseCatalogJson(input: string | any): { items: any[]; errors: string[] } {
  if (input === undefined || input === null || (typeof input === 'string' && !input.trim())) {
    return { items: [], errors: ['Input data is empty'] };
  }

  let parsed: any;
  try {
    parsed = typeof input === 'string' ? JSON.parse(input) : input;
  } catch (err: any) {
    return { items: [], errors: [`Malformed JSON: ${err.message}`] };
  }

  let items: any[] = [];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.items)) {
      items = parsed.items;
    } else if (Array.isArray(parsed.data)) {
      items = parsed.data;
    } else if (Array.isArray(parsed.catalog)) {
      items = parsed.catalog;
    } else {
      return { items: [], errors: ['JSON input must be an array of catalog items or an object containing an "items" array'] };
    }
  } else {
    return { items: [], errors: ['Invalid JSON format: expected an array or object'] };
  }

  return { items, errors: [] };
}

// ============================================================================
// 4. DATA PREPROCESSOR & AUTO-CASTING
// ============================================================================

export function preprocessRawCatalogRow(raw: Record<string, any>, index: number): Record<string, any> {
  const row = { ...raw };
  const rowIdx = index + 1;

  if (!row.sku || !String(row.sku).trim()) {
    row.sku = `TEST-INV-IMP-${rowIdx}`;
  }

  // Boolean parsing
  const boolKeys = ['isBarcodeTracked', 'requiresChiller', 'isEggless', 'allowIndividualPieceSale'];
  for (const k of boolKeys) {
    if (row[k] !== undefined && typeof row[k] === 'string') {
      const lower = row[k].toLowerCase().trim();
      if (lower === 'true' || lower === '1' || lower === 'yes') row[k] = true;
      else if (lower === 'false' || lower === '0' || lower === 'no') row[k] = false;
      else if (lower === '') delete row[k];
    }
  }

  // Numeric parsing
  const numKeys = [
    'sellingPrice', 'costPrice', 'alertThreshold', 'shelfLifeDays', 'shelfLifeHours',
    'gstRate', 'totalPieces', 'piecePrice', 'trayCostPrice', 'costPerUnit', 'batchYield',
    'piecesPerBundle', 'minReorderQuantity', 'defaultBatchQty', 'warmHoldingTempCelsius', 'quantity'
  ];
  for (const k of numKeys) {
    if (row[k] !== undefined && row[k] !== null) {
      if (typeof row[k] === 'string') {
        const trimmed = row[k].trim();
        if (trimmed === '') {
          delete row[k];
        } else {
          const num = Number(trimmed);
          row[k] = isNaN(num) ? trimmed : num;
        }
      }
    }
  }

  // Cross-mapping Brownie piecePrice / sellingPrice
  if (row.category === 'BROWNIE_TRAYS') {
    if (row.piecePrice === undefined && row.sellingPrice !== undefined) {
      row.piecePrice = row.sellingPrice;
    } else if (row.sellingPrice === undefined && row.piecePrice !== undefined) {
      row.sellingPrice = row.piecePrice;
    }
  }

  // Cross-mapping Prep costPerUnit / costPrice / sellingPrice
  if (row.category === 'PREP_STOCKS') {
    if (row.costPerUnit === undefined) {
      if (row.costPrice !== undefined) row.costPerUnit = row.costPrice;
      else if (row.sellingPrice !== undefined) row.costPerUnit = row.sellingPrice;
    }
    if (row.costPrice === undefined && row.costPerUnit !== undefined) {
      row.costPrice = row.costPerUnit;
    }
  }

  // Allowed destination branches parsing
  if (typeof row.allowedDestinationBranches === 'string') {
    row.allowedDestinationBranches = row.allowedDestinationBranches
      .split(/[,;|]/)
      .map((b: string) => b.trim())
      .filter(Boolean);
  }

  return row;
}

// ============================================================================
// 5. ZOD SCHEMAS (ZOD v4)
// ============================================================================

export const BranchCodeSchema = z.enum(['VAR', 'UMA', 'KHD', 'ELL', 'ALL']);
export const UnitSchema = z.enum(['kg', 'g', 'ltr', 'ml', 'pcs', 'units', 'trays', 'boxes', 'rolls', 'packets', 'tubs']).or(z.string());
export const StorageConditionSchema = z.enum(['AMBIENT', 'HEATED_WARMER', 'CHILLED', 'COOL_DRY', 'FROZEN']);

export const BaseCatalogItemZodSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Item name is required'),
  category: z.enum(['FINISHED_GOODS', 'HOT_BAKES', 'BROWNIE_TRAYS', 'PREP_STOCKS', 'RAW_INGREDIENTS', 'PACKAGING']),
  branchCode: BranchCodeSchema.default('VAR'),
  unit: UnitSchema.default('pcs'),
  alertThreshold: z.number().min(0, 'Alert threshold must be non-negative').default(5),
  costPrice: z.number().min(0, 'Cost price must be non-negative').default(0),
  storageCondition: StorageConditionSchema.default('AMBIENT'),
  shelfLifeDays: z.number().min(0, 'Shelf life days must be non-negative').default(3),
  shelfLifeHours: z.number().min(0).optional(),
  notes: z.string().optional(),
  isBarcodeTracked: z.boolean().default(false),
  gstRate: z.number().min(0).max(28).default(5),
});

export const FinishedGoodZodSchema = BaseCatalogItemZodSchema.extend({
  category: z.literal('FINISHED_GOODS'),
  variantWeight: z.string().default('500g'),
  flavor: z.string().default('General'),
  sellingPrice: z.number().min(0, 'Price cannot be negative'),
  isBarcodeTracked: z.literal(true).default(true),
  barcodePrefix: z.string().optional(),
  requiresChiller: z.boolean().default(true),
  isEggless: z.boolean().default(true),
  gstRate: z.literal(5).default(5),
  storageCondition: StorageConditionSchema.default('CHILLED'),
  prismaCategory: z.enum(['FRESH_BAKES', 'BOUQUETS', 'SIGNATURE_ADDONS']).optional(),
});

export const HotBakeZodSchema = BaseCatalogItemZodSchema.extend({
  category: z.literal('HOT_BAKES'),
  sellingPrice: z.number().min(0, 'Price cannot be negative'),
  isBarcodeTracked: z.literal(false).default(false),
  defaultBatchQty: z.number().min(1).default(30),
  warmHoldingTempCelsius: z.number().min(0).default(50).optional(),
  dietaryType: z.enum(['VEG', 'JAIN', 'NON_VEG']).default('VEG'),
  gstRate: z.literal(5).default(5),
  storageCondition: StorageConditionSchema.default('HEATED_WARMER'),
  shelfLifeHours: z.number().default(12).optional(),
  shelfLifeDays: z.number().min(0).default(1),
  prismaCategory: z.literal('HOT_BAKES').optional(),
});

export const BrownieTrayZodSchema = BaseCatalogItemZodSchema.extend({
  category: z.literal('BROWNIE_TRAYS'),
  flavor: z.string().default('Classic Chocolate'),
  totalPieces: z.number().min(1).default(16),
  piecePrice: z.number().min(0, 'Price cannot be negative').default(80),
  sellingPrice: z.number().min(0, 'Price cannot be negative').optional(),
  trayCostPrice: z.number().min(0).default(500).optional(),
  isBarcodeTracked: z.literal(true).default(true),
  trayDimensions: z.string().default('12x8 inch').optional(),
  allowIndividualPieceSale: z.boolean().default(true),
  gstRate: z.literal(5).default(5),
  storageCondition: StorageConditionSchema.default('COOL_DRY'),
  shelfLifeDays: z.number().default(7),
});

export const PrepStockZodSchema = BaseCatalogItemZodSchema.extend({
  category: z.literal('PREP_STOCKS'),
  prepCategory: z.enum(['SPONGE', 'CREAM', 'FILLING', 'BASE', 'SYRUP']).default('SPONGE'),
  flavor: z.string().optional(),
  costPerUnit: z.number().min(0, 'Cost per unit cannot be negative').default(50),
  sellingPrice: z.number().optional(),
  sourceBranch: z.literal('VAR').default('VAR'),
  allowedDestinationBranches: z.array(BranchCodeSchema).default(['UMA', 'KHD', 'ELL']),
  batchYield: z.number().min(0).default(10),
  gstRate: z.literal(0).default(0),
  storageCondition: StorageConditionSchema.default('CHILLED'),
  shelfLifeDays: z.number().default(3),
  isBarcodeTracked: z.literal(false).default(false),
});

export const RawIngredientZodSchema = BaseCatalogItemZodSchema.extend({
  category: z.literal('RAW_INGREDIENTS'),
  rawCategory: z.enum(['Dairy', 'Flour', 'Sweetener', 'Chocolate', 'Fats_Oils', 'Leavening_Flavors']).default('Flour'),
  preferredVendor: z.string().optional(),
  standardPackSize: z.string().default('50kg sack'),
  minReorderQuantity: z.number().min(0).default(50),
  hsnCode: z.string().optional(),
  gstRate: z.number().min(0).default(5),
  isBarcodeTracked: z.literal(false).default(false),
});

export const PackagingZodSchema = BaseCatalogItemZodSchema.extend({
  category: z.literal('PACKAGING'),
  packagingCategory: z.enum(['Cake_Box', 'Pastry_Box', 'Cake_Board', 'Ribbon', 'Knife_Candle', 'Carrier_Bag']).default('Cake_Box'),
  applicableSize: z.enum(['500g', '1kg', 'Pastry', 'Brownie', 'Universal']).default('Universal').optional(),
  dimensions: z.string().optional(),
  material: z.string().optional(),
  piecesPerBundle: z.number().min(1).default(50),
  gstRate: z.literal(18).default(18),
  isBarcodeTracked: z.literal(false).default(false),
});

export const CatalogItemZodSchema = z.discriminatedUnion('category', [
  FinishedGoodZodSchema,
  HotBakeZodSchema,
  BrownieTrayZodSchema,
  PrepStockZodSchema,
  RawIngredientZodSchema,
  PackagingZodSchema,
]);

// ============================================================================
// 6. INVENTORY CATALOG UTILITY CLASS
// ============================================================================

export class InventoryCatalogUtility {
  public parseCsv(input: string): { rows: Record<string, string>[]; errors: string[] } {
    return parseRFC4180Csv(input);
  }

  public parseJson(input: string | any): { items: any[]; errors: string[] } {
    return parseCatalogJson(input);
  }

  public validateAndParseBulkItems(rawRows: Record<string, any>[]): ValidationResult {
    const validCategories = [
      'FINISHED_GOODS',
      'HOT_BAKES',
      'BROWNIE_TRAYS',
      'PREP_STOCKS',
      'RAW_INGREDIENTS',
      'PACKAGING',
    ];
    const validItems: ValidatedCatalogItem[] = [];
    const invalidItems: ValidationErrorItem[] = [];

    rawRows.forEach((raw, idx) => {
      const rowIdx = idx + 1;
      const preprocessed = preprocessRawCatalogRow(raw, idx);

      // Mandatory Name Check
      if (!preprocessed.name || !String(preprocessed.name).trim()) {
        invalidItems.push({
          row: rowIdx,
          field: 'name',
          message: 'Item name is required',
          receivedValue: raw.name,
          rawRecord: raw,
        });
        return;
      }

      // Category Enum Check
      if (!preprocessed.category || !validCategories.includes(String(preprocessed.category))) {
        invalidItems.push({
          row: rowIdx,
          field: 'category',
          message: `Invalid category: ${raw.category}`,
          receivedValue: raw.category,
          rawRecord: raw,
        });
        return;
      }

      // Zod Validation
      const parseResult = CatalogItemZodSchema.safeParse(preprocessed);
      if (parseResult.success) {
        validItems.push(parseResult.data as ValidatedCatalogItem);
      } else {
        for (const issue of parseResult.error.issues) {
          let field =
            issue.path && issue.path.length > 0
              ? String(issue.path[0])
              : (issue as any).discriminator || 'general';
          let message = issue.message;
          let receivedValue =
            preprocessed[field] !== undefined ? preprocessed[field] : raw[field];

          if (
            (issue.code === 'invalid_union' || (issue as any).code === 'invalid_discriminator') &&
            ((issue as any).discriminator === 'category' || field === 'category')
          ) {
            field = 'category';
            message = `Invalid category: ${raw.category}`;
            receivedValue = raw.category;
          }

          invalidItems.push({
            row: rowIdx,
            field,
            message,
            receivedValue,
            rawRecord: raw,
          });
        }
      }
    });

    return {
      valid: invalidItems.length === 0,
      validItems,
      invalidItems,
      items: validItems,
      errors: invalidItems,
      totalCount: rawRows.length,
      errorCount: invalidItems.length,
    };
  }

  public async parseAndValidate(
    input: string | Buffer,
    format: 'csv' | 'json',
    options?: ImportOptions
  ): Promise<ValidationResult> {
    const text = Buffer.isBuffer(input) ? input.toString('utf-8') : String(input);
    let rawRows: Record<string, any>[] = [];

    if (format === 'csv') {
      const parsed = this.parseCsv(text);
      if (parsed.errors.length > 0) {
        const errors = parsed.errors.map(msg => ({
          row: 0,
          field: 'csv_format',
          message: msg,
          receivedValue: undefined,
        }));
        return {
          valid: false,
          validItems: [],
          invalidItems: errors,
          totalCount: 0,
          errorCount: errors.length,
          items: [],
          errors,
        };
      }
      rawRows = parsed.rows;
    } else {
      const parsed = this.parseJson(text);
      if (parsed.errors.length > 0) {
        const errors = parsed.errors.map(msg => ({
          row: 0,
          field: 'json_format',
          message: msg,
          receivedValue: undefined,
        }));
        return {
          valid: false,
          validItems: [],
          invalidItems: errors,
          totalCount: 0,
          errorCount: errors.length,
          items: [],
          errors,
        };
      }
      rawRows = parsed.items;
    }

    return this.validateAndParseBulkItems(rawRows);
  }

  public async populate(
    items: ValidatedCatalogItem[],
    options?: PopulateOptions
  ): Promise<PopulateSummary> {
    return populateInventoryCatalog(items, options);
  }
}

export const inventoryCatalogUtility = new InventoryCatalogUtility();

// ============================================================================
// 7. PROGRAMMATIC CONVENIENCE FUNCTIONS
// ============================================================================

export async function parseAndValidateInventory(
  input: string | Buffer,
  format: 'csv' | 'json',
  options?: ImportOptions
): Promise<ValidationResult> {
  return inventoryCatalogUtility.parseAndValidate(input, format, options);
}

/**
 * Core Database Seeding and Population Engine:
 * - Maps validated catalog items to Prisma models (InventoryBatch, InventoryUnit, BrownieTray, PrepStock, RawIngredient).
 * - Fans out items marked branchCode: 'ALL' across all 4 canonical branches (or filtered targetBranch).
 * - Supports dryRun: evaluates operations without mutating DB, returning simulated action counts.
 * - Supports upsert: if true updates existing records, if false skips existing records.
 */
export async function populateInventoryCatalog(
  items: ValidatedCatalogItem[],
  options?: PopulateOptions
): Promise<PopulateSummary> {
  const startTime = Date.now();
  const dryRun = Boolean(options?.dryRun);
  const upsert = Boolean(options?.upsert);
  const targetBranch = options?.targetBranch;
  const prismaClient = options?.prisma || prisma;

  const summary: PopulateSummary = {
    success: true,
    totalProcessed: items.length,
    importedCount: 0,
    createdCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    isDryRun: dryRun,
    durationMs: 0,
    batchesCreated: 0,
    unitsCreated: 0,
    brownieTraysCreated: 0,
    prepStocksCreated: 0,
    rawIngredientsCreated: 0,
    details: [],
    errors: [],
  };

  for (const item of items) {
    // Resolve branches for this item
    let branches: { code: BranchCode; id: string }[];
    if (targetBranch && targetBranch !== 'ALL') {
      branches = [{ code: targetBranch, id: toCanonicalBranchId(targetBranch) }];
    } else if (item.branchCode === 'ALL') {
      branches = [...CANONICAL_BRANCHES];
    } else {
      const code = item.branchCode || 'VAR';
      branches = [{ code, id: toCanonicalBranchId(code) }];
    }

    for (const branch of branches) {
      try {
        switch (item.category) {
          case 'FINISHED_GOODS': {
            const fgItem = item as FinishedGoodItem;
            let existingBatch: any = null;
            if (prismaClient && !dryRun) {
              existingBatch = await prismaClient.inventoryBatch.findFirst({
                where: { branchId: branch.id, title: item.name, isClosed: false },
              }).catch(() => null);
            }

            if (existingBatch) {
              if (upsert) {
                if (!dryRun) {
                  await prismaClient.inventoryBatch.update({
                    where: { id: existingBatch.id },
                    data: { notes: item.notes },
                  });
                }
                summary.updatedCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'InventoryBatch',
                  action: dryRun ? 'WOULD_UPDATE' : 'UPDATED',
                  recordId: existingBatch.id,
                });
              } else {
                summary.skippedCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'InventoryBatch',
                  action: dryRun ? 'WOULD_SKIP' : 'SKIPPED',
                  recordId: existingBatch.id,
                });
              }
            } else {
              const qty = options?.defaultQuantity ?? 1;
              if (dryRun) {
                summary.createdCount++;
                summary.batchesCreated++;
                summary.unitsCreated += qty;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'InventoryBatch',
                  action: 'WOULD_CREATE',
                });
              } else {
                const batchInput = toPrismaInventoryBatchInput(fgItem, branch.id, qty);
                const createdBatch = await prismaClient.inventoryBatch.create({
                  data: batchInput,
                });
                summary.batchesCreated++;

                for (let i = 0; i < qty; i++) {
                  const barcode = `${fgItem.barcodePrefix || ('BAR-' + fgItem.sku)}-${branch.code}-${String(i + 1).padStart(3, '0')}`;
                  await prismaClient.inventoryUnit.create({
                    data: toPrismaInventoryUnitInput(fgItem, createdBatch.id, branch.id, barcode),
                  });
                  summary.unitsCreated++;
                }

                summary.createdCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'InventoryBatch',
                  action: 'CREATED',
                  recordId: createdBatch.id,
                });
              }
            }
            break;
          }

          case 'HOT_BAKES': {
            const hbItem = item as HotBakeItem;
            let existingBatch: any = null;
            if (prismaClient && !dryRun) {
              existingBatch = await prismaClient.inventoryBatch.findFirst({
                where: { branchId: branch.id, title: item.name, isClosed: false },
              }).catch(() => null);
            }

            if (existingBatch) {
              if (upsert) {
                if (!dryRun) {
                  await prismaClient.inventoryBatch.update({
                    where: { id: existingBatch.id },
                    data: { notes: item.notes },
                  });
                }
                summary.updatedCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'InventoryBatch',
                  action: dryRun ? 'WOULD_UPDATE' : 'UPDATED',
                  recordId: existingBatch.id,
                });
              } else {
                summary.skippedCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'InventoryBatch',
                  action: dryRun ? 'WOULD_SKIP' : 'SKIPPED',
                  recordId: existingBatch.id,
                });
              }
            } else {
              const qty = options?.defaultQuantity ?? hbItem.defaultBatchQty ?? 30;
              if (dryRun) {
                summary.createdCount++;
                summary.batchesCreated++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'InventoryBatch',
                  action: 'WOULD_CREATE',
                });
              } else {
                const batchInput = {
                  ...toPrismaInventoryBatchInput(hbItem, branch.id, qty),
                  closingQty: qty,
                  bestBeforeDate: new Date(Date.now() + (hbItem.shelfLifeHours || 12) * 3600000),
                };
                const createdBatch = await prismaClient.inventoryBatch.create({
                  data: batchInput,
                });
                summary.batchesCreated++;
                summary.createdCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'InventoryBatch',
                  action: 'CREATED',
                  recordId: createdBatch.id,
                });
              }
            }
            break;
          }

          case 'BROWNIE_TRAYS': {
            const brwItem = item as BrownieTrayItem;
            const trayCode = `TRAY-${branch.code}-${brwItem.sku}`;
            let existingTray: any = null;
            if (prismaClient && !dryRun) {
              existingTray = await prismaClient.brownieTray.findUnique({
                where: { trayCode },
              }).catch(() => null);
            }

            if (existingTray) {
              if (upsert) {
                if (!dryRun) {
                  await prismaClient.brownieTray.update({
                    where: { trayCode },
                    data: {
                      piecePrice: brwItem.piecePrice,
                      totalPieces: brwItem.totalPieces,
                      flavor: brwItem.flavor,
                      title: brwItem.name,
                    },
                  });
                }
                summary.updatedCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'BrownieTray',
                  action: dryRun ? 'WOULD_UPDATE' : 'UPDATED',
                  recordId: existingTray.id,
                });
              } else {
                summary.skippedCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'BrownieTray',
                  action: dryRun ? 'WOULD_SKIP' : 'SKIPPED',
                  recordId: existingTray.id,
                });
              }
            } else {
              if (dryRun) {
                summary.createdCount++;
                summary.brownieTraysCreated++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'BrownieTray',
                  action: 'WOULD_CREATE',
                });
              } else {
                const trayInput = {
                  ...toPrismaBrownieTrayInput(brwItem, branch.id, trayCode),
                  bestBeforeDate: new Date(Date.now() + (brwItem.shelfLifeDays || 7) * 86400000),
                  notes: brwItem.notes,
                };
                const createdTray = await prismaClient.brownieTray.create({
                  data: trayInput,
                });
                summary.brownieTraysCreated++;
                summary.createdCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'BrownieTray',
                  action: 'CREATED',
                  recordId: createdTray.id,
                });
              }
            }
            break;
          }

          case 'PREP_STOCKS': {
            const prepItem = item as PrepStockItem;
            let existingPrep: any = null;
            if (prismaClient && !dryRun) {
              existingPrep = await prismaClient.prepStock.findFirst({
                where: { name: prepItem.name, branchId: branch.id },
              }).catch(() => null);
            }

            if (existingPrep) {
              if (upsert) {
                if (!dryRun) {
                  await prismaClient.prepStock.update({
                    where: { id: existingPrep.id },
                    data: {
                      costPerUnit: prepItem.costPerUnit,
                      minAlertLevel: prepItem.alertThreshold,
                      category: prepItem.prepCategory,
                      flavor: prepItem.flavor,
                    },
                  });
                }
                summary.updatedCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'PrepStock',
                  action: dryRun ? 'WOULD_UPDATE' : 'UPDATED',
                  recordId: existingPrep.id,
                });
              } else {
                summary.skippedCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'PrepStock',
                  action: dryRun ? 'WOULD_SKIP' : 'SKIPPED',
                  recordId: existingPrep.id,
                });
              }
            } else {
              if (dryRun) {
                summary.createdCount++;
                summary.prepStocksCreated++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'PrepStock',
                  action: 'WOULD_CREATE',
                });
              } else {
                const stock = options?.defaultQuantity ?? prepItem.batchYield ?? 0;
                const prepInput = toPrismaPrepStockInput(prepItem, branch.id, stock);
                const createdPrep = await prismaClient.prepStock.create({
                  data: prepInput,
                });
                summary.prepStocksCreated++;
                summary.createdCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'PrepStock',
                  action: 'CREATED',
                  recordId: createdPrep.id,
                });
              }
            }
            break;
          }

          case 'RAW_INGREDIENTS':
          case 'PACKAGING': {
            const rawOrPkgItem = item as RawIngredientItem | PackagingItem;
            let existingRaw: any = null;
            if (prismaClient && !dryRun) {
              existingRaw = await prismaClient.rawIngredient.findFirst({
                where: { name: rawOrPkgItem.name, branchId: branch.id },
              }).catch(() => null);
            }

            if (existingRaw) {
              if (upsert) {
                if (!dryRun) {
                  await prismaClient.rawIngredient.update({
                    where: { id: existingRaw.id },
                    data: {
                      costPerUnit: rawOrPkgItem.costPrice,
                      minAlertLevel: rawOrPkgItem.alertThreshold,
                      unit: rawOrPkgItem.unit,
                    },
                  });
                }
                summary.updatedCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'RawIngredient',
                  action: dryRun ? 'WOULD_UPDATE' : 'UPDATED',
                  recordId: existingRaw.id,
                });
              } else {
                summary.skippedCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'RawIngredient',
                  action: dryRun ? 'WOULD_SKIP' : 'SKIPPED',
                  recordId: existingRaw.id,
                });
              }
            } else {
              if (dryRun) {
                summary.createdCount++;
                summary.rawIngredientsCreated++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'RawIngredient',
                  action: 'WOULD_CREATE',
                });
              } else {
                const stock = options?.defaultQuantity ?? 0;
                const rawInput = toPrismaRawIngredientInput(rawOrPkgItem, branch.id, stock);
                const createdRaw = await prismaClient.rawIngredient.create({
                  data: rawInput,
                });
                summary.rawIngredientsCreated++;
                summary.createdCount++;
                summary.details.push({
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  branchCode: branch.code,
                  branchId: branch.id,
                  model: 'RawIngredient',
                  action: 'CREATED',
                  recordId: createdRaw.id,
                });
              }
            }
            break;
          }
        }
      } catch (err: any) {
        summary.errorCount++;
        summary.errors.push(`Error populating ${item.sku} (${item.name}) for branch ${branch.code}: ${err.message}`);
        summary.details.push({
          sku: item.sku,
          name: item.name,
          category: item.category,
          branchCode: branch.code,
          branchId: branch.id,
          model: 'InventoryBatch',
          action: 'FAILED',
          error: err.message,
        });

        if (options?.stopOnError) {
          summary.success = false;
          summary.durationMs = Date.now() - startTime;
          return summary;
        }
      }
    }
  }

  summary.importedCount = summary.createdCount + summary.updatedCount;
  summary.success = summary.errorCount === 0;
  summary.durationMs = Date.now() - startTime;
  return summary;
}

/**
 * Convenience helper to populate the default 35-item catalog.
 */
export async function seedDefaultCatalog(
  options?: PopulateOptions
): Promise<PopulateSummary> {
  const defaultItems = getDefaultCatalogSeed();
  return populateInventoryCatalog(defaultItems as ValidatedCatalogItem[], options);
}

export default inventoryCatalogUtility;
