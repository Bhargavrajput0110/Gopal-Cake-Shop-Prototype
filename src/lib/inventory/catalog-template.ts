/**
 * Gopal Cake Shop — Comprehensive Inventory Catalog Template
 * 
 * Defines strong-typed interfaces, enums, discriminated unions,
 * EOD closing reconciliation structures, spoilage loss tracking,
 * CA monthly audit reporting types, 35 realistic seed catalog items,
 * and bidirectional Prisma adapters across all 7 bakery inventory categories.
 */

// ============================================================================
// 1. ENUMS & CORE VALUE TYPES
// ============================================================================

export enum BakeryCategoryEnum {
  FINISHED_GOODS = 'FINISHED_GOODS',
  HOT_BAKES = 'HOT_BAKES',
  BROWNIE_TRAYS = 'BROWNIE_TRAYS',
  PREP_STOCKS = 'PREP_STOCKS',
  RAW_INGREDIENTS = 'RAW_INGREDIENTS',
  PACKAGING = 'PACKAGING',
  EOD_AUDIT = 'EOD_AUDIT',
}

export type BakeryCategory = keyof typeof BakeryCategoryEnum;

export type BranchCode = 'VAR' | 'UMA' | 'KHD' | 'ELL' | 'ALL';

export type InventoryUnitOfMeasure =
  | 'kg'
  | 'g'
  | 'ltr'
  | 'ml'
  | 'pcs'
  | 'units'
  | 'trays'
  | 'boxes'
  | 'rolls'
  | 'packets'
  | 'tubs';

export type StorageCondition =
  | 'AMBIENT'         // 18°C–25°C: Flour, sugar, packaging, biscuits
  | 'HEATED_WARMER'   // 45°C–55°C: Hot bakes, Samosas, Puffs
  | 'CHILLED'         // +2°C–+6°C: Cakes, pastries, creams, compotes
  | 'COOL_DRY'        // 18°C–22°C: Brownie trays, chocolate compound
  | 'FROZEN';         // -18°C: Sponges reserve, frozen puree

// ============================================================================
// 2. CATEGORY ITEM INTERFACES
// ============================================================================

/** Base contract shared across all inventory catalog items */
export interface BaseCatalogItem {
  id?: string;
  sku: string;
  name: string;
  category: BakeryCategory;
  branchCode: BranchCode;
  unit: InventoryUnitOfMeasure;
  alertThreshold: number;
  costPrice: number;              // In INR (₹)
  storageCondition: StorageCondition;
  shelfLifeDays: number;
  shelfLifeHours?: number;        // For hot bakes (e.g. 12 hours)
  notes?: string;
  isBarcodeTracked: boolean;
  gstRate: number;                // 0, 5, 12, or 18%
}

/** 1. Finished Bakery Goods (Cakes, Pastries, Whole Units) */
export interface FinishedGoodItem extends BaseCatalogItem {
  category: 'FINISHED_GOODS';
  variantWeight: '500g' | '1kg' | 'Pastry' | 'Piece' | string;
  flavor: string;
  sellingPrice: number;           // In INR (₹)
  isBarcodeTracked: true;
  barcodePrefix: string;          // e.g. "BAR-FG-VAR-PINE-500"
  requiresChiller: boolean;       // true
  isEggless: boolean;
  gstRate: 5;
  prismaCategory?: 'FRESH_BAKES' | 'BOUQUETS' | 'SIGNATURE_ADDONS';
}

/** 2. Hot Bakes (Samosas, Veg Puffs, Paneer Puffs, Biscuits, Snack Batches) */
export interface HotBakeItem extends BaseCatalogItem {
  category: 'HOT_BAKES';
  sellingPrice: number;           // In INR (₹)
  isBarcodeTracked: false;        // Counter stock, non-barcode
  defaultBatchQty: number;        // Standard daily baking batch size
  warmHoldingTempCelsius?: number;// e.g. 50°C
  dietaryType: 'VEG' | 'JAIN' | 'NON_VEG';
  gstRate: 5;
  prismaCategory?: 'HOT_BAKES';
}

/** 3. Brownie Trays & Pieces (Fresh Cut Trays, Piece Counts, Piece Prices) */
export interface BrownieTrayItem extends BaseCatalogItem {
  category: 'BROWNIE_TRAYS';
  flavor: string;
  totalPieces: number;            // Standard cut pieces per tray (12, 16, 24)
  piecePrice: number;             // Selling price per cut piece in INR (₹)
  trayCostPrice: number;          // Wholesale/production cost of full tray
  isBarcodeTracked: true;         // Tray barcode tracking
  trayDimensions?: string;        // e.g. "12x8 inch"
  allowIndividualPieceSale: boolean;
  gstRate: 5;
}

/** 4. Central Kitchen Prep Stocks (Sponges, Creams, Fillings, Syrups) */
export type PrepCategory = 'SPONGE' | 'CREAM' | 'FILLING' | 'BASE' | 'SYRUP';

export interface PrepStockItem extends BaseCatalogItem {
  category: 'PREP_STOCKS';
  prepCategory: PrepCategory;
  flavor?: string;
  costPerUnit: number;            // Production/transfer cost in INR (₹)
  sourceBranch: 'VAR';            // Produced at Warasiya Central Factory
  allowedDestinationBranches: BranchCode[]; // ['UMA', 'KHD', 'ELL']
  batchYield: number;             // Standard batch yield in UOM
  gstRate: 0;                     // Internal transfer
}

/** 5. Bulk Raw Ingredients (Flour, Sugar, Butter, Milk, Chocolate Compound) */
export type RawIngredientCategory =
  | 'Dairy'
  | 'Flour'
  | 'Sweetener'
  | 'Chocolate'
  | 'Fats_Oils'
  | 'Leavening_Flavors';

export interface RawIngredientItem extends BaseCatalogItem {
  category: 'RAW_INGREDIENTS';
  rawCategory: RawIngredientCategory;
  preferredVendor?: string;       // e.g. "Amul Dairy", "Puratos", "APMC"
  standardPackSize: string;       // e.g. "50kg sack", "20kg case", "1L pouch"
  minReorderQuantity: number;
  hsnCode?: string;
  gstRate: number;
}

/** 6. Packaging & Accessories (Boxes, Boards, Ribbons, Knives, Bags) */
export type PackagingCategory =
  | 'Cake_Box'
  | 'Pastry_Box'
  | 'Cake_Board'
  | 'Ribbon'
  | 'Knife_Candle'
  | 'Carrier_Bag';

export interface PackagingItem extends BaseCatalogItem {
  category: 'PACKAGING';
  packagingCategory: PackagingCategory;
  applicableSize?: '500g' | '1kg' | 'Pastry' | 'Brownie' | 'Universal';
  dimensions?: string;            // e.g. "8x8x5 inch", "10 inch round"
  material?: string;              // e.g. "350 GSM Food-Grade FBB Board"
  piecesPerBundle: number;        // e.g. 50 boxes per shrink bundle
  gstRate: 18;                    // 18% GST for paperboard & plastic accessories
}

/** Discriminated union of all 6 catalog item types */
export type CatalogItem =
  | FinishedGoodItem
  | HotBakeItem
  | BrownieTrayItem
  | PrepStockItem
  | RawIngredientItem
  | PackagingItem;

// ============================================================================
// 3. EOD CLOSING, SPOILAGE LOSS & CA MONTHLY AUDIT STRUCTURES
// ============================================================================

export type EodDispositionAction =
  | 'CLEARANCE_DISCOUNT'  // 50% discount during final evening hour
  | 'STAFF_MEAL'          // Distributed to shift staff
  | 'CHARITY_DONATION'    // Donated to local food bank/NGO
  | 'WASTE_SCRAP'         // Discarded / written off as spoilage
  | 'ROLLOVER_NEXT_DAY';  // Carried over if shelf-life permits

export interface HotBakeEodClosingItem {
  itemId: string;
  sku: string;
  itemName: string;
  openingQty: number;
  producedOrReceivedQty: number;
  soldQty: number;
  expectedRemainingQty: number; // opening + produced - sold
  physicalRemainingQty: number; // counted at closing
  varianceQty: number;          // physical - expected (negative = unaccounted shortage)
  varianceReason?: string;
  dispositionAction: EodDispositionAction;
  spoilageLossAmount: number;   // physicalRemainingQty * costPrice
}

export interface FinishedGoodEodChillerAudit {
  unitBarcode: string;
  sku: string;
  itemName: string;
  variantWeight: string;
  systemStatus: 'IN_STOCK' | 'SOLD' | 'DAMAGED';
  physicalFound: boolean;
  statusMismatch: boolean;      // System says IN_STOCK but physically missing
  notes?: string;
}

export interface CashReconciliationItem {
  tenderMethod: 'CASH' | 'UPI' | 'CARD' | 'ZOMATO_SWIGGY';
  systemExpectedAmount: number;
  physicalDrawerAmount: number;
  varianceAmount: number;       // physical - expected
  explanation?: string;
}

export interface EodBranchClosingReport {
  id: string;
  branchCode: BranchCode;
  closingDate: string;          // YYYY-MM-DD
  closedAt: string;             // ISO 8601 timestamp
  closedByUserId: string;
  closedByUserName: string;
  hotBakesReconciliation: HotBakeEodClosingItem[];
  finishedGoodsAudit: FinishedGoodEodChillerAudit[];
  brownieTraysActive: {
    trayCode: string;
    flavor: string;
    remainingPieces: number;
  }[];
  cashReconciliation: CashReconciliationItem[];
  totalSpoilageCostLoss: number;
  totalRetailRevenueLost: number;
  managerNotes?: string;
  isVerified: boolean;
  verifiedByManagerId?: string;
}

export enum DamageReasonCode {
  EXPIRED_SHELF_LIFE = 'EXPIRED_SHELF_LIFE',
  DROPPED_DAMAGED_IN_STORE = 'DROPPED_DAMAGED_IN_STORE',
  TRANSIT_DAMAGE = 'TRANSIT_DAMAGE',
  REFRIGERATION_FAILURE = 'REFRIGERATION_FAILURE',
  QUALITY_DEFECT = 'QUALITY_DEFECT',
  CUSTOMER_RETURN_DEFECTIVE = 'CUSTOMER_RETURN_DEFECTIVE',
  OVERBAKED_BURNT = 'OVERBAKED_BURNT',
  STALE_UNSOLD_EOD = 'STALE_UNSOLD_EOD',
}

export interface SpoilageRecord {
  id: string;
  branchCode: BranchCode;
  recordedAt: string;           // ISO 8601 timestamp
  recordedByUserId: string;
  itemCategory: BakeryCategory;
  itemId?: string;
  sku: string;
  itemName: string;
  barcode?: string;             // Required for Finished Goods or Brownie Trays
  quantity: number;
  unit: InventoryUnitOfMeasure;
  costPricePerUnit: number;
  sellingPricePerUnit: number;
  totalCostLoss: number;        // quantity * costPricePerUnit
  totalRetailLoss: number;      // quantity * sellingPricePerUnit
  reasonCode: DamageReasonCode;
  notes: string;
  photoUrl?: string;
  ledgerEntryId?: string;       // Linked to LedgerEntry WRITE_OFF
}

export interface CaCategoryValuation {
  category: BakeryCategory;
  openingStockValue: number;
  purchasesOrProductionValue: number;
  costOfGoodsSold: number;
  spoilageWriteOffValue: number;
  closingStockValue: number;
  varianceAmount: number;
}

export interface CaBranchAuditSummary {
  branchCode: BranchCode;
  branchName: string;
  month: string;                // YYYY-MM
  totalOpeningStockValue: number;
  totalPurchasesValue: number;
  totalInterBranchReceivedValue: number;
  totalInterBranchDispatchedValue: number;
  totalCogs: number;
  totalSpoilageLoss: number;
  totalClosingStockValue: number;
  spoilagePercentageOfSales: number;
  grossMarginPercentage: number;
  gstReconciliation: {
    taxableBakerySales5Pct: number;
    gstCollected5Pct: number;
    taxablePackagingSales18Pct: number;
    gstCollected18Pct: number;
    inputTaxCreditClaimed: number;
    netGstPayable: number;
  };
}

export interface CaMonthlyAuditReport {
  reportId: string;
  fiscalYear: string;           // e.g. "2026-2027"
  month: string;                // e.g. "2026-11"
  generatedAt: string;
  auditorCompanyName: string;
  caReviewStatus: 'DRAFT' | 'REVIEWED' | 'CERTIFIED';
  certifiedByCaName?: string;
  branchSummaries: CaBranchAuditSummary[];
  categoryValuations: CaCategoryValuation[];
  totalCompanyStockValue: number;
  totalCompanySpoilageLoss: number;
  auditNotes: string[];
}

// ============================================================================
// 4. REALISTIC SEED DATA CATALOG (35 ITEMS ACROSS ALL CATEGORIES)
// ============================================================================

export const SEED_CATALOG: CatalogItem[] = [
  // --------------------------------------------------------------------------
  // Category 1: Finished Bakery Goods (7 items)
  // --------------------------------------------------------------------------
  {
    sku: 'FG-PINE-500',
    name: 'Classic Pineapple Cake 500g',
    category: 'FINISHED_GOODS',
    branchCode: 'VAR',
    variantWeight: '500g',
    flavor: 'Pineapple',
    sellingPrice: 350,
    costPrice: 140,
    unit: 'pcs',
    alertThreshold: 3,
    shelfLifeDays: 3,
    storageCondition: 'CHILLED',
    isBarcodeTracked: true,
    barcodePrefix: 'BAR-FG-VAR-PINE-500',
    requiresChiller: true,
    isEggless: true,
    gstRate: 5,
    notes: 'Whipped fresh cream with crushed pineapple compote layered inside soft vanilla sponge.',
  },
  {
    sku: 'FG-PINE-1K',
    name: 'Classic Pineapple Cake 1kg',
    category: 'FINISHED_GOODS',
    branchCode: 'VAR',
    variantWeight: '1kg',
    flavor: 'Pineapple',
    sellingPrice: 650,
    costPrice: 260,
    unit: 'pcs',
    alertThreshold: 2,
    shelfLifeDays: 3,
    storageCondition: 'CHILLED',
    isBarcodeTracked: true,
    barcodePrefix: 'BAR-FG-VAR-PINE-1K',
    requiresChiller: true,
    isEggless: true,
    gstRate: 5,
    notes: 'Family size double layered pineapple cake decorated with cherry glaze rosettes.',
  },
  {
    sku: 'FG-BF-500',
    name: 'Royal Black Forest Cake 500g',
    category: 'FINISHED_GOODS',
    branchCode: 'VAR',
    variantWeight: '500g',
    flavor: 'Black Forest',
    sellingPrice: 400,
    costPrice: 160,
    unit: 'pcs',
    alertThreshold: 3,
    shelfLifeDays: 3,
    storageCondition: 'CHILLED',
    isBarcodeTracked: true,
    barcodePrefix: 'BAR-FG-VAR-BF-500',
    requiresChiller: true,
    isEggless: true,
    gstRate: 5,
    notes: 'Chocolate sponge soaked in cherry syrup, frosted with vanilla cream and chocolate curls.',
  },
  {
    sku: 'FG-BF-1K',
    name: 'Royal Black Forest Cake 1kg',
    category: 'FINISHED_GOODS',
    branchCode: 'VAR',
    variantWeight: '1kg',
    flavor: 'Black Forest',
    sellingPrice: 750,
    costPrice: 300,
    unit: 'pcs',
    alertThreshold: 2,
    shelfLifeDays: 3,
    storageCondition: 'CHILLED',
    isBarcodeTracked: true,
    barcodePrefix: 'BAR-FG-VAR-BF-1K',
    requiresChiller: true,
    isEggless: true,
    gstRate: 5,
    notes: 'Double tier black forest cake with red maraschino cherries and Dutch dark chocolate shavings.',
  },
  {
    sku: 'FG-TRUF-500',
    name: 'Dutch Chocolate Truffle Cake 500g',
    category: 'FINISHED_GOODS',
    branchCode: 'VAR',
    variantWeight: '500g',
    flavor: 'Chocolate Truffle',
    sellingPrice: 480,
    costPrice: 200,
    unit: 'pcs',
    alertThreshold: 4,
    shelfLifeDays: 4,
    storageCondition: 'CHILLED',
    isBarcodeTracked: true,
    barcodePrefix: 'BAR-FG-VAR-TRUF-500',
    requiresChiller: true,
    isEggless: true,
    gstRate: 5,
    notes: 'Velvety dark chocolate sponge covered in dense 55% cocoa truffle ganache glaze.',
  },
  {
    sku: 'FG-RV-500',
    name: 'Red Velvet Cream Cheese Cake 500g',
    category: 'FINISHED_GOODS',
    branchCode: 'VAR',
    variantWeight: '500g',
    flavor: 'Red Velvet',
    sellingPrice: 550,
    costPrice: 230,
    unit: 'pcs',
    alertThreshold: 2,
    shelfLifeDays: 3,
    storageCondition: 'CHILLED',
    isBarcodeTracked: true,
    barcodePrefix: 'BAR-FG-VAR-RV-500',
    requiresChiller: true,
    isEggless: true,
    gstRate: 5,
    notes: 'Crimson cocoa sponge layered with Philadelphia-style cream cheese frosting.',
  },
  {
    sku: 'FG-PAS-CHOC',
    name: 'Chocolate Marquise Pastry',
    category: 'FINISHED_GOODS',
    branchCode: 'VAR',
    variantWeight: 'Pastry',
    flavor: 'Dark Chocolate',
    sellingPrice: 90,
    costPrice: 35,
    unit: 'pcs',
    alertThreshold: 6,
    shelfLifeDays: 2,
    storageCondition: 'CHILLED',
    isBarcodeTracked: true,
    barcodePrefix: 'BAR-FG-VAR-PAS-CHOC',
    requiresChiller: true,
    isEggless: true,
    gstRate: 5,
    notes: 'Single-serve French style chocolate marquise slice with gold leaf dusting.',
  },

  // --------------------------------------------------------------------------
  // Category 2: Hot Bakes & Counter Snacks (5 items)
  // --------------------------------------------------------------------------
  {
    sku: 'HB-SAMOSA',
    name: 'Punjabi Aloo Samosa',
    category: 'HOT_BAKES',
    branchCode: 'ALL',
    sellingPrice: 25,
    costPrice: 10,
    unit: 'pcs',
    alertThreshold: 10,
    shelfLifeDays: 1,
    shelfLifeHours: 12,
    storageCondition: 'HEATED_WARMER',
    isBarcodeTracked: false,
    defaultBatchQty: 40,
    warmHoldingTempCelsius: 50,
    dietaryType: 'VEG',
    gstRate: 5,
    notes: 'Crispy pastry triangle stuffed with cumin-spiced potatoes and green peas.',
  },
  {
    sku: 'HB-VEG-PUFF',
    name: 'Baked Veggie Puff',
    category: 'HOT_BAKES',
    branchCode: 'ALL',
    sellingPrice: 30,
    costPrice: 12,
    unit: 'pcs',
    alertThreshold: 15,
    shelfLifeDays: 1,
    shelfLifeHours: 12,
    storageCondition: 'HEATED_WARMER',
    isBarcodeTracked: false,
    defaultBatchQty: 50,
    warmHoldingTempCelsius: 50,
    dietaryType: 'VEG',
    gstRate: 5,
    notes: 'Flaky baked golden puff pastry stuffed with spiced carrots, potatoes, and beans.',
  },
  {
    sku: 'HB-PANEER-PUFF',
    name: 'Paneer Tikka Puff',
    category: 'HOT_BAKES',
    branchCode: 'ALL',
    sellingPrice: 45,
    costPrice: 18,
    unit: 'pcs',
    alertThreshold: 10,
    shelfLifeDays: 1,
    shelfLifeHours: 12,
    storageCondition: 'HEATED_WARMER',
    isBarcodeTracked: false,
    defaultBatchQty: 30,
    warmHoldingTempCelsius: 50,
    dietaryType: 'VEG',
    gstRate: 5,
    notes: 'Tandoori-marinated cottage cheese cubes folded in crisp buttery puff pastry.',
  },
  {
    sku: 'HB-CHEESE-CORN',
    name: 'Cheese Corn Crispy Puff',
    category: 'HOT_BAKES',
    branchCode: 'ALL',
    sellingPrice: 40,
    costPrice: 16,
    unit: 'pcs',
    alertThreshold: 10,
    shelfLifeDays: 1,
    shelfLifeHours: 12,
    storageCondition: 'HEATED_WARMER',
    isBarcodeTracked: false,
    defaultBatchQty: 30,
    warmHoldingTempCelsius: 50,
    dietaryType: 'VEG',
    gstRate: 5,
    notes: 'Melted processed cheese with sweet American corn kernels inside golden crust.',
  },
  {
    sku: 'HB-SURATI-KHARI',
    name: 'Surati Jeera Butter Khari (250g)',
    category: 'HOT_BAKES',
    branchCode: 'ALL',
    sellingPrice: 80,
    costPrice: 38,
    unit: 'packets',
    alertThreshold: 8,
    shelfLifeDays: 15,
    storageCondition: 'AMBIENT',
    isBarcodeTracked: false,
    defaultBatchQty: 25,
    dietaryType: 'VEG',
    gstRate: 5,
    notes: 'Traditional puff biscuits roasted with cumin seeds, ideal for morning chai.',
  },

  // --------------------------------------------------------------------------
  // Category 3: Brownie Trays & Pieces (4 items)
  // --------------------------------------------------------------------------
  {
    sku: 'BRW-WALNUT-TRAY',
    name: 'Classic Walnut Fudge Brownie Tray',
    category: 'BROWNIE_TRAYS',
    branchCode: 'ALL',
    flavor: 'Walnut Chocolate',
    totalPieces: 16,
    piecePrice: 90,
    trayCostPrice: 550,
    costPrice: 550,
    unit: 'trays',
    alertThreshold: 1,
    shelfLifeDays: 7,
    storageCondition: 'COOL_DRY',
    isBarcodeTracked: true,
    trayDimensions: '12x8 inch',
    allowIndividualPieceSale: true,
    gstRate: 5,
    notes: 'Rich chocolate brownie tray loaded with toasted Californian walnut pieces.',
  },
  {
    sku: 'BRW-TRIPLE-CHOC',
    name: 'Belgian Triple Chocolate Brownie Tray',
    category: 'BROWNIE_TRAYS',
    branchCode: 'ALL',
    flavor: 'Triple Chocolate',
    totalPieces: 16,
    piecePrice: 100,
    trayCostPrice: 650,
    costPrice: 650,
    unit: 'trays',
    alertThreshold: 1,
    shelfLifeDays: 7,
    storageCondition: 'COOL_DRY',
    isBarcodeTracked: true,
    trayDimensions: '12x8 inch',
    allowIndividualPieceSale: true,
    gstRate: 5,
    notes: 'Dark, milk, and white chocolate chunks blended into dense fudgy brownie.',
  },
  {
    sku: 'BRW-NUTELLA-TRAY',
    name: 'Nutella Hazelnut Swirl Brownie Tray',
    category: 'BROWNIE_TRAYS',
    branchCode: 'ALL',
    flavor: 'Nutella Hazelnut',
    totalPieces: 12,
    piecePrice: 120,
    trayCostPrice: 720,
    costPrice: 720,
    unit: 'trays',
    alertThreshold: 1,
    shelfLifeDays: 7,
    storageCondition: 'COOL_DRY',
    isBarcodeTracked: true,
    trayDimensions: '12x8 inch',
    allowIndividualPieceSale: true,
    gstRate: 5,
    notes: 'Heavy swirls of hazelnut cocoa spread over extra-thick fudge brownie tray.',
  },
  {
    sku: 'BRW-EGGLESS-CHIP',
    name: 'Eggless Choco Chip Brownie Tray',
    category: 'BROWNIE_TRAYS',
    branchCode: 'ALL',
    flavor: 'Choco Chip Eggless',
    totalPieces: 16,
    piecePrice: 80,
    trayCostPrice: 500,
    costPrice: 500,
    unit: 'trays',
    alertThreshold: 1,
    shelfLifeDays: 7,
    storageCondition: 'COOL_DRY',
    isBarcodeTracked: true,
    trayDimensions: '12x8 inch',
    allowIndividualPieceSale: true,
    gstRate: 5,
    notes: '100% vegetarian brownie tray packed with dark chocolate chips.',
  },

  // --------------------------------------------------------------------------
  // Category 4: Central Kitchen Prep Stocks (7 items)
  // --------------------------------------------------------------------------
  {
    sku: 'PRP-SPG-VAN-500',
    name: 'Vanilla Sponge Round (500g Base)',
    category: 'PREP_STOCKS',
    prepCategory: 'SPONGE',
    flavor: 'Vanilla',
    branchCode: 'VAR',
    sourceBranch: 'VAR',
    allowedDestinationBranches: ['UMA', 'KHD', 'ELL'],
    costPerUnit: 55,
    costPrice: 55,
    unit: 'pcs',
    alertThreshold: 15,
    batchYield: 24,
    shelfLifeDays: 5,
    storageCondition: 'CHILLED',
    isBarcodeTracked: false,
    gstRate: 0,
    notes: 'Baked 6-inch round vanilla sponge ready for syrup soaking and cream assembly.',
  },
  {
    sku: 'PRP-SPG-VAN-1K',
    name: 'Vanilla Sponge Round (1kg Base)',
    category: 'PREP_STOCKS',
    prepCategory: 'SPONGE',
    flavor: 'Vanilla',
    branchCode: 'VAR',
    sourceBranch: 'VAR',
    allowedDestinationBranches: ['UMA', 'KHD', 'ELL'],
    costPerUnit: 95,
    costPrice: 95,
    unit: 'pcs',
    alertThreshold: 10,
    batchYield: 18,
    shelfLifeDays: 5,
    storageCondition: 'CHILLED',
    isBarcodeTracked: false,
    gstRate: 0,
    notes: 'Baked 8-inch round vanilla sponge base for 1kg celebration cakes.',
  },
  {
    sku: 'PRP-SPG-CHOC-500',
    name: 'Dark Chocolate Sponge Round (500g Base)',
    category: 'PREP_STOCKS',
    prepCategory: 'SPONGE',
    flavor: 'Dark Chocolate',
    branchCode: 'VAR',
    sourceBranch: 'VAR',
    allowedDestinationBranches: ['UMA', 'KHD', 'ELL'],
    costPerUnit: 65,
    costPrice: 65,
    unit: 'pcs',
    alertThreshold: 20,
    batchYield: 24,
    shelfLifeDays: 5,
    storageCondition: 'CHILLED',
    isBarcodeTracked: false,
    gstRate: 0,
    notes: 'Dutch cocoa infused 6-inch round sponge for truffle and black forest cakes.',
  },
  {
    sku: 'PRP-CRM-WHIP',
    name: 'Dairy Whipped Frosting Cream',
    category: 'PREP_STOCKS',
    prepCategory: 'CREAM',
    flavor: 'Vanilla Sweet Cream',
    branchCode: 'VAR',
    sourceBranch: 'VAR',
    allowedDestinationBranches: ['UMA', 'KHD', 'ELL'],
    costPerUnit: 160,
    costPrice: 160,
    unit: 'kg',
    alertThreshold: 8,
    batchYield: 15,
    shelfLifeDays: 4,
    storageCondition: 'CHILLED',
    isBarcodeTracked: false,
    gstRate: 0,
    notes: 'Aerated sweetened dairy whipping cream dispatched in chilled food containers.',
  },
  {
    sku: 'PRP-CRM-TRUF',
    name: 'Rich Chocolate Truffle Ganache',
    category: 'PREP_STOCKS',
    prepCategory: 'CREAM',
    flavor: 'Dark Chocolate 55%',
    branchCode: 'VAR',
    sourceBranch: 'VAR',
    allowedDestinationBranches: ['UMA', 'KHD', 'ELL'],
    costPerUnit: 280,
    costPrice: 280,
    unit: 'kg',
    alertThreshold: 6,
    batchYield: 10,
    shelfLifeDays: 7,
    storageCondition: 'CHILLED',
    isBarcodeTracked: false,
    gstRate: 0,
    notes: '2:1 dark chocolate and dairy cream emulsion for truffle piping and mirror coating.',
  },
  {
    sku: 'PRP-FIL-PINE',
    name: 'Homemade Pineapple Compote Chunks Filling',
    category: 'PREP_STOCKS',
    prepCategory: 'FILLING',
    flavor: 'Pineapple',
    branchCode: 'VAR',
    sourceBranch: 'VAR',
    allowedDestinationBranches: ['UMA', 'KHD', 'ELL'],
    costPerUnit: 140,
    costPrice: 140,
    unit: 'kg',
    alertThreshold: 5,
    batchYield: 8,
    shelfLifeDays: 6,
    storageCondition: 'CHILLED',
    isBarcodeTracked: false,
    gstRate: 0,
    notes: 'Slow-simmered diced fresh pineapple compote with natural pectin.',
  },
  {
    sku: 'PRP-SYR-VAN',
    name: 'Vanilla Sugar Soaking Syrup',
    category: 'PREP_STOCKS',
    prepCategory: 'SYRUP',
    flavor: 'Vanilla Syrup',
    branchCode: 'VAR',
    sourceBranch: 'VAR',
    allowedDestinationBranches: ['UMA', 'KHD', 'ELL'],
    costPerUnit: 45,
    costPrice: 45,
    unit: 'ltr',
    alertThreshold: 5,
    batchYield: 10,
    shelfLifeDays: 10,
    storageCondition: 'CHILLED',
    isBarcodeTracked: false,
    gstRate: 0,
    notes: 'Sugar syrup flavored with natural vanilla bean extract for cake moistening.',
  },

  // --------------------------------------------------------------------------
  // Category 5: Bulk Raw Ingredients (6 items)
  // --------------------------------------------------------------------------
  {
    sku: 'RAW-FLR-MAIDA',
    name: 'Ultra-Fine Bakery Maida (Refined Wheat Flour)',
    category: 'RAW_INGREDIENTS',
    rawCategory: 'Flour',
    branchCode: 'VAR',
    unit: 'kg',
    alertThreshold: 100,
    costPrice: 34,
    preferredVendor: 'Local Flour Mill APMC',
    standardPackSize: '50kg sack',
    minReorderQuantity: 200,
    shelfLifeDays: 90,
    storageCondition: 'AMBIENT',
    isBarcodeTracked: false,
    gstRate: 0,
    notes: 'High-gluten refined wheat flour for cake sponge and puff pastry laminations.',
  },
  {
    sku: 'RAW-SWT-SUGAR',
    name: 'Pure Refined Crystal Sugar',
    category: 'RAW_INGREDIENTS',
    rawCategory: 'Sweetener',
    branchCode: 'VAR',
    unit: 'kg',
    alertThreshold: 100,
    costPrice: 40,
    preferredVendor: 'Madhur Sugar / APMC',
    standardPackSize: '50kg bag',
    minReorderQuantity: 200,
    shelfLifeDays: 180,
    storageCondition: 'AMBIENT',
    isBarcodeTracked: false,
    gstRate: 5,
    notes: 'Sulfurless medium-grade crystal sugar for baking batters and sugar syrups.',
  },
  {
    sku: 'RAW-DAI-BUTTER',
    name: 'Amul Pasteurised Unsalted White Butter',
    category: 'RAW_INGREDIENTS',
    rawCategory: 'Dairy',
    branchCode: 'VAR',
    unit: 'kg',
    alertThreshold: 20,
    costPrice: 480,
    preferredVendor: 'Gujarat Cooperative Milk Marketing (Amul)',
    standardPackSize: '20kg carton (40x500g)',
    minReorderQuantity: 40,
    shelfLifeDays: 60,
    storageCondition: 'CHILLED',
    isBarcodeTracked: false,
    gstRate: 12,
    notes: '82% fat unsalted lactic butter for puff laminations and buttercream.',
  },
  {
    sku: 'RAW-DAI-MILK',
    name: 'Amul Gold Pasteurised Whole Milk',
    category: 'RAW_INGREDIENTS',
    rawCategory: 'Dairy',
    branchCode: 'VAR',
    unit: 'ltr',
    alertThreshold: 30,
    costPrice: 66,
    preferredVendor: 'Amul Dairy Booth',
    standardPackSize: '1L Pouch / 12L Crates',
    minReorderQuantity: 50,
    shelfLifeDays: 2,
    storageCondition: 'CHILLED',
    isBarcodeTracked: false,
    gstRate: 0,
    notes: '6.0% milk fat whole cow/buffalo milk delivered daily morning.',
  },
  {
    sku: 'RAW-CHO-DARK',
    name: '2M Dark Chocolate Compound 55%',
    category: 'RAW_INGREDIENTS',
    rawCategory: 'Chocolate',
    branchCode: 'VAR',
    unit: 'kg',
    alertThreshold: 25,
    costPrice: 240,
    preferredVendor: 'Puratos / 2M Cocoa Distributors',
    standardPackSize: '10kg case (20x500g slabs)',
    minReorderQuantity: 50,
    shelfLifeDays: 270,
    storageCondition: 'COOL_DRY',
    isBarcodeTracked: false,
    gstRate: 18,
    notes: 'Tempering-free hydrogenated vegetable fat dark chocolate slab.',
  },
  {
    sku: 'RAW-CHO-WHITE',
    name: '2M White Chocolate Compound',
    category: 'RAW_INGREDIENTS',
    rawCategory: 'Chocolate',
    branchCode: 'VAR',
    unit: 'kg',
    alertThreshold: 15,
    costPrice: 260,
    preferredVendor: 'Puratos / 2M Cocoa Distributors',
    standardPackSize: '10kg case',
    minReorderQuantity: 30,
    shelfLifeDays: 270,
    storageCondition: 'COOL_DRY',
    isBarcodeTracked: false,
    gstRate: 18,
    notes: 'Creamy white compound slabs for garnishes, plaques, and white forest cakes.',
  },

  // --------------------------------------------------------------------------
  // Category 6: Packaging & Accessories (6 items)
  // --------------------------------------------------------------------------
  {
    sku: 'PKG-BOX-500',
    name: '500g Square Cake Box with Window',
    category: 'PACKAGING',
    packagingCategory: 'Cake_Box',
    applicableSize: '500g',
    dimensions: '8x8x5 inch',
    material: '350 GSM Food-Grade FBB Board',
    piecesPerBundle: 50,
    branchCode: 'ALL',
    unit: 'boxes',
    alertThreshold: 150,
    costPrice: 14,
    shelfLifeDays: 365,
    storageCondition: 'AMBIENT',
    isBarcodeTracked: false,
    gstRate: 18,
    notes: 'Self-erecting premium cardboard box with transparent PVC view window.',
  },
  {
    sku: 'PKG-BOX-1K',
    name: '1kg Square Cake Box with Window',
    category: 'PACKAGING',
    packagingCategory: 'Cake_Box',
    applicableSize: '1kg',
    dimensions: '10x10x6 inch',
    material: '380 GSM Food-Grade FBB Board',
    piecesPerBundle: 50,
    branchCode: 'ALL',
    unit: 'boxes',
    alertThreshold: 100,
    costPrice: 22,
    shelfLifeDays: 365,
    storageCondition: 'AMBIENT',
    isBarcodeTracked: false,
    gstRate: 18,
    notes: 'Heavyweight folding box with reinforced handle for 1kg celebration cakes.',
  },
  {
    sku: 'PKG-BRD-8R',
    name: '8-inch Round Silver Metallic Cake Board (3mm)',
    category: 'PACKAGING',
    packagingCategory: 'Cake_Board',
    applicableSize: '500g',
    dimensions: '8 inch diameter',
    material: 'Laminated MDF Core',
    piecesPerBundle: 50,
    branchCode: 'ALL',
    unit: 'pcs',
    alertThreshold: 150,
    costPrice: 12,
    shelfLifeDays: 365,
    storageCondition: 'AMBIENT',
    isBarcodeTracked: false,
    gstRate: 18,
    notes: 'Greaseproof embossed silver foil base board for 500g cakes.',
  },
  {
    sku: 'PKG-BRD-10R',
    name: '10-inch Round Gold Metallic Cake Board (3.5mm)',
    category: 'PACKAGING',
    packagingCategory: 'Cake_Board',
    applicableSize: '1kg',
    dimensions: '10 inch diameter',
    material: 'Laminated MDF Core',
    piecesPerBundle: 50,
    branchCode: 'ALL',
    unit: 'pcs',
    alertThreshold: 100,
    costPrice: 18,
    shelfLifeDays: 365,
    storageCondition: 'AMBIENT',
    isBarcodeTracked: false,
    gstRate: 18,
    notes: 'Sturdy gold foil embossed cake drum for 1kg to 1.5kg cakes.',
  },
  {
    sku: 'PKG-RIB-GOLD',
    name: '1-inch Gold Satin Ribbon Roll (50m)',
    category: 'PACKAGING',
    packagingCategory: 'Ribbon',
    applicableSize: 'Universal',
    dimensions: '1 inch x 50 meters',
    piecesPerBundle: 10,
    branchCode: 'ALL',
    unit: 'rolls',
    alertThreshold: 10,
    costPrice: 95,
    shelfLifeDays: 730,
    storageCondition: 'AMBIENT',
    isBarcodeTracked: false,
    gstRate: 18,
    notes: 'Silky double-sided woven gold satin ribbon for box bow tying.',
  },
  {
    sku: 'PKG-KNIFE-SET',
    name: 'Biodegradable Wooden Cake Knife & 3-Candle Set',
    category: 'PACKAGING',
    packagingCategory: 'Knife_Candle',
    applicableSize: 'Universal',
    material: 'Birchwood Knife & Wax Candles',
    piecesPerBundle: 100,
    branchCode: 'ALL',
    unit: 'packets',
    alertThreshold: 200,
    costPrice: 8,
    shelfLifeDays: 730,
    storageCondition: 'AMBIENT',
    isBarcodeTracked: false,
    gstRate: 18,
    notes: 'Individually wrapped hygiene kit included with every cake purchase.',
  },
];

// ============================================================================
// 5. HELPER FUNCTIONS & PRISMA MAPPERS
// ============================================================================

/** Returns default seed catalog array */
export function getDefaultCatalogSeed(): CatalogItem[] {
  return [...SEED_CATALOG];
}

/** Filter items by specific bakery category */
export function getCatalogItemsByCategory(category: BakeryCategory): CatalogItem[] {
  return SEED_CATALOG.filter((item) => item.category === category);
}

/** Filter items by branch code */
export function getCatalogItemsByBranch(branchCode: BranchCode): CatalogItem[] {
  if (branchCode === 'ALL') return [...SEED_CATALOG];
  return SEED_CATALOG.filter(
    (item) => item.branchCode === branchCode || item.branchCode === 'ALL'
  );
}

/** Convert branch code to canonical Prisma Branch ID */
export function toCanonicalBranchId(code: BranchCode): string {
  switch (code) {
    case 'VAR': return 'varasiya';
    case 'UMA': return 'uma';
    case 'KHD': return 'khanderao';
    case 'ELL': return 'elora';
    default:    return 'varasiya';
  }
}

/** Convert canonical Prisma Branch ID to BranchCode */
export function fromCanonicalBranchId(branchId?: string | null): BranchCode {
  if (!branchId) return 'VAR';
  const normalized = branchId.toLowerCase().trim();
  switch (normalized) {
    case 'uma':
    case 'b_uma':
      return 'UMA';
    case 'khanderao':
    case 'khm':
    case 'b_khm':
    case 'khd':
      return 'KHD';
    case 'varasiya':
    case 'war':
    case 'b_var':
    case 'var':
      return 'VAR';
    case 'elora':
    case 'ellora':
    case 'elr':
    case 'b_ell':
    case 'ell':
      return 'ELL';
    default:
      return 'VAR';
  }
}

/** Prisma transformation for InventoryBatch (Finished Goods & Hot Bakes) */
export function toPrismaInventoryBatchInput(
  item: FinishedGoodItem | HotBakeItem,
  branchId: string,
  openingQty?: number
) {
  const resolvedQty = openingQty !== undefined
    ? openingQty
    : (item.category === 'HOT_BAKES' ? (item as HotBakeItem).defaultBatchQty : 0);

  return {
    branchId,
    category: (item.category === 'FINISHED_GOODS' ? 'FRESH_BAKES' : 'HOT_BAKES') as any,
    title: item.name,
    isBarcodeTracked: item.isBarcodeTracked,
    openingQty: resolvedQty,
    isClosed: false,
    notes: item.notes,
  };
}

/** Prisma transformation for individual barcode-tracked InventoryUnit */
export function toPrismaInventoryUnitInput(
  item: FinishedGoodItem,
  batchId: string,
  branchId: string,
  barcode: string
) {
  return {
    barcode,
    batchId,
    branchId,
    itemTitle: item.name,
    category: (item.prismaCategory || 'FRESH_BAKES') as any,
    variantWeight: item.variantWeight,
    flavor: item.flavor,
    sellingPrice: item.sellingPrice,
    status: 'IN_STOCK' as any,
  };
}

/** Prisma transformation for BrownieTray */
export function toPrismaBrownieTrayInput(
  item: BrownieTrayItem,
  branchId: string,
  trayCode: string
) {
  return {
    trayCode,
    title: item.name,
    flavor: item.flavor,
    branchId,
    totalPieces: item.totalPieces,
    soldPieces: 0,
    piecePrice: item.piecePrice,
    status: 'CUT_INTO_PIECES',
  };
}

/** Prisma transformation for PrepStock */
export function toPrismaPrepStockInput(
  item: PrepStockItem,
  branchId: string,
  currentStock = 0
) {
  return {
    name: item.name,
    category: item.prepCategory,
    flavor: item.flavor,
    currentStock,
    unit: item.unit,
    minAlertLevel: item.alertThreshold,
    costPerUnit: item.costPerUnit,
    branchId,
    notes: item.notes,
  };
}

/** Prisma transformation for RawIngredient & Packaging */
export function toPrismaRawIngredientInput(
  item: RawIngredientItem | PackagingItem,
  branchId: string,
  currentStock = 0
) {
  return {
    name: item.name,
    category: item.category === 'RAW_INGREDIENTS'
      ? (item as RawIngredientItem).rawCategory
      : 'Packaging',
    currentStock,
    unit: item.unit,
    minAlertLevel: item.alertThreshold,
    costPerUnit: item.costPrice,
    branchId,
    notes: item.notes,
  };
}
