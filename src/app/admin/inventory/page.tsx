"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import JsBarcode from "jsbarcode";
import { useSession } from "next-auth/react";
import { 
  ScanBarcode, 
  AddCircle, 
  Printer, 
  Box, 
  Trash, 
  Shop, 
  SearchNormal1,
  Flash,
  Clock,
  CloseSquare,
  TickCircle,
  Warning2,
  Layer,
  Edit2,
  DirectInbox,
  Coffee,
  Category,
  Calendar,
  Danger,
  ArchiveBook,
  TrendUp
} from "iconsax-react";

interface InventoryBatch {
  id: string;
  category: "FRESH_BAKES" | "HOT_BAKES" | "BOUQUETS" | "SIGNATURE_ADDONS";
  title: string;
  batchDate: string;
  bestBeforeDate?: string | null;
  openingQty: number;
  soldQty: number;
  damagedQty: number;
  closingQty: number;
  isBarcodeTracked?: boolean;
  notes?: string | null;
  branch: { id: string; name: string; code: string };
  units: InventoryUnit[];
}

interface InventoryUnit {
  id: string;
  barcode: string;
  itemTitle: string;
  category: string;
  variantWeight: string;
  flavor: string | null;
  sellingPrice: number;
  soldPrice?: number | null;
  soldOrderId?: string | null;
  status: "IN_STOCK" | "SOLD" | "DAMAGED" | "EXPIRED";
  bestBeforeDate?: string | null;
  soldAt: string | null;
  damagedAt?: string | null;
  damageReason?: string | null;
  createdAt: string;
}

interface PrepStockItem {
  id: string;
  name: string;
  category: "SPONGE" | "CREAM" | "FILLING" | "BASE" | "SYRUP";
  flavor: string | null;
  currentStock: number;
  unit: string;
  minAlertLevel: number;
  costPerUnit: number;
  bestBeforeDate?: string | null;
  branch?: { id: string; name: string; code: string } | null;
}

interface BrownieTrayItem {
  id: string;
  trayCode: string;
  title: string;
  flavor: string | null;
  branchId: string;
  status: "UNOPENED" | "CUT_INTO_PIECES" | "COMPLETED";
  totalPieces: number;
  soldPieces: number;
  piecePrice: number;
  cutBy: string | null;
  cutAt: string | null;
  bestBeforeDate?: string | null;
  branch: { id: string; name: string; code: string };
}

interface RawIngredient {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minAlertLevel: number;
  costPerUnit: number;
  bestBeforeDate?: string | null;
  branch?: { id: string; name: string; code: string } | null;
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isSales = role === "SALESPERSON";
  const userBranchId = (session?.user as any)?.branchId;

  // Granular Permission Evaluation (Customizable by Rishi Bhai in User Management)
  const customPerms: Record<string, boolean> = React.useMemo(() => {
    try {
      const raw = (session?.user as any)?.customPermissions;
      if (typeof raw === "string") return JSON.parse(raw);
      if (typeof raw === "object" && raw !== null) return raw;
    } catch {}
    return {};
  }, [session]);

  const hasPerm = (permKey: string, defaultRoles: string[] = ["ADMIN"]) => {
    if (isAdmin) return true;
    if (customPerms[permKey] !== undefined) return Boolean(customPerms[permKey]);
    // Master switch fallback for core operational features
    if (customPerms["inventory_management"] === true && [
      "inv_view", "inv_inward", "inv_hot_bakes", "inv_brownie_trays",
      "inv_spoilage_damage", "inv_eod_closing"
    ].includes(permKey)) {
      return true;
    }
    return defaultRoles.includes(role || "");
  };

  const canViewFinished = hasPerm("inv_view", ["ADMIN", "MANAGER", "CHEF"]);
  const canInward = hasPerm("inv_inward", ["ADMIN", "MANAGER", "CHEF"]);
  const canHotBakes = hasPerm("inv_hot_bakes", ["ADMIN", "MANAGER", "CHEF"]);
  const canBrownies = hasPerm("inv_brownie_trays", ["ADMIN", "MANAGER", "CHEF"]);
  const canPrep = hasPerm("inv_kitchen_prep", ["ADMIN", "CHEF", "MANAGER"]);
  const canRaw = hasPerm("inv_raw_ingredients", ["ADMIN", "CHEF", "MANAGER"]);
  const canEod = hasPerm("inv_eod_closing", ["ADMIN", "MANAGER"]);
  const canReportDamage = hasPerm("inv_spoilage_damage", ["ADMIN", "MANAGER", "CHEF"]);
  const canEditDelete = hasPerm("inv_edit_delete", ["ADMIN"]);
  const canDeadStock = hasPerm("inv_dead_stock", ["ADMIN", "MANAGER"]);
  const canFinancials = hasPerm("inv_financials", ["ADMIN"]);
  const canCaReport = hasPerm("inv_ca_monthly_report", ["ADMIN"]);

  const [activeTab, setActiveTab] = useState<"FINISHED_GOODS" | "HOT_BAKES" | "BROWNIE_TRAYS" | "PREP_STOCKS" | "RAW_INGREDIENTS">("FINISHED_GOODS");
  
  // Day-wise filter states
  const [dateFilter, setDateFilter] = useState<"TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "DEAD_STOCK" | "ALL" | "CUSTOM">("TODAY");
  const [customDate, setCustomDate] = useState<string>("");
  const [showExpiredOnly, setShowExpiredOnly] = useState<boolean>(false);

  // Finished Goods & Hot Bakes Batches
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [stats, setStats] = useState({ 
    totalInStock: 0, 
    todayStock: 0, 
    totalSoldToday: 0, 
    totalExpired: 0, 
    totalDamaged: 0,
    totalWastageLoss: 0,
    totalDeadStock: 0,
    deadStockLockedCapital: 0
  });

  // Daily Stock Movement Register
  const [dailyMovement, setDailyMovement] = useState<{
    openingStock: number;
    inwardToday: number;
    soldToday: number;
    damagedToday: number;
    closingStock: number;
  } | null>(null);

  // Admin Role Only: Revenue & Discount Realization Metrics
  const [revenueStats, setRevenueStats] = useState<{
    totalRevenue: number;
    totalDiscountGiven: number;
    totalOriginalValue: number;
    realizationRate: number;
    soldUnitsCount: number;
  } | null>(null);

  // Feature 4: Wastage & Spoilage Breakdown Analytics
  const [wastageBreakdown, setWastageBreakdown] = useState<{
    reason: string;
    count: number;
    lossAmount: number;
    percentage: number;
  }[]>([]);
  const [showWastageModal, setShowWastageModal] = useState<boolean>(false);

  // Quick Mark Damaged / Spoilage Modal
  const [damageTarget, setDamageTarget] = useState<InventoryUnit | null>(null);
  const [selectedDamageReason, setSelectedDamageReason] = useState<string>("Melting / Temperature issue");
  const [customDamageNote, setCustomDamageNote] = useState<string>("");

  // Feature 1: End-of-Day Store Closing Wizard
  const [showEODWizard, setShowEODWizard] = useState<boolean>(false);
  const [eodStep, setEodStep] = useState<1 | 2 | 3>(1);
  const [eodDispositions, setEodDispositions] = useState<Record<string, { action: 'DISCARD' | 'STAFF_MEAL' | 'ROLLOVER', reason: string }>>({});
  const [eodPhysicalCash, setEodPhysicalCash] = useState<number>(0);
  const [eodClosingNotes, setEodClosingNotes] = useState<string>("");
  const [eodSubmitting, setEodSubmitting] = useState<boolean>(false);
  const [eodSuccessSummary, setEodSuccessSummary] = useState<any | null>(null);

  // Monthly CA Tax & Audit Report Modal
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState<boolean>(false);
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [monthlyReportData, setMonthlyReportData] = useState<any | null>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  
  // Prep Stocks (Sponges & Creams)
  const [prepItems, setPrepItems] = useState<PrepStockItem[]>([]);
  const [prepStats, setPrepStats] = useState({ totalItemsCount: 0, totalSpongesCount: 0, totalCreamsKg: 0, lowStockAlerts: 0 });
  const [selectedPrepCategory, setSelectedPrepCategory] = useState<string>("ALL");

  // Brownie Trays
  const [brownieTrays, setBrownieTrays] = useState<BrownieTrayItem[]>([]);
  const [brownieStats, setBrownieStats] = useState({ activeTraysCount: 0, totalPiecesAvailable: 0, totalPiecesSold: 0, totalTraysRecorded: 0 });

  // Raw Ingredients
  const [rawIngredients, setRawIngredients] = useState<RawIngredient[]>([]);
  const [rawStats, setRawStats] = useState({ totalItemsCount: 0, totalStockKg: 0, lowStockAlerts: 0 });

  // Branch & Filter Controls
  const [branches, setBranches] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Best before date calculation helpers
  const getFutureDateStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  // 1. Finished Goods Inward Modal (Barcodes)
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [inwardBranch, setInwardBranch] = useState("");
  const [inwardCategory, setInwardCategory] = useState<"FRESH_BAKES" | "BOUQUETS" | "SIGNATURE_ADDONS">("FRESH_BAKES");
  const [itemTitle, setItemTitle] = useState("");
  const [flavor, setFlavor] = useState("");
  const [weight, setWeight] = useState("500g");
  const [sellingPrice, setSellingPrice] = useState(450);
  const [quantity, setQuantity] = useState(10);
  const [cakeShelfLifeDays, setCakeShelfLifeDays] = useState<number>(2);
  const [cakeBestBefore, setCakeBestBefore] = useState<string>(getFutureDateStr(2));

  // 2. Hot Bakes Inward Modal (Puffs - Quantity Only, No Barcode)
  const [showHotBakesModal, setShowHotBakesModal] = useState(false);
  const [hotBakeName, setHotBakeName] = useState("Veg Puff");
  const [hotBakeQty, setHotBakeQty] = useState(50);
  const [hotBakePrice, setHotBakePrice] = useState(30);
  const [hotBakeShelfLifeDays, setHotBakeShelfLifeDays] = useState<number>(1);
  const [hotBakeBestBefore, setHotBakeBestBefore] = useState<string>(getFutureDateStr(1));

  // 3. Brownie Tray Inward Modal
  const [showBrownieModal, setShowBrownieModal] = useState(false);
  const [brownieTitle, setBrownieTitle] = useState("Walnut Dark Choco Brownie Tray");
  const [brownieFlavor, setBrownieFlavor] = useState("Walnut Dark Choco");
  const [browniePieces, setBrowniePieces] = useState(50);
  const [browniePrice, setBrowniePrice] = useState(80);
  const [brownieCutBy, setBrownieCutBy] = useState("Chef Santosh");
  const [brownieShelfLifeDays, setBrownieShelfLifeDays] = useState<number>(4);
  const [brownieBestBefore, setBrownieBestBefore] = useState<string>(getFutureDateStr(4));

  // 4. Prep Stock Modal (Sponges & Creams)
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [prepName, setPrepName] = useState("");
  const [prepCat, setPrepCat] = useState<"SPONGE" | "CREAM" | "FILLING" | "SYRUP">("SPONGE");
  const [prepFlavor, setPrepFlavor] = useState("");
  const [prepStock, setPrepStock] = useState(25);
  const [prepUnit, setPrepUnit] = useState("pcs");
  const [prepMinAlert, setPrepMinAlert] = useState(8);
  const [prepShelfLifeDays, setPrepShelfLifeDays] = useState<number>(3);
  const [prepBestBefore, setPrepBestBefore] = useState<string>(getFutureDateStr(3));

  // 5. Raw Ingredient Modal
  const [showRawModal, setShowRawModal] = useState(false);
  const [rawBranch, setRawBranch] = useState("ALL");
  const [rawName, setRawName] = useState("");
  const [rawCategory, setRawCategory] = useState("Dairy");
  const [rawStockVal, setRawStockVal] = useState(50);
  const [rawUnitVal, setRawUnitVal] = useState("kg");
  const [rawMinAlertVal, setRawMinAlertVal] = useState(15);
  const [rawCostVal, setRawCostVal] = useState(100);
  const [rawBestBefore, setRawBestBefore] = useState<string>(getFutureDateStr(30));

  // 6. Universal Edit / Modify Modal State
  const [editTarget, setEditTarget] = useState<{
    type: "BATCH" | "UNIT" | "BROWNIE" | "PREP" | "RAW";
    id: string;
    title: string;
    price?: number;
    qty?: number;
    weight?: string;
    flavor?: string;
    status?: string;
    bestBeforeDate?: string | null;
    notes?: string;
    unit?: string;
    category?: string;
  } | null>(null);

  // Thermal Barcode Print Preview Modal
  const [printUnits, setPrintUnits] = useState<InventoryUnit[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Robust JSON response parser that never throws on HTML error pages
  const safeResJson = async (res: Response) => {
    try {
      const text = await res.text();
      return JSON.parse(text);
    } catch {
      return { success: false, error: `Server response error (${res.status})` };
    }
  };

  // Helper to check expiry
  const isItemExpired = (bestBeforeDate?: string | null, status?: string) => {
    if (status === "EXPIRED") return true;
    if (!bestBeforeDate) return false;
    return new Date(bestBeforeDate) < new Date();
  };

  const formatDateShort = (dateStr?: string | null) => {
    if (!dateStr) return "No Expiry";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  // Fetch all inventory streams in parallel with day-wise filtering
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const urlInv = new URL("/api/v1/admin/inventory", window.location.origin);
      if (selectedBranch !== "ALL") urlInv.searchParams.set("branchId", selectedBranch);
      if (dateFilter !== "ALL") urlInv.searchParams.set("dateFilter", dateFilter);
      if (dateFilter === "CUSTOM" && customDate) urlInv.searchParams.set("date", customDate);

      const urlRaw = new URL("/api/v1/admin/inventory/raw", window.location.origin);
      if (selectedBranch !== "ALL") urlRaw.searchParams.set("branchId", selectedBranch);

      const urlPrep = new URL("/api/v1/admin/inventory/prep", window.location.origin);
      if (selectedBranch !== "ALL") urlPrep.searchParams.set("branchId", selectedBranch);

      const urlBrownies = new URL("/api/v1/admin/inventory/brownies", window.location.origin);
      if (selectedBranch !== "ALL") urlBrownies.searchParams.set("branchId", selectedBranch);
      if (dateFilter !== "ALL") urlBrownies.searchParams.set("dateFilter", dateFilter);

      const [resInv, resRaw, resPrep, resBrownies] = await Promise.all([
        fetch(urlInv.toString()),
        fetch(urlRaw.toString()),
        fetch(urlPrep.toString()),
        fetch(urlBrownies.toString())
      ]);

      const [dataInv, dataRaw, dataPrep, dataBrownies] = await Promise.all([
        safeResJson(resInv),
        safeResJson(resRaw),
        safeResJson(resPrep),
        safeResJson(resBrownies)
      ]);

      if (dataInv?.success) {
        setBatches(dataInv.batches || []);
        setStats(dataInv.stats || { 
          totalInStock: 0, 
          todayStock: 0, 
          totalSoldToday: 0, 
          totalExpired: 0, 
          totalDamaged: 0, 
          totalWastageLoss: 0,
          totalDeadStock: 0,
          deadStockLockedCapital: 0
        });
        setDailyMovement(dataInv.dailyMovementRegister || null);
        setWastageBreakdown(dataInv.wastageBreakdown || []);
        if (dataInv.revenueStats) {
          setRevenueStats(dataInv.revenueStats);
        } else {
          setRevenueStats(null);
        }
        setBranches(dataInv.branches || []);
        if (!inwardBranch && dataInv.branches?.length > 0) {
          setInwardBranch(dataInv.branches[0].id);
        }
      }

      if (dataRaw?.success) {
        setRawIngredients(dataRaw.ingredients || []);
        setRawStats(dataRaw.stats || { totalItemsCount: 0, totalStockKg: 0, lowStockAlerts: 0 });
      }

      if (dataPrep?.success) {
        setPrepItems(dataPrep.items || []);
        setPrepStats(dataPrep.stats || { totalItemsCount: 0, totalSpongesCount: 0, totalCreamsKg: 0, lowStockAlerts: 0 });
      }

      if (dataBrownies?.success) {
        setBrownieTrays(dataBrownies.trays || []);
        setBrownieStats(dataBrownies.stats || { activeTraysCount: 0, totalPiecesAvailable: 0, totalPiecesSold: 0, totalTraysRecorded: 0 });
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  // If salesperson, lock branch to assigned branch
  useEffect(() => {
    if (isSales && userBranchId && selectedBranch !== userBranchId) {
      setSelectedBranch(userBranchId);
      setInwardBranch(userBranchId);
      setRawBranch(userBranchId);
    }
  }, [isSales, userBranchId, selectedBranch]);

  // Auto-switch to first permitted tab if current activeTab is restricted by Rishi Bhai
  useEffect(() => {
    if (activeTab === "FINISHED_GOODS" && !canViewFinished) {
      if (canHotBakes) setActiveTab("HOT_BAKES");
      else if (canBrownies) setActiveTab("BROWNIE_TRAYS");
      else if (canPrep) setActiveTab("PREP_STOCKS");
      else if (canRaw) setActiveTab("RAW_INGREDIENTS");
    } else if (activeTab === "HOT_BAKES" && !canHotBakes) {
      if (canViewFinished) setActiveTab("FINISHED_GOODS");
      else if (canBrownies) setActiveTab("BROWNIE_TRAYS");
      else if (canPrep) setActiveTab("PREP_STOCKS");
      else if (canRaw) setActiveTab("RAW_INGREDIENTS");
    } else if (activeTab === "BROWNIE_TRAYS" && !canBrownies) {
      if (canViewFinished) setActiveTab("FINISHED_GOODS");
      else if (canHotBakes) setActiveTab("HOT_BAKES");
      else if (canPrep) setActiveTab("PREP_STOCKS");
      else if (canRaw) setActiveTab("RAW_INGREDIENTS");
    } else if (activeTab === "PREP_STOCKS" && !canPrep) {
      if (canViewFinished) setActiveTab("FINISHED_GOODS");
      else if (canHotBakes) setActiveTab("HOT_BAKES");
      else if (canBrownies) setActiveTab("BROWNIE_TRAYS");
      else if (canRaw) setActiveTab("RAW_INGREDIENTS");
    } else if (activeTab === "RAW_INGREDIENTS" && !canRaw) {
      if (canViewFinished) setActiveTab("FINISHED_GOODS");
      else if (canHotBakes) setActiveTab("HOT_BAKES");
      else if (canBrownies) setActiveTab("BROWNIE_TRAYS");
      else if (canPrep) setActiveTab("PREP_STOCKS");
    }
  }, [activeTab, canViewFinished, canHotBakes, canBrownies, canPrep, canRaw]);

  // Global Escape key handler to quickly close any active modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEODWizard(false);
        setShowMonthlyReportModal(false);
        setShowInwardModal(false);
        setShowHotBakesModal(false);
        setShowBrownieModal(false);
        setShowPrepModal(false);
        setShowRawModal(false);
        setShowWastageModal(false);
        setDamageTarget(null);
        setEditTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    fetchInventory();
    if (selectedBranch !== "ALL") {
      setInwardBranch(selectedBranch);
      setRawBranch(selectedBranch);
    }
  }, [selectedBranch, dateFilter, customDate]);

  // Synchronize modal defaults with selected filter
  const handleOpenInward = () => {
    if (isSales && userBranchId) setInwardBranch(userBranchId);
    else if (selectedBranch !== "ALL") setInwardBranch(selectedBranch);
    else if (branches.length > 0 && !inwardBranch) setInwardBranch(branches[0].id);
    setShowInwardModal(true);
  };

  const handleOpenHotBakes = () => {
    if (isSales && userBranchId) setInwardBranch(userBranchId);
    else if (selectedBranch !== "ALL") setInwardBranch(selectedBranch);
    else if (branches.length > 0 && !inwardBranch) setInwardBranch(branches[0].id);
    setShowHotBakesModal(true);
  };

  const handleOpenBrownie = () => {
    if (isSales && userBranchId) setInwardBranch(userBranchId);
    else if (selectedBranch !== "ALL") setInwardBranch(selectedBranch);
    else if (branches.length > 0 && !inwardBranch) setInwardBranch(branches[0].id);
    setShowBrownieModal(true);
  };

  const handleOpenPrep = () => {
    if (isSales && userBranchId) setInwardBranch(userBranchId);
    else if (selectedBranch !== "ALL") setInwardBranch(selectedBranch);
    setShowPrepModal(true);
  };

  const handleOpenRaw = () => {
    if (isSales && userBranchId) setRawBranch(userBranchId);
    else if (selectedBranch !== "ALL") setRawBranch(selectedBranch);
    else setRawBranch("ALL");
    setShowRawModal(true);
  };

  // 1. Submit Morning Inward (Finished Cakes with Barcodes & Best Before)
  const handleCreateInward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle || quantity <= 0) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/v1/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: inwardBranch,
          category: inwardCategory,
          title: `${itemTitle} Batch (${quantity} units)`,
          bestBeforeDate: cakeBestBefore,
          items: [
            {
              itemTitle,
              flavor: inwardCategory === "FRESH_BAKES" ? flavor : undefined,
              variantWeight: inwardCategory === "FRESH_BAKES" ? weight : "1 Unit",
              sellingPrice,
              bestBeforeDate: cakeBestBefore,
              quantity
            }
          ]
        })
      });

      const data = await safeResJson(res);
      if (data.success && data.batch?.units) {
        setShowInwardModal(false);
        setItemTitle("");
        setFlavor("");
        setQuantity(10);
        await fetchInventory();
        setPrintUnits(data.batch.units);
      } else {
        alert(data.error || "Failed to create batch");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit morning inward batch");
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Submit Hot Bakes Morning Inward (Puffs - Quantity Only, No Barcodes)
  const handleCreateHotBake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotBakeName || hotBakeQty <= 0) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/v1/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: inwardBranch,
          category: "HOT_BAKES",
          title: `${hotBakeName} Morning Batch (${hotBakeQty} pcs)`,
          isBarcodeTracked: false,
          openingQty: hotBakeQty,
          closingQty: hotBakeQty,
          bestBeforeDate: hotBakeBestBefore,
          items: []
        })
      });

      const data = await safeResJson(res);
      if (data.success) {
        setShowHotBakesModal(false);
        await fetchInventory();
        alert(`✓ Inwarded ${hotBakeQty} ${hotBakeName} for counter sales.`);
      } else {
        alert(data.error || "Failed to inward puffs");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to inward hot bakes");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Submit Brownie Tray Inward
  const handleCreateBrownieTray = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/v1/admin/inventory/brownies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INWARD_TRAY",
          branchId: inwardBranch,
          title: brownieTitle,
          flavor: brownieFlavor,
          initialPieces: browniePieces,
          piecePrice: browniePrice,
          cutNow: true,
          cutBy: brownieCutBy,
          bestBeforeDate: brownieBestBefore
        })
      });

      const data = await safeResJson(res);
      if (data.success) {
        setShowBrownieModal(false);
        await fetchInventory();
        alert(`✓ Brownie Tray inwarded: ${browniePieces} cut pieces ready for sale.`);
      } else {
        alert(data.error || "Failed to inward tray");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Sell 1 Brownie Piece
  const handleSellBrowniePiece = async (trayId: string) => {
    try {
      const res = await fetch("/api/v1/admin/inventory/brownies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SELL_PIECE",
          trayId,
          quantity: 1
        })
      });
      const data = await safeResJson(res);
      if (data.success) {
        fetchInventory();
      } else {
        alert(data.error || "Failed to sell brownie piece");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Submit Prep Stock Item (Sponge Base / Creams)
  const handleSavePrepItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prepName.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/v1/admin/inventory/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prepName.trim(),
          category: prepCat,
          flavor: prepFlavor,
          currentStock: prepStock,
          unit: prepUnit,
          minAlertLevel: prepMinAlert,
          branchId: inwardBranch !== "ALL" ? inwardBranch : null,
          bestBeforeDate: prepBestBefore
        })
      });

      const data = await safeResJson(res);
      if (data.success) {
        setShowPrepModal(false);
        setPrepName("");
        await fetchInventory();
      } else {
        alert(data.error || "Failed to save prep stock");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Chef Quick Deduct Sponges / Creams (-1, -5, +10)
  const handleChefLogDeduct = async (id: string, adjustmentQty: number, operation: "ADD" | "SUBTRACT") => {
    try {
      const res = await fetch("/api/v1/admin/inventory/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHEF_LOG",
          id,
          adjustmentQty,
          operation
        })
      });
      const data = await safeResJson(res);
      if (data.success) {
        fetchInventory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Submit Raw Ingredient
  const handleSaveRawIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawName.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/v1/admin/inventory/raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rawName.trim(),
          category: rawCategory,
          currentStock: rawStockVal,
          unit: rawUnitVal,
          minAlertLevel: rawMinAlertVal,
          costPerUnit: rawCostVal,
          branchId: rawBranch !== "ALL" ? rawBranch : null,
          bestBeforeDate: rawBestBefore
        })
      });

      const data = await safeResJson(res);
      if (data.success) {
        setShowRawModal(false);
        setRawName("");
        await fetchInventory();
      } else {
        alert(data.error || "Failed to save ingredient");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Adjust Raw Stock (+ / -)
  const handleQuickAdjustRaw = async (id: string, adjustmentQty: number, operation: "ADD" | "SUBTRACT") => {
    try {
      const res = await fetch("/api/v1/admin/inventory/raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADJUST_STOCK",
          id,
          adjustmentQty,
          operation
        })
      });
      const data = await safeResJson(res);
      if (data.success) {
        fetchInventory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Universal Edit / Modify Submit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditDelete) {
      alert("Forbidden: You do not have permission to modify inventory items. Contact Rishi Bhai (Store Admin).");
      return;
    }
    if (!editTarget) return;

    try {
      setSubmitting(true);
      if (editTarget.type === "BATCH") {
        const res = await fetch("/api/v1/admin/inventory", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchId: editTarget.id,
            title: editTarget.title,
            closingQty: editTarget.qty,
            bestBeforeDate: editTarget.bestBeforeDate || null,
            notes: editTarget.notes
          })
        });
        const data = await safeResJson(res);
        if (data.success) {
          setEditTarget(null);
          await fetchInventory();
        } else {
          alert(data.error || "Failed to update batch");
        }
      } else if (editTarget.type === "UNIT") {
        const res = await fetch("/api/v1/admin/inventory", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitId: editTarget.id,
            itemTitle: editTarget.title,
            flavor: editTarget.flavor,
            variantWeight: editTarget.weight,
            sellingPrice: editTarget.price,
            status: editTarget.status,
            bestBeforeDate: editTarget.bestBeforeDate || null
          })
        });
        const data = await safeResJson(res);
        if (data.success) {
          setEditTarget(null);
          await fetchInventory();
        } else {
          alert(data.error || "Failed to update item");
        }
      } else if (editTarget.type === "BROWNIE") {
        const res = await fetch("/api/v1/admin/inventory/brownies", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editTarget.id,
            title: editTarget.title,
            flavor: editTarget.flavor,
            totalPieces: editTarget.qty,
            piecePrice: editTarget.price,
            status: editTarget.status,
            bestBeforeDate: editTarget.bestBeforeDate || null
          })
        });
        const data = await safeResJson(res);
        if (data.success) {
          setEditTarget(null);
          await fetchInventory();
        } else {
          alert(data.error || "Failed to update brownie tray");
        }
      } else if (editTarget.type === "PREP") {
        const res = await fetch("/api/v1/admin/inventory/prep", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editTarget.id,
            name: editTarget.title,
            currentStock: editTarget.qty,
            flavor: editTarget.flavor,
            unit: editTarget.unit,
            bestBeforeDate: editTarget.bestBeforeDate || null
          })
        });
        const data = await safeResJson(res);
        if (data.success) {
          setEditTarget(null);
          await fetchInventory();
        } else {
          alert(data.error || "Failed to update prep item");
        }
      } else if (editTarget.type === "RAW") {
        const res = await fetch("/api/v1/admin/inventory/raw", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editTarget.id,
            name: editTarget.title,
            currentStock: editTarget.qty,
            unit: editTarget.unit,
            costPerUnit: editTarget.price,
            bestBeforeDate: editTarget.bestBeforeDate || null
          })
        });
        const data = await safeResJson(res);
        if (data.success) {
          setEditTarget(null);
          await fetchInventory();
        } else {
          alert(data.error || "Failed to update raw ingredient");
        }
      }
    } catch (err: any) {
      alert("Failed to save changes: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Universal Delete handler with confirmation
  const handleDeleteItem = async (type: "BATCH" | "UNIT" | "BROWNIE" | "PREP" | "RAW", id: string, name: string) => {
    if (!canEditDelete) {
      alert("Forbidden: You do not have permission to delete inventory items. Contact Rishi Bhai (Store Admin).");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${name}" from inventory? This cannot be undone.`)) return;

    try {
      let url = "";
      if (type === "BATCH") url = `/api/v1/admin/inventory?batchId=${id}`;
      else if (type === "UNIT") url = `/api/v1/admin/inventory?unitId=${id}`;
      else if (type === "BROWNIE") url = `/api/v1/admin/inventory/brownies?id=${id}`;
      else if (type === "PREP") url = `/api/v1/admin/inventory/prep?id=${id}`;
      else if (type === "RAW") url = `/api/v1/admin/inventory/raw?id=${id}`;

      const res = await fetch(url, { method: "DELETE" });
      const data = await safeResJson(res);
      if (data.success) {
        await fetchInventory();
      } else {
        alert(data.error || "Failed to delete item");
      }
    } catch (err: any) {
      alert("Error deleting item: " + err.message);
    }
  };

  // Feature 4: Quick Mark Item as Damaged / Spoilage with Reason Tag
  const handleMarkDamaged = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReportDamage) {
      alert("Forbidden: You do not have permission to report damaged items. Contact Rishi Bhai (Store Admin).");
      return;
    }
    if (!damageTarget) return;

    try {
      setSubmitting(true);
      const finalReason = selectedDamageReason === "Other" 
        ? (customDamageNote || "Unspecified damage") 
        : selectedDamageReason;

      const res = await fetch("/api/v1/admin/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: damageTarget.id,
          status: "DAMAGED",
          damageReason: finalReason
        })
      });
      const data = await safeResJson(res);
      if (data.success) {
        setDamageTarget(null);
        await fetchInventory();
      } else {
        alert(data.error || "Failed to mark item as damaged");
      }
    } catch (err: any) {
      alert("Error marking damage: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Feature 1: Submit End-of-Day Store Closing & Reconciliation
  const handleCloseEOD = async () => {
    try {
      setEodSubmitting(true);
      const targetBranch = selectedBranch !== "ALL" ? selectedBranch : (branches[0]?.id || "uma");
      
      const dispositionsArray = Object.entries(eodDispositions).map(([batchId, info]) => ({
        batchId,
        remainingQty: batches.find(b => b.id === batchId)?.closingQty || 0,
        action: info.action,
        reason: info.reason
      }));

      const res = await fetch("/api/v1/admin/inventory/eod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: targetBranch,
          dispositions: dispositionsArray,
          cashReconciliation: {
            systemCash: stats.totalSoldToday * 450,
            physicalCash: Number(eodPhysicalCash) || 0,
          },
          closingNotes: eodClosingNotes
        })
      });

      const data = await safeResJson(res);
      if (data.success) {
        setEodSuccessSummary(data.summary);
        await fetchInventory();
      } else {
        alert(data.error || "Failed to execute EOD store closing");
      }
    } catch (err: any) {
      alert("Error during EOD store closing: " + err.message);
    } finally {
      setEodSubmitting(false);
    }
  };

  // Fetch Monthly Report for CA
  const fetchMonthlyReport = async (m = reportMonth, y = reportYear) => {
    try {
      setReportLoading(true);
      const url = new URL("/api/v1/admin/inventory/monthly-report", window.location.origin);
      url.searchParams.set("month", m.toString());
      url.searchParams.set("year", y.toString());
      if (selectedBranch !== "ALL") url.searchParams.set("branchId", selectedBranch);

      const res = await fetch(url.toString());
      const data = await safeResJson(res);
      if (data?.success) {
        setMonthlyReportData(data);
      } else {
        alert(data?.error || "Failed to load monthly CA report");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error fetching monthly report: " + err.message);
    } finally {
      setReportLoading(false);
    }
  };

  // Download CSV for CA / Tally / Marg ERP
  const handleDownloadReportCsv = () => {
    if (!monthlyReportData) return;
    const r = monthlyReportData;
    const csvRows = [
      ["GOPAL CAKE SHOP - MONTHLY FINANCIAL AUDIT STATEMENT"],
      ["GSTIN", r.company.gstin],
      ["Period", `${r.period.monthName} ${r.period.year}`],
      ["Branch", r.period.branch?.name || "All Branches"],
      ["Generated Date", new Date(r.generatedAt).toLocaleString("en-IN")],
      [],
      ["SECTION 1: TURNOVER & TAXABLE SALES"],
      ["Metric", "Amount (INR)"],
      ["Gross Sales (MRP)", r.salesTurnover.grossSales.toFixed(2)],
      ["Discounts Conceded", `-${r.salesTurnover.discountsConceded.toFixed(2)}`],
      ["Net Invoiced Sales", r.salesTurnover.totalNetInvoiced.toFixed(2)],
      ["Estimated GST (5%)", r.salesTurnover.estimatedGstAmount.toFixed(2)],
      ["CGST (2.5%)", r.salesTurnover.cgstAmount.toFixed(2)],
      ["SGST (2.5%)", r.salesTurnover.sgstAmount.toFixed(2)],
      ["Net Taxable Turnover", r.salesTurnover.netTaxableSales.toFixed(2)],
      [],
      ["SECTION 2: STOCK INWARD (CENTRAL KITCHEN)"],
      ["Total Batches Received", r.stockInward.totalBatches],
      ["Total Units Received", r.stockInward.totalUnitsReceived],
      ["Inward Valuation (INR)", r.stockInward.inwardAssetValuation.toFixed(2)],
      [],
      ["SECTION 3: WASTAGE & SPOILAGE WRITE-OFFS (SEC 17(5)(h))"],
      ["Total Units Written Off", r.spoilageWriteOff.totalUnitsWrittenOff],
      ["Total Loss Amount (INR)", r.spoilageWriteOff.totalLossAmount.toFixed(2)],
      ...r.spoilageWriteOff.reasonBreakdown.map((rb: any) => [`Reason: ${rb.reason}`, `${rb.count} pcs`, `INR ${rb.lossAmount.toFixed(2)}`]),
      [],
      ["SECTION 4: MONTH-END INVENTORY VALUATION (BALANCE SHEET ASSET)"],
      ["Closing Units in Stock", r.monthEndInventoryValuation.activeUnitsCount],
      ["Closing Asset Valuation (INR)", r.monthEndInventoryValuation.inventoryAssetValuation.toFixed(2)]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CA-Audit-Report-${r.period.monthName}-${r.period.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Barcode SVG via JsBarcode
  const renderBarcodeSvg = (elementId: string, text: string) => {
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (el) {
        try {
          JsBarcode(el, text, {
            format: "CODE128",
            width: 1.5,
            height: 40,
            displayValue: true,
            fontSize: 12,
            margin: 5
          });
        } catch (e) {
          console.error("JsBarcode error:", e);
        }
      }
    }, 50);
  };

  useEffect(() => {
    if (printUnits && printUnits.length > 0) {
      printUnits.forEach((u) => {
        renderBarcodeSvg(`barcode-${u.id}`, u.barcode);
      });
    }
  }, [printUnits]);

  // Filtering Batches & Prep Items
  const filteredBatches = batches.filter((b) => {
    if (activeTab === "FINISHED_GOODS" && b.category === "HOT_BAKES") return false;
    if (activeTab === "HOT_BAKES" && b.category !== "HOT_BAKES") return false;
    if (showExpiredOnly) {
      const isBatchExp = isItemExpired(b.bestBeforeDate);
      const hasExpUnits = b.units.some(u => isItemExpired(u.bestBeforeDate, u.status));
      if (!isBatchExp && !hasExpUnits) return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.branch.name.toLowerCase().includes(q) ||
      b.units.some((u) => u.itemTitle.toLowerCase().includes(q) || u.barcode.toLowerCase().includes(q))
    );
  });

  const filteredPrep = prepItems.filter((p) => {
    if (selectedPrepCategory !== "ALL" && p.category !== selectedPrepCategory) return false;
    if (showExpiredOnly && !isItemExpired(p.bestBeforeDate)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.flavor && p.flavor.toLowerCase().includes(q));
  });

  const filteredBrownies = brownieTrays.filter((b) => {
    if (showExpiredOnly && !isItemExpired(b.bestBeforeDate)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.trayCode.toLowerCase().includes(q) || b.branch.name.toLowerCase().includes(q);
  });

  const filteredRaw = rawIngredients.filter((r) => {
    if (showExpiredOnly && !isItemExpired(r.bestBeforeDate)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
  });

  const hasAnyInventoryAccess = canViewFinished || canHotBakes || canBrownies || canPrep || canRaw || canEod;

  if (!loading && !hasAnyInventoryAccess) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20 text-3xl font-black">
          🔒
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground">Inventory Access Restricted</h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Your account does not have active component permissions for Bakery Inventory. 
            Please request <strong>Rishi Bhai</strong> (Store Admin) to grant you specific inventory components in <em>User Management &gt; Edit Access</em>.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href={isSales ? "/sales" : "/admin"}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md active:scale-95 transition-all"
          >
            ← Return to {isSales ? "Sales Desk" : "Dashboard"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* 0. Page-Level Navigation Bar (Always Visible on Mobile & Desktop) */}
      <div className="flex items-center justify-between gap-2.5 bg-card border border-border/80 p-2.5 sm:px-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <Link
            href={isSales ? "/sales" : "/admin"}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs transition-all active:scale-95 border border-border shadow-xs"
            title={isSales ? "Go back to Sales Desk" : "Go back to Admin Dashboard"}
          >
            <span className="text-base font-bold">←</span>
            <span>{isSales ? "Back to Sales Desk" : "Back to Dashboard"}</span>
          </Link>
          <span className="text-muted-foreground text-xs hidden sm:inline">|</span>
          <Link
            href="/sales/pos"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground font-bold text-xs transition-all"
            title="Open POS Billing Counter"
          >
            <span>🏬</span>
            <span>POS Counter</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInventory()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/70 hover:bg-secondary text-foreground text-xs font-bold transition-all active:scale-95 border border-border/60"
            title="Reload live stock data"
          >
            <span>🔄</span>
            <span className="hidden xs:inline">Refresh Stock</span>
          </button>
        </div>
      </div>

      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-[var(--brand-deep-rose)]/10 text-[var(--brand-deep-rose)] rounded-xl">
              <ScanBarcode size={22} variant="Bold" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Master Bakery Inventory
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Multi-branch tracking with Day-Wise filters, Best Before / Expiry control & POS Protection.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {activeTab === "FINISHED_GOODS" && canInward && (
            <button
              onClick={handleOpenInward}
              className="col-span-2 sm:col-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-2xl bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[var(--brand-deep-rose)]/25 transition-all active:scale-95"
            >
              <AddCircle size={18} variant="Bold" />
              <span>Morning Inward + Print</span>
            </button>
          )}

          {activeTab === "HOT_BAKES" && canHotBakes && (
            <button
              onClick={handleOpenHotBakes}
              className="col-span-2 sm:col-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/25 transition-all active:scale-95"
            >
              <AddCircle size={18} variant="Bold" />
              <span>+ Inward Fresh Puffs</span>
            </button>
          )}

          {activeTab === "BROWNIE_TRAYS" && canBrownies && (
            <button
              onClick={handleOpenBrownie}
              className="col-span-2 sm:col-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-2xl bg-orange-700 hover:bg-orange-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-700/25 transition-all active:scale-95"
            >
              <AddCircle size={18} variant="Bold" />
              <span>+ Inward Brownie Tray</span>
            </button>
          )}

          {activeTab === "PREP_STOCKS" && canPrep && (
            <button
              onClick={handleOpenPrep}
              className="col-span-2 sm:col-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
            >
              <AddCircle size={18} variant="Bold" />
              <span>+ Add Prep Sponge / Cream</span>
            </button>
          )}

          {activeTab === "RAW_INGREDIENTS" && canRaw && (
            <button
              onClick={handleOpenRaw}
              className="col-span-2 sm:col-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-900 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-zinc-800/25 transition-all active:scale-95"
            >
              <AddCircle size={18} variant="Bold" />
              <span>+ Add Raw Ingredient</span>
            </button>
          )}

          {/* Feature 4: Spoilage Analytics Button */}
          {canReportDamage && (
            <button
              onClick={() => setShowWastageModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider border border-rose-500/20 transition-all active:scale-95"
              title="Wastage & Spoilage Reason Breakdown"
            >
              <Danger size={16} />
              <span className="truncate">Loss Analytics {stats.totalDamaged + stats.totalExpired > 0 ? `(${stats.totalDamaged + stats.totalExpired})` : ""}</span>
            </button>
          )}

          {/* Feature 1: EOD Store Closing Wizard Button */}
          {canEod && (
            <button
              onClick={() => {
                setEodStep(1);
                setEodSuccessSummary(null);
                setShowEODWizard(true);
              }}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-2xl bg-zinc-900 hover:bg-black text-amber-300 font-black text-xs uppercase tracking-wider shadow-lg shadow-zinc-900/30 border border-amber-400/30 transition-all active:scale-95"
              title="End-of-Day Store & Register Closing Wizard"
            >
              <span>🌙</span>
              <span className="truncate">EOD Closing</span>
            </button>
          )}

          {/* Monthly CA Report Button (Rishi Bhai / Granted Users Only) */}
          {canCaReport && (
            <button
              onClick={() => {
                setShowMonthlyReportModal(true);
                fetchMonthlyReport();
              }}
              className="col-span-2 sm:col-auto flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
              title="Generate Monthly Tax & Audit Statement for CA"
            >
              <ArchiveBook size={16} variant="Bold" />
              <span>Monthly CA Statement</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Level Switcher Tabs: Dedicated Component Access Sections */}
      <div className="flex items-center gap-1.5 border-b border-border/60 pb-1 overflow-x-auto custom-scrollbar">
        {canViewFinished && (
          <button
            onClick={() => setActiveTab("FINISHED_GOODS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === "FINISHED_GOODS"
                ? "bg-[var(--brand-deep-rose)] text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Box size={16} variant="Bold" />
            <span>🎂 Finished Cakes ({stats.totalInStock} in stock)</span>
          </button>
        )}

        {canHotBakes && (
          <button
            onClick={() => setActiveTab("HOT_BAKES")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === "HOT_BAKES"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Flash size={16} variant="Bold" />
            <span>🥐 Hot Bakes (Puffs / Savoury)</span>
          </button>
        )}

        {canBrownies && (
          <button
            onClick={() => setActiveTab("BROWNIE_TRAYS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === "BROWNIE_TRAYS"
                ? "bg-orange-700 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Coffee size={16} variant="Bold" />
            <span>🍫 Brownie Trays ({brownieStats.totalPiecesAvailable} pcs left)</span>
          </button>
        )}

        {canPrep && (
          <button
            onClick={() => setActiveTab("PREP_STOCKS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === "PREP_STOCKS"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Category size={16} variant="Bold" />
            <span>🥣 Prep Stocks ({prepStats.totalSpongesCount} Sponges)</span>
            {prepStats.lowStockAlerts > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-black">
                {prepStats.lowStockAlerts} LOW
              </span>
            )}
          </button>
        )}

        {canRaw && (
          <button
            onClick={() => setActiveTab("RAW_INGREDIENTS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === "RAW_INGREDIENTS"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Layer size={16} variant="Bold" />
            <span>📦 Raw Ingredients ({rawStats.totalStockKg} kg)</span>
          </button>
        )}
      </div>

      {/* 3. Day-Wise Filters & Branch Toolbar (Mobile-Optimized Horizontal Scroll) */}
      <div className="flex flex-col gap-3 p-3 sm:p-4 bg-card border border-border rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Universal Branch Selector */}
          {isSales ? (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-primary/10 border border-primary/20 rounded-xl text-xs font-black text-primary">
              <span>📍 Outlet:</span>
              <span>{branches.find(b => b.id === (userBranchId || selectedBranch))?.name || "Assigned Branch"}</span>
              <span className="text-[10px] text-muted-foreground font-semibold">(Your Store)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground hidden sm:inline">Outlet:</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none"
              >
                <option value="ALL">All Branches & Central Factory</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <SearchNormal1 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products, barcodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-secondary/40 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* DAY-WISE FILTER PILLS (Smooth horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => {
              setDateFilter("TODAY");
              setCustomDate("");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              dateFilter === "TODAY"
                ? "bg-[var(--brand-deep-rose)] text-white shadow-xs"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50"
            }`}
          >
            🟢 Today's Stock
          </button>
          <button
            onClick={() => {
              setDateFilter("YESTERDAY");
              setCustomDate("");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              dateFilter === "YESTERDAY"
                ? "bg-[var(--brand-deep-rose)] text-white shadow-xs"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50"
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => {
              setDateFilter("LAST_7_DAYS");
              setCustomDate("");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              dateFilter === "LAST_7_DAYS"
                ? "bg-[var(--brand-deep-rose)] text-white shadow-xs"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50"
            }`}
          >
            Last 7 Days
          </button>
          {canDeadStock && (
            <button
              onClick={() => {
                setDateFilter("DEAD_STOCK");
                setCustomDate("");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
                dateFilter === "DEAD_STOCK"
                  ? "bg-rose-600 text-white shadow-xs font-black"
                  : "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20"
              }`}
            >
              <span>⚠️ Dead Stock ({stats.totalDeadStock || 0})</span>
            </button>
          )}
          <button
            onClick={() => {
              setDateFilter("ALL");
              setCustomDate("");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              dateFilter === "ALL" && !customDate
                ? "bg-[var(--brand-deep-rose)] text-white shadow-xs"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50"
            }`}
          >
            All Time
          </button>

          {/* Custom Date Input */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 border border-border/60 rounded-xl shrink-0">
            <Calendar size={14} className="text-muted-foreground" />
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDateFilter("CUSTOM");
              }}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            />
          </div>

          {/* Expired Filter Toggle */}
          <button
            onClick={() => setShowExpiredOnly(!showExpiredOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
              showExpiredOnly
                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                : "bg-rose-500/10 text-rose-600 border-rose-200 hover:bg-rose-500/20"
            }`}
          >
            <Danger size={14} variant="Bold" />
            <span>Show Expired ({stats.totalExpired})</span>
          </button>
        </div>
      </div>

      {/* 4. Tab 1: Finished Cakes (Barcodes) */}
      {activeTab === "FINISHED_GOODS" && (
        <div className="space-y-4">
          {/* Revenue & Counter Discount Realization Card (Confidential - Rishi Bhai / Granted Staff) */}
          {canFinancials && revenueStats && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 shadow-xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center font-black text-lg">
                    ₹
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-950 dark:text-amber-200">
                        Sales Revenue & Counter Discount Realization
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-600 text-white uppercase tracking-wider">
                        🔒 Confidential Financials
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Live barcode cake revenue and counter discounts given by sales staff for selected period
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                  <div className="bg-card/90 p-2.5 rounded-2xl border border-amber-200/50 shadow-xs">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Sales Revenue</p>
                    <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                      ₹{revenueStats.totalRevenue.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-semibold">{revenueStats.soldUnitsCount} cakes sold</p>
                  </div>

                  <div className="bg-card/90 p-2.5 rounded-2xl border border-amber-200/50 shadow-xs">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Discounts Given</p>
                    <p className="text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5">
                      -₹{revenueStats.totalDiscountGiven.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-semibold">MRP ₹{revenueStats.totalOriginalValue.toLocaleString("en-IN")}</p>
                  </div>

                  <div className="bg-card/90 p-2.5 rounded-2xl border border-amber-200/50 shadow-xs">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Realization</p>
                    <p className="text-lg font-black text-indigo-700 dark:text-indigo-400 mt-0.5">
                      {revenueStats.realizationRate.toFixed(1)}%
                    </p>
                    <p className="text-[9px] text-muted-foreground font-semibold">Of original MRP</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">🟢 Today's Fresh Inward</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{stats.todayStock} units</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Inwarded today & active</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Box size={22} variant="Bold" />
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total In Stock</p>
                <p className="text-2xl font-black text-foreground mt-1">{stats.totalInStock} units</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Display counter cakes</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Flash size={22} variant="Bold" />
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Sold Today</p>
                <p className="text-2xl font-black text-foreground mt-1">{stats.totalSoldToday} units</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Scanned at POS</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <TickCircle size={22} variant="Bold" />
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">⛔ Expired Items</p>
                <p className="text-2xl font-black text-rose-600 mt-1">{stats.totalExpired} units</p>
                <p className="text-[10px] text-rose-500 mt-0.5 font-bold">POS sale blocked</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Danger size={22} variant="Bold" />
              </div>
            </div>
          </div>

          {/* DEAD STOCK WARNING & CAPITAL BANNER */}
          {dateFilter === "DEAD_STOCK" && (
            <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-600 text-white font-black text-lg">
                  ⚠️
                </div>
                <div>
                  <h4 className="font-black text-sm text-rose-950 dark:text-rose-200">
                    Dead Stock & Slow-Moving Inventory ({stats.totalDeadStock || 0} Units)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fresh cakes unsold for &gt;48 hours in counter or items past Best Before date.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-black text-rose-700 bg-rose-100 dark:bg-rose-950/60 px-2.5 py-1 rounded-xl border border-rose-300">
                      Locked Capital: ₹{(stats.deadStockLockedCapital || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      ⚡ Action: Offer counter discount or write off to keep counter fresh.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DAILY STOCK MOVEMENT REGISTER (Dead Stock & Movement Auditing) */}
          {canDeadStock && dailyMovement && (
            <div className="p-4 rounded-3xl bg-secondary/30 border border-border/60 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    📊 Daily Stock Movement Register
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    ({selectedBranch === "ALL" ? "All Outlets & Factory" : branches.find(b => b.id === selectedBranch)?.name || "Selected Branch"})
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Balanced Movement Formula
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 text-xs font-mono">
                <div className="p-2.5 bg-card rounded-2xl border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Opening Stock</p>
                  <p className="text-base font-black text-foreground mt-0.5">{dailyMovement.openingStock} units</p>
                  <p className="text-[9px] text-muted-foreground">Start of day</p>
                </div>

                <div className="p-2.5 bg-card rounded-2xl border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">+ Inward Today</p>
                  <p className="text-base font-black text-emerald-600 mt-0.5">+{dailyMovement.inwardToday} units</p>
                  <p className="text-[9px] text-muted-foreground">Fresh production</p>
                </div>

                <div className="p-2.5 bg-card rounded-2xl border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">- Sold Today</p>
                  <p className="text-base font-black text-indigo-600 mt-0.5">-{dailyMovement.soldToday} units</p>
                  <p className="text-[9px] text-muted-foreground">Scanned at POS</p>
                </div>

                <div className="p-2.5 bg-card rounded-2xl border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">- Spoilage / Loss</p>
                  <p className="text-base font-black text-rose-600 mt-0.5">-{dailyMovement.damagedToday} units</p>
                  <p className="text-[9px] text-muted-foreground">Damaged / Expired</p>
                </div>

                <div className="p-2.5 bg-card rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-500/10">
                  <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">= Closing Stock</p>
                  <p className="text-base font-black text-amber-900 dark:text-amber-200 mt-0.5">{dailyMovement.closingStock} units</p>
                  <p className="text-[9px] text-muted-foreground">In counter now</p>
                </div>
              </div>
            </div>
          )}

          {filteredBatches.map((batch) => {
            const isBatchExp = isItemExpired(batch.bestBeforeDate);
            return (
              <div key={batch.id} className="p-5 bg-card border border-border rounded-3xl shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/10 text-pink-600">
                      {batch.category.replace("_", " ")}
                    </span>
                    <h3 className="font-bold text-sm text-foreground">{batch.title}</h3>
                    <span className="text-xs text-muted-foreground">· {batch.branch.name}</span>
                    
                    {/* Best Before Badge */}
                    {batch.bestBeforeDate && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isBatchExp ? "bg-rose-500 text-white animate-pulse" : "bg-secondary text-muted-foreground"
                      }`}>
                        <Calendar size={12} />
                        {isBatchExp ? `⛔ EXPIRED on ${formatDateShort(batch.bestBeforeDate)}` : `Best Before: ${formatDateShort(batch.bestBeforeDate)}`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600">
                      {batch.units.filter((u) => u.status === "IN_STOCK" && !isItemExpired(u.bestBeforeDate, u.status)).length} in counter
                    </span>
                    <button
                      onClick={() => setPrintUnits(batch.units)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold"
                    >
                      <Printer size={15} />
                      <span>Print Labels ({batch.units.length})</span>
                    </button>
                    {/* Modify Batch Button (Permission Gated) */}
                    {canEditDelete && (
                      <button
                        onClick={() => setEditTarget({
                          type: "BATCH",
                          id: batch.id,
                          title: batch.title,
                          qty: batch.closingQty,
                          bestBeforeDate: batch.bestBeforeDate ? new Date(batch.bestBeforeDate).toISOString().split("T")[0] : "",
                          notes: batch.notes || ""
                        })}
                        className="p-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground"
                        title="Edit Batch"
                      >
                        <Edit2 size={15} />
                      </button>
                    )}
                    {/* Delete Batch Button (Permission Gated) */}
                    {canEditDelete && (
                      <button
                        onClick={() => handleDeleteItem("BATCH", batch.id, batch.title)}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600"
                        title="Delete Batch"
                      >
                        <Trash size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Units Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {batch.units.map((unit) => {
                    const expired = isItemExpired(unit.bestBeforeDate, unit.status);
                    return (
                      <div
                        key={unit.id}
                        className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between gap-3 transition-all shadow-xs ${
                          expired
                            ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 ring-1 ring-rose-500/30"
                            : unit.status === "IN_STOCK" 
                              ? "bg-card border-border/80 hover:border-[var(--brand-deep-rose)]/50 hover:shadow-md" 
                              : "bg-secondary/30 opacity-75"
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Top Row: Item Title + Status Pill */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-black text-sm text-foreground leading-snug line-clamp-1">{unit.itemTitle}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 tracking-wide ${
                              expired
                                ? "bg-rose-600 text-white animate-pulse"
                                : unit.status === "IN_STOCK" 
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30" 
                                  : unit.status === "SOLD"
                                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                                    : "bg-secondary text-muted-foreground"
                            }`}>
                              {expired ? "⛔ EXPIRED" : unit.status}
                            </span>
                          </div>

                          {/* Subtitle Row: Weight, Flavor, and Price Badge */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] text-muted-foreground font-semibold truncate">
                              {unit.variantWeight} {unit.flavor ? `· ${unit.flavor}` : ""}
                            </span>
                            {unit.status !== "SOLD" && unit.status !== "DAMAGED" && (
                              <span className="text-xs font-black text-foreground bg-secondary/80 px-2 py-0.5 rounded-md border border-border/50 shrink-0">
                                ₹{Number(unit.sellingPrice)}
                              </span>
                            )}
                          </div>

                          {/* Pricing & Discount Transparency for Sold & Damaged */}
                          {unit.status === "SOLD" ? (
                            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                              {unit.soldPrice !== null && unit.soldPrice !== undefined && Number(unit.soldPrice) < Number(unit.sellingPrice) ? (
                                <div className="flex flex-wrap items-center justify-between gap-1">
                                  <span className="font-black text-emerald-700 dark:text-emerald-300 text-xs">
                                    Sold: ₹{Number(unit.soldPrice)}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-muted-foreground line-through">
                                      ₹{Number(unit.sellingPrice)}
                                    </span>
                                    <span className="text-[9px] font-black text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-1 py-0.5 rounded border border-amber-300">
                                      -₹{Number(unit.sellingPrice) - Number(unit.soldPrice)} Disc
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-xs font-black text-emerald-700 dark:text-emerald-300">
                                  <span>Sold: ₹{Number(unit.soldPrice || unit.sellingPrice)}</span>
                                  <span className="text-[10px] font-medium text-muted-foreground">(Full MRP)</span>
                                </div>
                              )}
                            </div>
                          ) : unit.status === "DAMAGED" ? (
                            <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-1.5 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                              <span>⚠️</span>
                              <span className="truncate">{unit.damageReason || "Damaged / Spoilage"}</span>
                            </div>
                          ) : null}

                          {/* Best Before Date Badge */}
                          <div className={`p-1.5 rounded-xl border flex items-center justify-between text-[10px] font-bold ${
                            expired 
                              ? "bg-rose-500/15 border-rose-300 text-rose-700 dark:text-rose-300"
                              : "bg-secondary/40 border-border/60 text-muted-foreground"
                          }`}>
                            <span className="flex items-center gap-1">
                              <span>📅</span>
                              <span>Best Before:</span>
                            </span>
                            <span className={expired ? "font-black text-rose-700 dark:text-rose-300 uppercase" : "font-black text-foreground"}>
                              {expired ? "EXPIRED (Sale Blocked)" : formatDateShort(unit.bestBeforeDate || batch.bestBeforeDate)}
                            </span>
                          </div>
                        </div>

                        {/* Card Footer: Barcode + Touch-Friendly Action Buttons */}
                        <div className="pt-2.5 border-t border-border/50 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md border border-border/40 truncate block max-w-full" title={unit.barcode}>
                              {unit.barcode}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Mark Damaged / Spoilage (Permission-Gated) */}
                            {canReportDamage && unit.status === "IN_STOCK" && (
                              <button
                                onClick={() => {
                                  setDamageTarget(unit);
                                  setSelectedDamageReason("Melting / Temperature issue");
                                  setCustomDamageNote("");
                                }}
                                className="w-8 h-8 rounded-xl bg-secondary hover:bg-rose-500/20 text-muted-foreground hover:text-rose-600 flex items-center justify-center transition-all border border-border/50 active:scale-90"
                                title="Mark as Damaged / Spoilage"
                              >
                                <Danger size={15} />
                              </button>
                            )}
                            {/* Modify Item (Permission-Gated) */}
                            {canEditDelete && (
                              <button
                                onClick={() => setEditTarget({
                                  type: "UNIT",
                                  id: unit.id,
                                  title: unit.itemTitle,
                                  price: Number(unit.sellingPrice),
                                  weight: unit.variantWeight,
                                  flavor: unit.flavor || "",
                                  status: unit.status,
                                  bestBeforeDate: unit.bestBeforeDate ? new Date(unit.bestBeforeDate).toISOString().split("T")[0] : ""
                                })}
                                className="w-8 h-8 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-all border border-border/50 active:scale-90"
                                title="Edit item details"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                            {/* Delete Item (Permission-Gated) */}
                            {canEditDelete && (
                              <button
                                onClick={() => handleDeleteItem("UNIT", unit.id, unit.itemTitle)}
                                className="w-8 h-8 rounded-xl bg-secondary hover:bg-rose-500/20 text-muted-foreground hover:text-rose-600 flex items-center justify-center transition-all border border-border/50 active:scale-90"
                                title="Delete item"
                              >
                                <Trash size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Tab 2: Hot Bakes / Puffs (Quantity-Based, NO Barcode) */}
      {activeTab === "HOT_BAKES" && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Flash size={18} variant="Bold" />
                <span>Quantity-Based Hot Bakes Tracking (No Barcodes Required)</span>
              </h3>
              <p className="text-xs text-amber-800/80 dark:text-amber-400 mt-0.5">
                Puffs and patties are sold quickly by quantity. When sales staff ring them up at POS, stock auto-deducts until 0.
              </p>
            </div>
            <button
              onClick={handleOpenHotBakes}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-amber-700 shrink-0"
            >
              + Inward Puffs Batch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBatches.map((batch) => {
              const remaining = batch.closingQty;
              const expired = isItemExpired(batch.bestBeforeDate);
              return (
                <div key={batch.id} className={`p-4 rounded-3xl border shadow-xs space-y-3 ${
                  expired ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300" : "bg-card border-border"
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700">
                        {batch.branch.name}
                      </span>
                      <h4 className="font-bold text-sm text-foreground mt-1">{batch.title}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        Best Before: <strong className={expired ? "text-rose-600" : "text-foreground"}>{formatDateShort(batch.bestBeforeDate)}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black px-2 py-1 rounded-xl ${
                        expired ? "bg-rose-600 text-white" : "bg-amber-500/10 text-amber-700"
                      }`}>
                        {expired ? "⛔ EXPIRED" : `${remaining} Left`}
                      </span>
                      {canEditDelete && (
                        <>
                          <button
                            onClick={() => setEditTarget({
                              type: "BATCH",
                              id: batch.id,
                              title: batch.title,
                              qty: batch.closingQty,
                              bestBeforeDate: batch.bestBeforeDate ? new Date(batch.bestBeforeDate).toISOString().split("T")[0] : ""
                            })}
                            className="p-1 hover:text-foreground text-muted-foreground"
                            title="Edit Batch"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem("BATCH", batch.id, batch.title)}
                            className="p-1 hover:text-rose-600 text-muted-foreground"
                            title="Delete Batch"
                          >
                            <Trash size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-secondary/40 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Morning Inward</span>
                      <span className="font-black text-foreground">{batch.openingQty} pcs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Sold</span>
                      <span className="font-black text-emerald-600">{batch.soldQty} pcs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Remaining</span>
                      <span className="font-black text-amber-600">{remaining} pcs</span>
                    </div>
                  </div>

                  {/* Stock progress */}
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (batch.soldQty / (batch.openingQty || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Brownie Trays (Tray -> Cut Pieces) */}
      {activeTab === "BROWNIE_TRAYS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pieces Ready to Sell</p>
                <p className="text-2xl font-black text-orange-600 mt-1">{brownieStats.totalPiecesAvailable} pcs</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Across active cut trays</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-600/10 text-orange-600 flex items-center justify-center">
                <Coffee size={24} variant="Bold" />
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Pieces Sold</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{brownieStats.totalPiecesSold} pcs</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Counter walk-in pieces</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Flash size={24} variant="Bold" />
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Open Trays</p>
                <p className="text-2xl font-black text-foreground mt-1">{brownieStats.activeTraysCount} trays</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">In branch counters</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Box size={24} variant="Bold" />
              </div>
            </div>
          </div>

          {/* Brownie Trays List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBrownies.map((tray) => {
              const remaining = Math.max(0, tray.totalPieces - tray.soldPieces);
              const isDone = tray.status === "COMPLETED" || remaining === 0;
              const expired = isItemExpired(tray.bestBeforeDate);

              return (
                <div
                  key={tray.id}
                  className={`p-4 rounded-3xl border shadow-xs space-y-3 ${
                    expired 
                      ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300"
                      : isDone 
                        ? "bg-secondary/20 border-border/40 opacity-70" 
                        : "bg-card border-border hover:border-orange-500/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-600/10 text-orange-700">
                          {tray.branch.name}
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          {tray.trayCode}
                        </span>
                        {tray.bestBeforeDate && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            expired ? "bg-rose-600 text-white" : "bg-secondary text-muted-foreground"
                          }`}>
                            {expired ? "⛔ EXPIRED" : `Best Before: ${formatDateShort(tray.bestBeforeDate)}`}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-1.5">{tray.title}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        Cut by: <strong>{tray.cutBy || "Chef"}</strong> · ₹{Number(tray.piecePrice)} / piece
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {canEditDelete && (
                        <>
                          <button
                            onClick={() => setEditTarget({
                              type: "BROWNIE",
                              id: tray.id,
                              title: tray.title,
                              flavor: tray.flavor || "",
                              qty: tray.totalPieces,
                              price: Number(tray.piecePrice),
                              status: tray.status,
                              bestBeforeDate: tray.bestBeforeDate ? new Date(tray.bestBeforeDate).toISOString().split("T")[0] : ""
                            })}
                            className="p-1 hover:text-foreground text-muted-foreground"
                            title="Edit Tray"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem("BROWNIE", tray.id, tray.title)}
                            className="p-1 hover:text-rose-600 text-muted-foreground"
                            title="Delete Tray"
                          >
                            <Trash size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Piece Ratio Display: Sale/50 */}
                  <div className="p-3 bg-secondary/40 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Cut From Tray</span>
                      <span className="font-black text-foreground">{tray.totalPieces} pieces</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-muted-foreground block">Sold / Total</span>
                      <span className="font-black text-orange-600 text-sm">
                        {tray.soldPieces} / {tray.totalPieces} sold
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">Remaining</span>
                      <span className="font-black text-emerald-600 text-sm">{remaining} pcs</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-orange-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (tray.soldPieces / (tray.totalPieces || 1)) * 100)}%` }}
                    ></div>
                  </div>

                  {!isDone && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                      {expired ? (
                        <span className="text-xs font-black text-rose-600">
                          ⛔ Tray Expired — Sale Blocked
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSellBrowniePiece(tray.id)}
                          className="px-3 py-1.5 rounded-xl bg-orange-700 hover:bg-orange-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm"
                        >
                          Sell 1 Piece (₹{Number(tray.piecePrice)})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Tab 4: Prep Stocks (Sponges & Creams) */}
      {activeTab === "PREP_STOCKS" && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Category size={18} variant="Bold" />
                <span>Central Kitchen Prep Stocks (Sponges, Creams, Fillings)</span>
              </h3>
              <p className="text-xs text-indigo-800/80 dark:text-indigo-400 mt-0.5">
                Prepared at Warasiya Factory for cake assembly across all outlets. Frosting chefs can quick-deduct consumed sponges with 1 tap.
              </p>
            </div>
            <button
              onClick={handleOpenPrep}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-indigo-700 shrink-0"
            >
              + Add Prep Sponge / Cream
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPrep.map((item) => {
              const isLow = Number(item.currentStock) <= Number(item.minAlertLevel);
              const expired = isItemExpired(item.bestBeforeDate);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-3xl border shadow-xs space-y-3 ${
                    expired
                      ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300"
                      : isLow 
                        ? "bg-rose-500/5 border-rose-200" 
                        : "bg-card border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700">
                          {item.category}
                        </span>
                        {item.flavor && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                            {item.flavor}
                          </span>
                        )}
                        {item.bestBeforeDate && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            expired ? "bg-rose-600 text-white" : "bg-secondary text-muted-foreground"
                          }`}>
                            {expired ? "⛔ EXPIRED" : `Best Before: ${formatDateShort(item.bestBeforeDate)}`}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-1.5">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        Location: <strong>{item.branch ? item.branch.name : "Warasiya Factory (Central)"}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {canEditDelete && (
                        <>
                          <button
                            onClick={() => setEditTarget({
                              type: "PREP",
                              id: item.id,
                              title: item.name,
                              qty: Number(item.currentStock),
                              flavor: item.flavor || "",
                              unit: item.unit,
                              bestBeforeDate: item.bestBeforeDate ? new Date(item.bestBeforeDate).toISOString().split("T")[0] : ""
                            })}
                            className="p-1 hover:text-foreground text-muted-foreground"
                            title="Edit Item"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem("PREP", item.id, item.name)}
                            className="p-1 hover:text-rose-600 text-muted-foreground"
                            title="Delete Item"
                          >
                            <Trash size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-secondary/40 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Available Stock</span>
                      <span className={`font-black text-base ${isLow ? "text-rose-600" : "text-foreground"}`}>
                        {Number(item.currentStock)} {item.unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">Min Alert Level</span>
                      <span className="font-bold text-muted-foreground">{Number(item.minAlertLevel)} {item.unit}</span>
                    </div>
                  </div>

                  {/* Chef Log Quick Deduct Buttons */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-bold">Chef Quick Log:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleChefLogDeduct(item.id, 1, "SUBTRACT")}
                        className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-rose-500/20 hover:text-rose-600 transition-colors"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleChefLogDeduct(item.id, 5, "SUBTRACT")}
                        className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-rose-500/20 hover:text-rose-600 transition-colors"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleChefLogDeduct(item.id, 10, "ADD")}
                        className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-emerald-500/20 hover:text-emerald-600 transition-colors"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Tab 5: Raw Ingredients (Flour, Sugar, Dairy, Boxes) */}
      {activeTab === "RAW_INGREDIENTS" && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-zinc-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <h3 className="font-black text-sm flex items-center gap-1.5">
                <Layer size={18} variant="Bold" />
                <span>Bulk Raw Ingredients & Packaging Warehouses</span>
              </h3>
              <p className="text-xs text-zinc-300 mt-0.5">
                Tracks flour, dairy, chocolates, fondants, and cake packaging boxes with branch associations.
              </p>
            </div>
            <button
              onClick={handleOpenRaw}
              className="px-4 py-2 bg-white text-zinc-900 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-zinc-100 shrink-0"
            >
              + Add Raw Material
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRaw.map((item) => {
              const isLow = Number(item.currentStock) <= Number(item.minAlertLevel);
              const expired = isItemExpired(item.bestBeforeDate);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-3xl border shadow-xs space-y-3 ${
                    expired
                      ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300"
                      : isLow 
                        ? "bg-rose-500/5 border-rose-200" 
                        : "bg-card border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-700 dark:text-zinc-300">
                          {item.category}
                        </span>
                        {item.bestBeforeDate && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            expired ? "bg-rose-600 text-white" : "bg-secondary text-muted-foreground"
                          }`}>
                            {expired ? "⛔ EXPIRED" : `Best Before: ${formatDateShort(item.bestBeforeDate)}`}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-1.5">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        Location: <strong>{item.branch ? item.branch.name : "Central Warehouse"}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {canEditDelete && (
                        <>
                          <button
                            onClick={() => setEditTarget({
                              type: "RAW",
                              id: item.id,
                              title: item.name,
                              qty: Number(item.currentStock),
                              unit: item.unit,
                              price: Number(item.costPerUnit),
                              bestBeforeDate: item.bestBeforeDate ? new Date(item.bestBeforeDate).toISOString().split("T")[0] : ""
                            })}
                            className="p-1 hover:text-foreground text-muted-foreground"
                            title="Edit Item"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem("RAW", item.id, item.name)}
                            className="p-1 hover:text-rose-600 text-muted-foreground"
                            title="Delete Item"
                          >
                            <Trash size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-secondary/40 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Current Stock</span>
                      <span className={`font-black text-base ${isLow ? "text-rose-600" : "text-foreground"}`}>
                        {Number(item.currentStock)} {item.unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">Reorder Alert</span>
                      <span className="font-bold text-muted-foreground">{Number(item.minAlertLevel)} {item.unit}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-bold">Quick Adjust:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleQuickAdjustRaw(item.id, 5, "SUBTRACT")}
                        className="px-2 py-1 rounded-lg bg-secondary text-foreground text-[10px] font-bold hover:bg-rose-500/20 hover:text-rose-600"
                      >
                        -5 {item.unit}
                      </button>
                      <button
                        onClick={() => handleQuickAdjustRaw(item.id, 10, "ADD")}
                        className="px-2 py-1 rounded-lg bg-secondary text-foreground text-[10px] font-bold hover:bg-emerald-500/20 hover:text-emerald-600"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => handleQuickAdjustRaw(item.id, 50, "ADD")}
                        className="px-2 py-1 rounded-lg bg-secondary text-foreground text-[10px] font-bold hover:bg-emerald-500/20 hover:text-emerald-600"
                      >
                        +50
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: Finished Cakes Inward (Barcodes & Best Before) */}
      {showInwardModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowInwardModal(false); }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
        >
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[95vh] overflow-y-auto cursor-default">
            <div className="flex items-center justify-between border-b border-border/50 pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ScanBarcode size={22} className="text-[var(--brand-deep-rose)] shrink-0" variant="Bold" />
                <div className="min-w-0">
                  <h3 className="font-black text-base sm:text-lg text-foreground truncate">Morning Inward & Print</h3>
                  <p className="text-[11px] text-muted-foreground truncate">Make counter items, set best before & print serial barcode stickers</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInwardModal(false)} 
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs flex items-center gap-1.5 border border-border transition-all active:scale-95 shrink-0"
                title="Close"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            <form onSubmit={handleCreateInward} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-black text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Shop size={16} className="text-[var(--brand-deep-rose)]" variant="Bold" />
                  <span>Select Branch *</span>
                </label>
                {isSales ? (
                  <div className="px-3.5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-black text-primary flex items-center gap-2">
                    <span>📍</span>
                    <span>{branches.find(b => b.id === (userBranchId || inwardBranch))?.name || "Assigned Branch"}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">(Your Store)</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {branches.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setInwardBranch(b.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                          inwardBranch === b.id
                            ? "bg-[var(--brand-deep-rose)] text-white border-[var(--brand-deep-rose)] shadow-sm"
                            : "bg-secondary/40 border-border text-muted-foreground"
                        }`}
                      >
                        {b.name} ({b.code})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-foreground mb-1 block">Cake / Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dutch Chocolate Cake"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="font-bold text-foreground block">Size / Weight</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["250g", "500g", "750g", "1kg", "1.5kg", "2kg", "Pastry"].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWeight(w)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          weight === w
                            ? "bg-[var(--brand-deep-rose)] text-white border-[var(--brand-deep-rose)]"
                            : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-foreground mb-1 block">Flavour (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dutch Choco, Truffle"
                    value={flavor}
                    onChange={(e) => setFlavor(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground focus:outline-none"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">Printed on 50×25mm sticker</span>
                </div>
              </div>

              {/* Best Before Date & Shelf Life Options */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <Calendar size={14} className="text-[var(--brand-deep-rose)]" />
                    <span>Best Before / Expiry Date *</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-semibold">POS sale blocked after this</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: "2 Days (Fresh Cream)", days: 2 },
                    { label: "3 Days (Dry / Tea Cake)", days: 3 },
                    { label: "1 Day (Pastry)", days: 1 },
                    { label: "5 Days (Fondant)", days: 5 },
                  ].map((s) => (
                    <button
                      key={s.days}
                      type="button"
                      onClick={() => {
                        setCakeShelfLifeDays(s.days);
                        setCakeBestBefore(getFutureDateStr(s.days));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        cakeShelfLifeDays === s.days
                          ? "bg-[var(--brand-deep-rose)] text-white border-[var(--brand-deep-rose)]"
                          : "bg-background border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  value={cakeBestBefore}
                  onChange={(e) => {
                    setCakeBestBefore(e.target.value);
                    setCakeShelfLifeDays(0);
                  }}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-bold text-foreground mt-1 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground mb-1 block">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground mb-1 block">Quantity (Boxes)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-all active:scale-95"
                >
                  ✕ Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/90 text-white font-bold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all"
                >
                  {submitting ? "Generating..." : `Generate & Print ${quantity} Barcodes`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Hot Bakes Inward (Puffs - Quantity Only & Best Before) */}
      {showHotBakesModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowHotBakesModal(false); }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
        >
          <div className="bg-card border border-border w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-xs my-auto cursor-default">
            <div className="flex items-center justify-between border-b border-border/50 pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Flash size={20} className="text-amber-600 shrink-0" variant="Bold" />
                <h3 className="font-black text-base sm:text-lg text-foreground truncate">Inward Hot Bakes (Puffs)</h3>
              </div>
              <button 
                onClick={() => setShowHotBakesModal(false)} 
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs flex items-center gap-1.5 border border-border transition-all active:scale-95 shrink-0"
                title="Close"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            <form onSubmit={handleCreateHotBake} className="space-y-3">
              <div>
                <label className="font-bold text-foreground mb-1 block">Outlet Branch *</label>
                {isSales ? (
                  <div className="px-3.5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-black text-primary flex items-center gap-2">
                    <span>📍</span>
                    <span>{branches.find(b => b.id === (userBranchId || inwardBranch))?.name || "Assigned Branch"}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">(Your Store)</span>
                  </div>
                ) : (
                  <select
                    value={inwardBranch}
                    onChange={(e) => setInwardBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                    required
                  >
                    <option value="">Select Branch...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="font-bold text-foreground mb-1 block">Item Name</label>
                <input
                  type="text"
                  value={hotBakeName}
                  onChange={(e) => setHotBakeName(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                  required
                />
              </div>

              {/* Best Before */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <Calendar size={14} className="text-amber-600" />
                    <span>Best Before Date</span>
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setHotBakeShelfLifeDays(1);
                      setHotBakeBestBefore(getFutureDateStr(1));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      hotBakeShelfLifeDays === 1 ? "bg-amber-600 text-white border-amber-600" : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    1 Day (Today Fresh)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHotBakeShelfLifeDays(2);
                      setHotBakeBestBefore(getFutureDateStr(2));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      hotBakeShelfLifeDays === 2 ? "bg-amber-600 text-white border-amber-600" : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    2 Days (Tomorrow)
                  </button>
                </div>
                <input
                  type="date"
                  value={hotBakeBestBefore}
                  onChange={(e) => {
                    setHotBakeBestBefore(e.target.value);
                    setHotBakeShelfLifeDays(0);
                  }}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-bold text-foreground mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground mb-1 block">Quantity (Pcs)</label>
                  <input
                    type="number"
                    min="1"
                    value={hotBakeQty}
                    onChange={(e) => setHotBakeQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground mb-1 block">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={hotBakePrice}
                    onChange={(e) => setHotBakePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowHotBakesModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-all active:scale-95"
                >
                  ✕ Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all"
                >
                  {submitting ? "Saving..." : `Inward ${hotBakeQty} Puffs`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Brownie Tray Inward Modal */}
      {showBrownieModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowBrownieModal(false); }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
        >
          <div className="bg-card border border-border w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-xs my-auto cursor-default">
            <div className="flex items-center justify-between border-b border-border/50 pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Coffee size={20} className="text-orange-700 shrink-0" variant="Bold" />
                <h3 className="font-black text-base sm:text-lg text-foreground truncate">Inward Brownie Tray</h3>
              </div>
              <button 
                onClick={() => setShowBrownieModal(false)} 
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs flex items-center gap-1.5 border border-border transition-all active:scale-95 shrink-0"
                title="Close"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            <form onSubmit={handleCreateBrownieTray} className="space-y-3">
              <div>
                <label className="font-bold text-foreground mb-1 block">Receiving Outlet Branch *</label>
                {isSales ? (
                  <div className="px-3.5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-black text-primary flex items-center gap-2">
                    <span>📍</span>
                    <span>{branches.find(b => b.id === (userBranchId || inwardBranch))?.name || "Assigned Branch"}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">(Your Store)</span>
                  </div>
                ) : (
                  <select
                    value={inwardBranch}
                    onChange={(e) => setInwardBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                    required
                  >
                    <option value="">Select Branch...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="font-bold text-foreground mb-1 block">Tray Title</label>
                <input
                  type="text"
                  value={brownieTitle}
                  onChange={(e) => setBrownieTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-foreground mb-1 block">Flavor</label>
                <input
                  type="text"
                  value={brownieFlavor}
                  onChange={(e) => setBrownieFlavor(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground"
                />
              </div>

              {/* Best Before */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <Calendar size={14} className="text-orange-700" />
                    <span>Best Before Date</span>
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setBrownieShelfLifeDays(4);
                      setBrownieBestBefore(getFutureDateStr(4));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      brownieShelfLifeDays === 4 ? "bg-orange-700 text-white border-orange-700" : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    4 Days (Fresh)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBrownieShelfLifeDays(7);
                      setBrownieBestBefore(getFutureDateStr(7));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      brownieShelfLifeDays === 7 ? "bg-orange-700 text-white border-orange-700" : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    7 Days (Sealed)
                  </button>
                </div>
                <input
                  type="date"
                  value={brownieBestBefore}
                  onChange={(e) => {
                    setBrownieBestBefore(e.target.value);
                    setBrownieShelfLifeDays(0);
                  }}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-bold text-foreground mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground mb-1 block">Pieces Cut From Tray</label>
                  <input
                    type="number"
                    min="1"
                    value={browniePieces}
                    onChange={(e) => setBrowniePieces(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-black text-sm"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">Staff can enter any cut count</span>
                </div>
                <div>
                  <label className="font-bold text-foreground mb-1 block">Piece Price (₹)</label>
                  <input
                    type="number"
                    value={browniePrice}
                    onChange={(e) => setBrowniePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-black text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground mb-1 block">Cut By (Chef / Staff)</label>
                <input
                  type="text"
                  value={brownieCutBy}
                  onChange={(e) => setBrownieCutBy(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground"
                />
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowBrownieModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-all active:scale-95"
                >
                  ✕ Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-orange-700 hover:bg-orange-800 text-white font-bold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all"
                >
                  {submitting ? "Saving..." : `Inward Tray (${browniePieces} pcs)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Prep Stock Modal (Sponges & Creams & Best Before) */}
      {showPrepModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowPrepModal(false); }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
        >
          <div className="bg-card border border-border w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-xs my-auto cursor-default">
            <div className="flex items-center justify-between border-b border-border/50 pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Category size={20} className="text-indigo-600 shrink-0" variant="Bold" />
                <h3 className="font-black text-base sm:text-lg text-foreground truncate">Add Prep Stock (Sponge / Cream)</h3>
              </div>
              <button 
                onClick={() => setShowPrepModal(false)} 
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs flex items-center gap-1.5 border border-border transition-all active:scale-95 shrink-0"
                title="Close"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            <form onSubmit={handleSavePrepItem} className="space-y-3">
              <div>
                <label className="font-bold text-foreground mb-1 block">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chocolate Sponge Base (500g), Truffle Ganache"
                  value={prepName}
                  onChange={(e) => setPrepName(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground mb-1 block">Category</label>
                  <select
                    value={prepCat}
                    onChange={(e: any) => setPrepCat(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                  >
                    <option value="SPONGE">Cake Sponge</option>
                    <option value="CREAM">Frosting Cream</option>
                    <option value="FILLING">Fruit Filling</option>
                    <option value="SYRUP">Sugar Syrup</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-foreground mb-1 block">Flavor (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Chocolate, Vanilla"
                    value={prepFlavor}
                    onChange={(e) => setPrepFlavor(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground"
                  />
                </div>
              </div>

              {/* Best Before */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-600" />
                    <span>Best Before Date</span>
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPrepShelfLifeDays(3);
                      setPrepBestBefore(getFutureDateStr(3));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      prepShelfLifeDays === 3 ? "bg-indigo-600 text-white border-indigo-600" : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    3 Days (Sponge)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrepShelfLifeDays(5);
                      setPrepBestBefore(getFutureDateStr(5));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      prepShelfLifeDays === 5 ? "bg-indigo-600 text-white border-indigo-600" : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    5 Days (Syrup)
                  </button>
                </div>
                <input
                  type="date"
                  value={prepBestBefore}
                  onChange={(e) => {
                    setPrepBestBefore(e.target.value);
                    setPrepShelfLifeDays(0);
                  }}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-bold text-foreground mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-foreground mb-1 block">Initial Stock</label>
                  <input
                    type="number"
                    value={prepStock}
                    onChange={(e) => setPrepStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground mb-1 block">Unit</label>
                  <select
                    value={prepUnit}
                    onChange={(e) => setPrepUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-foreground mb-1 block">Min Alert</label>
                  <input
                    type="number"
                    value={prepMinAlert}
                    onChange={(e) => setPrepMinAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrepModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-all active:scale-95"
                >
                  ✕ Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all"
                >
                  {submitting ? "Saving..." : "Save Prep Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Raw Ingredient Modal */}
      {showRawModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowRawModal(false); }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
        >
          <div className="bg-card border border-border w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-xs my-auto cursor-default">
            <div className="flex items-center justify-between border-b border-border/50 pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Layer size={20} className="text-zinc-800 dark:text-zinc-200 shrink-0" variant="Bold" />
                <h3 className="font-black text-base sm:text-lg text-foreground truncate">Add Raw Material / Packaging</h3>
              </div>
              <button 
                onClick={() => setShowRawModal(false)} 
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs flex items-center gap-1.5 border border-border transition-all active:scale-95 shrink-0"
                title="Close"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            <form onSubmit={handleSaveRawIngredient} className="space-y-3">
              <div>
                <label className="font-bold text-foreground mb-1 block">Material Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amul Fresh Cream 1L, Maida Flour, 1/2kg Cake Boxes"
                  value={rawName}
                  onChange={(e) => setRawName(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground mb-1 block">Category</label>
                  <select
                    value={rawCategory}
                    onChange={(e) => setRawCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                  >
                    <option value="Dairy">Dairy</option>
                    <option value="Flour">Flour / Grains</option>
                    <option value="Chocolate">Chocolate / Cocoa</option>
                    <option value="Sweetener">Sugar / Sweetener</option>
                    <option value="Packaging">Boxes / Packaging</option>
                    <option value="Fondant">Fondant / Colors</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-foreground mb-1 block">Unit</label>
                  <select
                    value={rawUnitVal}
                    onChange={(e) => setRawUnitVal(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                  >
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="boxes">boxes</option>
                    <option value="units">units</option>
                  </select>
                </div>
              </div>

              {/* Best Before */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-secondary/30 border border-border">
                <label className="font-bold text-foreground text-xs flex items-center gap-1.5">
                  <Calendar size={14} className="text-zinc-700 dark:text-zinc-300" />
                  <span>Expiry / Best Before Date</span>
                </label>
                <input
                  type="date"
                  value={rawBestBefore}
                  onChange={(e) => setRawBestBefore(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-bold text-foreground mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-foreground mb-1 block">Stock</label>
                  <input
                    type="number"
                    value={rawStockVal}
                    onChange={(e) => setRawStockVal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground mb-1 block">Min Alert</label>
                  <input
                    type="number"
                    value={rawMinAlertVal}
                    onChange={(e) => setRawMinAlertVal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground mb-1 block">Cost / Unit (₹)</label>
                  <input
                    type="number"
                    value={rawCostVal}
                    onChange={(e) => setRawCostVal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowRawModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-all active:scale-95"
                >
                  ✕ Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white font-bold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all"
                >
                  {submitting ? "Saving..." : "Save Raw Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: UNIVERSAL EDIT / MODIFY ENTRY MODAL */}
      {editTarget && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setEditTarget(null); }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
        >
          <div className="bg-card border border-border w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-xs my-auto cursor-default">
            <div className="flex items-center justify-between border-b border-border/50 pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Edit2 size={20} className="text-[var(--brand-deep-rose)] shrink-0" variant="Bold" />
                <div className="min-w-0">
                  <h3 className="font-black text-base sm:text-lg text-foreground truncate">Modify Inventory Entry</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider truncate">
                    {editTarget.type === "BATCH" ? "Batch Settings" : editTarget.type === "UNIT" ? "Individual Cake Unit" : editTarget.type}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditTarget(null)} 
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs flex items-center gap-1.5 border border-border transition-all active:scale-95 shrink-0"
                title="Close"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="font-bold text-foreground mb-1 block">Title / Name</label>
                <input
                  type="text"
                  value={editTarget.title}
                  onChange={(e) => setEditTarget({ ...editTarget, title: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                  required
                />
              </div>

              {editTarget.qty !== undefined && (
                <div>
                  <label className="font-bold text-foreground mb-1 block">
                    Quantity / Stock ({editTarget.unit || "Units / Pieces"})
                  </label>
                  <input
                    type="number"
                    value={editTarget.qty}
                    onChange={(e) => setEditTarget({ ...editTarget, qty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                    required
                  />
                </div>
              )}

              {editTarget.price !== undefined && (
                <div>
                  <label className="font-bold text-foreground mb-1 block">Price / Cost (₹)</label>
                  <input
                    type="number"
                    value={editTarget.price}
                    onChange={(e) => setEditTarget({ ...editTarget, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                    required
                  />
                </div>
              )}

              {editTarget.flavor !== undefined && (
                <div>
                  <label className="font-bold text-foreground mb-1 block">Flavor</label>
                  <input
                    type="text"
                    value={editTarget.flavor || ""}
                    onChange={(e) => setEditTarget({ ...editTarget, flavor: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground"
                  />
                </div>
              )}

              {/* Status Selector (for Units and Brownie Trays) */}
              {editTarget.status !== undefined && (
                <div>
                  <label className="font-bold text-foreground mb-1 block">Inventory Status</label>
                  <select
                    value={editTarget.status}
                    onChange={(e) => setEditTarget({ ...editTarget, status: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                  >
                    <option value="IN_STOCK">IN_STOCK (Ready for Sale)</option>
                    <option value="EXPIRED">EXPIRED (Sale Blocked)</option>
                    <option value="DAMAGED">DAMAGED (Write-off)</option>
                    <option value="SOLD">SOLD</option>
                  </select>
                </div>
              )}

              {/* Best Before Date */}
              <div>
                <label className="font-bold text-foreground mb-1 block flex items-center gap-1.5">
                  <Calendar size={14} className="text-[var(--brand-deep-rose)]" />
                  <span>Best Before / Expiry Date</span>
                </label>
                <input
                  type="date"
                  value={editTarget.bestBeforeDate || ""}
                  onChange={(e) => setEditTarget({ ...editTarget, bestBeforeDate: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-bold"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Items past this date will be blocked from sales at POS.
                </span>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-all active:scale-95"
                >
                  ✕ Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/90 text-white font-bold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: Thermal Barcode Label Printing Preview Modal */}
      {printUnits && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setPrintUnits(null); }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
        >
          <div className="bg-card border border-border w-full max-w-4xl rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[95vh] overflow-y-auto cursor-default">
            <div className="flex items-center justify-between border-b border-border/50 pb-3 gap-2">
              <div className="min-w-0">
                <h3 className="font-black text-base sm:text-lg text-foreground flex items-center gap-2 truncate">
                  <Printer size={22} className="text-[var(--brand-deep-rose)] shrink-0" />
                  <span>Direct Thermal Label Printing Preview</span>
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  Ready for direct thermal label rolls (50mm × 25mm stickers). Click Print to send to barcode printer.
                </p>
              </div>
              <button 
                onClick={() => setPrintUnits(null)} 
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs flex items-center gap-1.5 border border-border transition-all active:scale-95 shrink-0"
                title="Close"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-2 border border-border/50 rounded-2xl bg-secondary/10">
              {printUnits.map((u) => (
                <div
                  key={u.id}
                  className="p-3 bg-white text-zinc-900 border border-zinc-300 rounded-xl shadow-xs flex flex-col justify-between items-center text-center w-full"
                  style={{ minHeight: "150px" }}
                >
                  <div className="w-full">
                    <p className="font-black text-xs uppercase tracking-wider leading-tight">GOPAL CAKE SHOP</p>
                    <p className="font-bold text-[11px] truncate mt-0.5">{u.itemTitle}</p>
                    <p className="text-[9px] text-zinc-600">
                      {u.variantWeight} {u.flavor ? `· ${u.flavor}` : ""} · ₹{u.sellingPrice}
                    </p>
                    {u.bestBeforeDate && (
                      <p className="text-[9px] font-bold text-zinc-700 mt-0.5">
                        BB: {formatDateShort(u.bestBeforeDate)}
                      </p>
                    )}
                  </div>
                  <div className="my-1 w-full flex justify-center">
                    <svg id={`barcode-${u.id}`} className="max-w-full h-auto"></svg>
                  </div>
                  <p className="text-[8px] text-zinc-500 font-mono">100% EGGLESS · VADODARA</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-3">
              <button
                onClick={() => setPrintUnits(null)}
                className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-all active:scale-95"
              >
                ✕ Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-xl bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/90 text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 active:scale-95 transition-all"
              >
                <Printer size={16} />
                <span>Print All {printUnits.length} Stickers</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: Quick Mark Damaged / Spoilage with Reason Tag */}
      {damageTarget && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setDamageTarget(null); }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
        >
          <div className="bg-card border border-border w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto cursor-default">
            <div className="flex items-center justify-between border-b border-border/50 pb-3 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl shrink-0">
                  <Danger size={20} variant="Bold" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-base text-foreground truncate">Mark Item as Damaged</h3>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">{damageTarget.barcode}</p>
                </div>
              </div>
              <button 
                onClick={() => setDamageTarget(null)} 
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs flex items-center gap-1.5 border border-border transition-all active:scale-95 shrink-0"
                title="Close"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            <form onSubmit={handleMarkDamaged} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-secondary/30 border border-border/50">
                <p className="font-bold text-foreground">{damageTarget.itemTitle}</p>
                <p className="text-muted-foreground text-[11px]">{damageTarget.variantWeight} · {damageTarget.flavor || "Standard"} · MRP ₹{damageTarget.sellingPrice}</p>
              </div>

              <div>
                <label className="font-bold text-foreground mb-2 block uppercase text-[10px] tracking-wider">
                  Select Wastage / Spoilage Reason:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: "🚚 Transit / Road damage", val: "Transit / Road damage" },
                    { label: "☀️ Melting / Chiller issue", val: "Melting / Chiller issue" },
                    { label: "💥 Dropped by staff", val: "Dropped by staff" },
                    { label: "⏰ Unsold expired", val: "Unsold expired" },
                    { label: "🧪 Baking / Quality defect", val: "Baking / Quality defect" },
                    { label: "📝 Other (Custom note)", val: "Other" }
                  ].map((r) => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setSelectedDamageReason(r.val)}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all flex items-center justify-between ${
                        selectedDamageReason === r.val
                          ? "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400 shadow-xs"
                          : "bg-secondary/20 border-border/60 hover:bg-secondary/40 text-muted-foreground"
                      }`}
                    >
                      <span>{r.label}</span>
                      {selectedDamageReason === r.val && <TickCircle size={14} className="text-rose-600" variant="Bold" />}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDamageReason === "Other" && (
                <div>
                  <label className="font-bold text-foreground mb-1 block">Specify Reason Details</label>
                  <input
                    type="text"
                    value={customDamageNote}
                    onChange={(e) => setCustomDamageNote(e.target.value)}
                    placeholder="e.g. Customer return, packaging tear..."
                    className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground font-semibold"
                    required
                  />
                </div>
              )}

              <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDamageTarget(null)}
                  className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-all active:scale-95"
                >
                  ✕ Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all"
                >
                  {submitting ? "Logging..." : "Confirm Damaged"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9: Wastage & Spoilage Breakdown Analytics (Feature 4) */}
      {showWastageModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowWastageModal(false); }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
        >
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto cursor-default">
            <div className="flex items-center justify-between border-b border-border/50 pb-3 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl shrink-0">
                  <Danger size={22} variant="Bold" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-base sm:text-lg text-foreground truncate">Wastage & Spoilage Analysis</h3>
                  <p className="text-xs text-muted-foreground truncate">Loss root-cause analysis for {dateFilter.replace('_', ' ').toLowerCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWastageModal(false)} 
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs flex items-center gap-1.5 border border-border transition-all active:scale-95 shrink-0"
                title="Close"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            {/* Total Loss Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <p className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Total Loss Units</p>
                <p className="text-2xl font-black text-rose-600 mt-1">{stats.totalDamaged + stats.totalExpired} units</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{stats.totalDamaged} damaged · {stats.totalExpired} expired</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Estimated Value Lost</p>
                <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">₹{stats.totalWastageLoss.toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Based on counter MRP</p>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2.5 pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Reasons Breakdown:</p>
              {wastageBreakdown.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground font-medium text-xs bg-secondary/20 rounded-2xl border border-dashed border-border">
                  🎉 Excellent! No damaged or expired items recorded for this filter.
                </div>
              ) : (
                wastageBreakdown.map((wb) => (
                  <div key={wb.reason} className="p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-foreground">{wb.reason}</span>
                      <span className="text-rose-600 font-black">{wb.count} items ({wb.percentage}%)</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${wb.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                      <span>Loss impact</span>
                      <span className="font-bold text-foreground">₹{wb.lossAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-border/50 flex justify-end">
              <button
                onClick={() => setShowWastageModal(false)}
                className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs uppercase tracking-wider border border-border transition-all active:scale-95"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 10: End-of-Day (EOD) Closing & Store Reconciliation Wizard (Feature 1) */}
      {showEODWizard && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowEODWizard(false); }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
        >
          <div className="bg-card border border-border w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto cursor-default">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3 gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-amber-400/40 text-amber-300 flex items-center justify-center font-black text-xl shadow-sm shrink-0">
                  🌙
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-base sm:text-lg text-foreground truncate">EOD Store Closing Wizard</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                    Reconcile counter leftovers, verify cake displays & close cash shift
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowEODWizard(false)} 
                className="w-9 h-9 rounded-full bg-secondary hover:bg-rose-500/20 hover:text-rose-600 text-foreground font-black text-base flex items-center justify-center border border-border transition-all active:scale-95 shadow-xs shrink-0"
                title="Close Wizard (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Success Summary View */}
            {eodSuccessSummary ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <TickCircle size={36} variant="Bold" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-foreground">Day Shift Successfully Closed!</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Store batches are locked, leftover dispositions saved, and register totals reconciled.
                  </p>
                </div>

                <div className="p-4 bg-secondary/30 rounded-2xl border border-border/60 text-left text-xs font-mono space-y-2 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Closed At:</span>
                    <span className="font-bold text-foreground">{new Date(eodSuccessSummary.closedAt).toLocaleTimeString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processed Batches:</span>
                    <span className="font-bold text-foreground">{eodSuccessSummary.processedBatchesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Physical Cash Count:</span>
                    <span className="font-bold text-emerald-600">₹{eodPhysicalCash}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowEODWizard(false)}
                  className="px-6 py-2.5 rounded-2xl bg-[var(--brand-deep-rose)] text-white font-bold text-xs uppercase tracking-wider shadow-lg"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* 3 Step Indicator (Responsive for mobile) */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 border-b border-border/40 pb-3">
                  <button
                    type="button"
                    onClick={() => setEodStep(1)}
                    className={`py-2 px-2 sm:px-3 rounded-xl text-center sm:text-left text-xs font-bold transition-all ${
                      eodStep === 1
                        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                        : "text-muted-foreground"
                    }`}
                  >
                    1. Hot Bakes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEodStep(2)}
                    className={`py-2 px-2 sm:px-3 rounded-xl text-center sm:text-left text-xs font-bold transition-all ${
                      eodStep === 2
                        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                        : "text-muted-foreground"
                    }`}
                  >
                    2. Chiller Cakes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEodStep(3)}
                    className={`py-2 px-2 sm:px-3 rounded-xl text-center sm:text-left text-xs font-bold transition-all ${
                      eodStep === 3
                        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                        : "text-muted-foreground"
                    }`}
                  >
                    3. Cash Drawer
                  </button>
                </div>

                {/* STEP 1: Hot Bakes Leftovers Disposition */}
                {eodStep === 1 && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <p className="font-bold text-foreground text-sm">Review Hot Bakes & Puffs Leftover</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        Choose what happens to unsold puffs at 10:30 PM counter close:
                      </p>
                    </div>

                    {batches.filter(b => !b.isBarcodeTracked && b.closingQty > 0).length === 0 ? (
                      <div className="p-6 bg-secondary/20 rounded-2xl border border-dashed border-border text-center text-muted-foreground">
                        ✓ No active hot bakes batches with leftover items tonight.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                        {batches.filter(b => !b.isBarcodeTracked && b.closingQty > 0).map((batch) => {
                          const currentDisp = eodDispositions[batch.id]?.action || "DISCARD";
                          return (
                            <div key={batch.id} className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-foreground text-sm">{batch.title}</span>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-extrabold text-[11px]">
                                  {batch.closingQty} pcs Leftover
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 pt-1">
                                {[
                                  { action: "DISCARD", label: "🗑️ Discard / Spoil", desc: "Mark as wastage" },
                                  { action: "STAFF_MEAL", label: "🍽️ Staff Meal", desc: "Consumed by staff" },
                                  { action: "ROLLOVER", label: "🔄 Roll Over", desc: "Carry to tomorrow" }
                                ].map((opt) => (
                                  <button
                                    key={opt.action}
                                    type="button"
                                    onClick={() => setEodDispositions({
                                      ...eodDispositions,
                                      [batch.id]: {
                                        action: opt.action as any,
                                        reason: opt.action === "STAFF_MEAL" ? "Staff Consumed" : opt.action === "DISCARD" ? "Unsold expired at close" : "Rolled over"
                                      }
                                    })}
                                    className={`p-2 rounded-xl border text-center transition-all ${
                                      currentDisp === opt.action
                                        ? "bg-amber-600 text-white border-amber-600 font-black shadow-xs"
                                        : "bg-secondary/40 border-border/60 text-muted-foreground hover:bg-secondary/60 font-semibold"
                                    }`}
                                  >
                                    <div className="text-[11px]">{opt.label}</div>
                                    <div className="text-[9px] opacity-80 mt-0.5">{opt.desc}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Step 1 Footer with prominent Cancel & Next buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <button
                        type="button"
                        onClick={() => setShowEODWizard(false)}
                        className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs flex items-center gap-1.5 border border-border transition-all active:scale-95"
                      >
                        <span>✕ Cancel & Close</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEodStep(2)}
                        className="px-5 sm:px-6 py-2.5 rounded-xl bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/90 text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all"
                      >
                        Next: Verify Chiller Cakes →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Chiller Cakes Review */}
                {eodStep === 2 && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <p className="font-bold text-foreground text-sm">Display Chiller Counter Status</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        Verify today's cake movements and display count before locking store:
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-secondary/30 border border-border/60 text-center">
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase">Inwarded</p>
                        <p className="text-lg sm:text-xl font-black text-emerald-600 mt-1">{stats.todayStock}</p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-secondary/30 border border-border/60 text-center">
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase">Sold POS</p>
                        <p className="text-lg sm:text-xl font-black text-indigo-600 mt-1">{stats.totalSoldToday}</p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-secondary/30 border border-border/60 text-center">
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase">In Chiller</p>
                        <p className="text-lg sm:text-xl font-black text-foreground mt-1">{stats.totalInStock}</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                      <TickCircle size={18} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Chiller display count verified</p>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          Remaining display cakes have active Best Before tags and will roll over to tomorrow morning's counter.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 Footer with Back, Cancel, and Next buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEodStep(1)}
                          className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs flex items-center gap-1 border border-border transition-all active:scale-95"
                        >
                          <span>← Back</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEODWizard(false)}
                          className="px-3 py-2.5 text-muted-foreground hover:text-foreground font-semibold text-xs transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEodStep(3)}
                        className="px-5 sm:px-6 py-2.5 rounded-xl bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/90 text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all"
                      >
                        Next: Cash Drawer →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Cash Reconciliation & Register Count */}
                {eodStep === 3 && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <p className="font-bold text-foreground text-sm">Counter Cash Reconciliation</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        Count physical cash notes in the drawer and match against today's sales:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-foreground mb-1 block">Physical Cash Counted (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={eodPhysicalCash || ""}
                          onChange={(e) => setEodPhysicalCash(Number(e.target.value) || 0)}
                          placeholder="e.g. 12500"
                          className="w-full px-3 py-2.5 bg-secondary/40 border border-border rounded-xl text-lg font-black text-foreground"
                          required
                        />
                      </div>

                      {canFinancials ? (
                        <div>
                          <label className="font-bold text-foreground mb-1 block">Estimated System Sales (₹)</label>
                          <div className="w-full px-3 py-2.5 bg-secondary/20 border border-border/50 rounded-xl text-lg font-black text-muted-foreground">
                            ₹{revenueStats ? revenueStats.totalRevenue : (stats.totalSoldToday * 450)}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="font-bold text-foreground mb-1 block">Units Sold Today</label>
                          <div className="w-full px-3 py-2.5 bg-secondary/20 border border-border/50 rounded-xl text-lg font-black text-muted-foreground">
                            {stats.totalSoldToday} items scanned
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Variance Pill (Confidential / Granted Users Only) */}
                    {canFinancials && eodPhysicalCash > 0 && (
                      <div className="p-3 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between">
                        <span className="font-bold text-muted-foreground">Cash Variance (Physical vs System):</span>
                        <span className={`px-2 py-0.5 rounded font-black text-xs ${
                          eodPhysicalCash >= (revenueStats?.totalRevenue || 0)
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}>
                          {eodPhysicalCash - (revenueStats?.totalRevenue || (stats.totalSoldToday * 450)) >= 0 ? "+" : ""}
                          ₹{eodPhysicalCash - (revenueStats?.totalRevenue || (stats.totalSoldToday * 450))}
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="font-bold text-foreground mb-1 block">Closing Comments / Shift Notes</label>
                      <textarea
                        value={eodClosingNotes}
                        onChange={(e) => setEodClosingNotes(e.target.value)}
                        placeholder="e.g. All counters wiped down, chiller temp 4°C, cash handed to safe..."
                        rows={2}
                        className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-xl text-foreground text-xs"
                      />
                    </div>

                    {/* Step 3 Footer with Back, Cancel, and Final Confirm buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEodStep(2)}
                          className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs flex items-center gap-1 border border-border transition-all active:scale-95"
                        >
                          <span>← Back</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEODWizard(false)}
                          className="px-3 py-2.5 text-muted-foreground hover:text-foreground font-semibold text-xs transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={eodSubmitting}
                        onClick={handleCloseEOD}
                        className="px-5 sm:px-7 py-3 rounded-2xl bg-zinc-900 hover:bg-black text-amber-300 font-black text-xs uppercase tracking-wider shadow-xl border border-amber-400/40 active:scale-95 transition-all"
                      >
                        {eodSubmitting ? "Closing Shift..." : "🌙 Confirm & Close Shift"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {/* MODAL 11: Monthly CA Tax & Audit Report Modal (Rishi Bhai / Granted Staff) */}
      {canCaReport && showMonthlyReportModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowMonthlyReportModal(false); }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
        >
          <div className="bg-card border border-border w-full max-w-3xl rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto cursor-default">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3 gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                  <ArchiveBook size={20} variant="Bold" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-base sm:text-lg text-foreground truncate">
                    Monthly Financial & Tax Statement for CA
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                    Official turnover, GST split, goods inward, spoilage write-offs & inventory asset valuation
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowMonthlyReportModal(false)} 
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs flex items-center gap-1.5 border border-border transition-all active:scale-95 shrink-0"
                title="Close Statement"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            {/* Period Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-secondary/30 rounded-2xl border border-border/50 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-muted-foreground uppercase text-[10px]">Select Period:</span>
                <select
                  value={reportMonth}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setReportMonth(m);
                    fetchMonthlyReport(m, reportYear);
                  }}
                  className="px-2.5 py-1.5 bg-card border border-border rounded-xl font-bold text-foreground"
                >
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((mName, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {mName}
                    </option>
                  ))}
                </select>

                <select
                  value={reportYear}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setReportYear(y);
                    fetchMonthlyReport(reportMonth, y);
                  }}
                  className="px-2.5 py-1.5 bg-card border border-border rounded-xl font-bold text-foreground"
                >
                  {[2025, 2026, 2027].map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadReportCsv}
                  disabled={!monthlyReportData}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span>📥 Download CSV (Tally / Marg)</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={!monthlyReportData}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Printer size={14} />
                  <span>Print Statement</span>
                </button>
              </div>
            </div>

            {/* Loading Indicator */}
            {reportLoading ? (
              <div className="p-12 text-center text-muted-foreground animate-pulse font-medium text-xs">
                Generating comprehensive monthly tax & audit statement for CA...
              </div>
            ) : monthlyReportData ? (
              <div id="ca-report-print-container" className="space-y-4 text-xs font-sans">
                {/* Official Statement Card */}
                <div className="p-5 bg-white text-zinc-900 border border-zinc-300 rounded-2xl shadow-sm space-y-4">
                  {/* Brand & Letterhead Header */}
                  <div className="border-b border-zinc-200 pb-3 flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-black font-serif text-[#3E2723] uppercase tracking-wide">
                        GOPAL CAKE SHOP
                      </h4>
                      <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
                        Crafting Sweet Moments Since 1990
                      </p>
                      <p className="text-[11px] text-zinc-600 mt-1">
                        Vadodara, Gujarat · GSTIN: <span className="font-mono font-bold text-zinc-900">24AAAFG0000A1Z2</span>
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        State: Gujarat (State Code: 24) · Business: Bakery & Confectionery Manufacturing & Retail
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 font-black text-xs uppercase tracking-wider block">
                        Monthly CA Statement
                      </span>
                      <p className="font-bold text-sm text-zinc-800 mt-1">
                        {monthlyReportData.period.monthName} {monthlyReportData.period.year}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Branch: {monthlyReportData.period.branch?.name || "All Branches"}
                      </p>
                    </div>
                  </div>

                  {/* Section 1: Turnover & GST Taxable Sales */}
                  <div className="space-y-2">
                    <p className="font-black text-xs uppercase tracking-wider text-zinc-800 border-b pb-1">
                      1. Sales Turnover & GST Breakdown (Output Liability)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                      <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                        <span className="text-[9px] text-zinc-500 block uppercase font-bold">Gross MRP Turnover</span>
                        <span className="font-black text-sm text-zinc-900">
                          ₹{monthlyReportData.salesTurnover.grossSales.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                        <span className="text-[9px] text-zinc-500 block uppercase font-bold">Discounts Conceded</span>
                        <span className="font-black text-sm text-amber-700">
                          -₹{monthlyReportData.salesTurnover.discountsConceded.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                        <span className="text-[9px] text-zinc-500 block uppercase font-bold">Net Invoiced Receipts</span>
                        <span className="font-black text-sm text-emerald-700">
                          ₹{monthlyReportData.salesTurnover.totalNetInvoiced.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-200">
                        <span className="text-[9px] text-indigo-700 block uppercase font-bold">Taxable Turnover</span>
                        <span className="font-black text-sm text-indigo-900">
                          ₹{monthlyReportData.salesTurnover.netTaxableSales.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* GST Split Box */}
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                      <span className="font-bold text-zinc-700">Applicable GST Rate: 5% (Composite/Retail)</span>
                      <div className="flex items-center gap-4">
                        <span>CGST (2.5%): <strong>₹{monthlyReportData.salesTurnover.cgstAmount.toFixed(2)}</strong></span>
                        <span>SGST (2.5%): <strong>₹{monthlyReportData.salesTurnover.sgstAmount.toFixed(2)}</strong></span>
                        <span className="font-black text-indigo-900 bg-white px-2 py-0.5 rounded border">
                          Total Tax: ₹{monthlyReportData.salesTurnover.estimatedGstAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Goods Inward & Stock Receipts */}
                  <div className="space-y-2">
                    <p className="font-black text-xs uppercase tracking-wider text-zinc-800 border-b pb-1">
                      2. Stock Inward Receipts (From Central Kitchen / Warasiya Factory)
                    </p>
                    <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                      <div className="p-2 bg-zinc-50 rounded-xl border border-zinc-200">
                        <span className="text-[9px] text-zinc-500 block uppercase font-bold">Total Inward Batches</span>
                        <span className="font-bold text-zinc-900">{monthlyReportData.stockInward.totalBatches} batches</span>
                      </div>
                      <div className="p-2 bg-zinc-50 rounded-xl border border-zinc-200">
                        <span className="text-[9px] text-zinc-500 block uppercase font-bold">Total Units Inwarded</span>
                        <span className="font-bold text-emerald-700">{monthlyReportData.stockInward.totalUnitsReceived} units</span>
                      </div>
                      <div className="p-2 bg-zinc-50 rounded-xl border border-zinc-200">
                        <span className="text-[9px] text-zinc-500 block uppercase font-bold">Inward Stock Valuation</span>
                        <span className="font-bold text-zinc-900">₹{monthlyReportData.stockInward.inwardAssetValuation.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Wastage & Spoilage Write-Off Statement */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b pb-1">
                      <p className="font-black text-xs uppercase tracking-wider text-zinc-800">
                        3. Spoilage & Wastage Write-Offs (Sec 17(5)(h) CGST Input Tax Reversal Info)
                      </p>
                      <span className="font-bold text-rose-700 font-mono text-xs">
                        Total Write-off: ₹{monthlyReportData.spoilageWriteOff.totalLossAmount.toFixed(2)} ({monthlyReportData.spoilageWriteOff.totalUnitsWrittenOff} pcs)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                      {monthlyReportData.spoilageWriteOff.reasonBreakdown.length === 0 ? (
                        <p className="text-zinc-500 italic p-2">No wastage write-offs recorded in this period.</p>
                      ) : (
                        monthlyReportData.spoilageWriteOff.reasonBreakdown.map((r: any) => (
                          <div key={r.reason} className="p-2 bg-rose-50/60 rounded-xl border border-rose-200 flex justify-between">
                            <span className="font-bold text-zinc-800">{r.reason} ({r.count} pcs):</span>
                            <span className="font-black text-rose-700">₹{r.lossAmount.toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Section 4: Month-End Inventory Asset Valuation */}
                  <div className="space-y-2">
                    <p className="font-black text-xs uppercase tracking-wider text-zinc-800 border-b pb-1">
                      4. Month-End Closing Inventory Asset Valuation (Balance Sheet Asset)
                    </p>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between font-mono text-xs">
                      <div>
                        <span className="font-bold text-zinc-800 block">Active Counter Inventory Units:</span>
                        <span className="text-[11px] text-zinc-600">{monthlyReportData.monthEndInventoryValuation.activeUnitsCount} units on display</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-zinc-500 uppercase block font-bold">Closing Inventory Value</span>
                        <span className="font-black text-base text-amber-900">
                          ₹{monthlyReportData.monthEndInventoryValuation.inventoryAssetValuation.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Certification & Sign-off Block */}
                  <div className="border-t-2 border-dashed border-zinc-300 pt-4 mt-6 grid grid-cols-2 gap-6 text-[11px]">
                    <div>
                      <p className="font-bold text-zinc-800">Prepared & Certified By:</p>
                      <p className="text-zinc-600 mt-1">Gopal Cake Shop Retail Administration</p>
                      <p className="text-[9px] text-zinc-400 mt-0.5 font-mono">Date: {new Date().toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-zinc-800">Chartered Accountant Verification:</p>
                      <div className="h-10 border-b border-dashed border-zinc-400 my-2"></div>
                      <p className="text-[9px] text-zinc-500">CA Signature, Stamp & Membership No.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pt-3 border-t border-border/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMonthlyReportModal(false)}
                className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs uppercase tracking-wider border border-border transition-all active:scale-95"
              >
                ✕ Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
