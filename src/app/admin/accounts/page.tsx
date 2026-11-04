"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Wallet,
  Receipt21,
  Add,
  ArrowSwapHorizontal,
  SearchNormal1,
  Shop,
  Profile2User,
  Card,
  MoneyRecive,
  MoneySend,
  Printer,
  Share,
  Trash,
  Edit,
  InfoCircle,
  TickCircle,
  Danger,
  CloseCircle,
  DocumentDownload,
  DirectboxSend,
  ArrowRight2,
  FilterSearch,
  MessageQuestion,
  Refresh,
  Box,
  TruckFast,
} from "iconsax-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, parseISO, subDays, addDays, subMonths, addMonths } from "date-fns";
import { BackButton } from "@/components/ui/BackButton";
import { NotificationToast, ToastVariant } from "@/components/ui/NotificationToast";
import {
  Receipt as LucideReceipt,
  Wallet as LucideWallet,
  TrendingUp,
  TrendingDown,
  Store as LucideStore,
  Calendar as LucideCalendar,
  CreditCard as LucideCard,
  Trash2,
  RefreshCw,
} from "lucide-react";

type Retailer = {
  id: string;
  name: string;
  shopName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  partyType: "VENDOR" | "RETAILER";
  category: string;
  openingBalance: number;
  currentBalance: number;
  creditLimit: number | null;
  notes: string;
  isActive: boolean;
  entriesCount: number;
  lastTransaction?: { date: string; type: string; amount: number } | null;
};

type LogEntry = {
  id: string;
  date: string;
  type: "BILLING" | "PAYMENT" | "RETURN" | "ADJUSTMENT";
  amount: number;
  paymentMethod: string;
  referenceNo: string | null;
  description: string | null;
  balanceAfter: number | null;
  retailer: {
    id: string;
    name: string;
    shopName: string | null;
    phone: string | null;
    currentBalance: number;
    partyType: "VENDOR" | "RETAILER";
    category: string;
  };
  createdBy: string;
};

type LogbookResponse = {
  view: string;
  range: { startDate: string; endDate: string };
  summary: {
    totalBilled: number;
    totalPaid: number;
    totalReturns: number;
    totalAdjustments: number;
    netCashflow: number;
    netReceivableGrowth: number;
    totalPayableToVendors: number;
    totalReceivableFromRetailers: number;
    vendorCount: number;
    retailerCount: number;
    entriesCount: number;
    paymentMethodBreakdown: Record<string, number>;
  };
  trends: { date: string; billed: number; paid: number; count: number }[];
  retailerSummaries: {
    id: string;
    name: string;
    shopName: string | null;
    phone: string | null;
    partyType: "VENDOR" | "RETAILER";
    category: string;
    openingBalance: number;
    billed: number;
    paid: number;
    returns: number;
    closingBalance: number;
    hasActivity: boolean;
  }[];
  entries: LogEntry[];
};

const SUPPLIER_CATEGORIES = [
  "Dairy & Fresh Cream (Amul, etc.)",
  "Flour, Sugar & Dry Ingredients",
  "Chocolates, Compounds & Truffles (Callebaut, Morde)",
  "Cake Boxes, Pastry Boxes & Packaging",
  "Fruit Crushes, Glazes & Purees",
  "Essences, Food Colors & Sprinkles",
  "Bakery Equipment & Consumables",
  "Other Raw Material",
];

const RETAILER_CATEGORIES = [
  "Retail Store / Branch Outlet",
  "Wholesale Client",
  "Cafe & Coffee Shop",
  "Franchise Counter",
  "Event / Catering Partner",
];

export default function AdminAccountsPage() {
  // Mode: VENDOR (Suppliers we buy raw materials from & pay them) vs RETAILER (Clients who buy from us & pay us) vs ALL
  const [accountType, setAccountType] = useState<"VENDOR" | "RETAILER" | "ALL">("VENDOR");

  // Navigation & View Tabs
  const [activeTab, setActiveTab] = useState<"daily" | "monthly" | "passbook" | "retailers">("daily");

  // Date controls
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));

  // Filters
  const [retailerFilter, setRetailerFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Passbook drilldown target
  const [passbookRetailerId, setPassbookRetailerId] = useState<string>("");

  // Data State
  const [logbookData, setLogbookData] = useState<LogbookResponse | null>(null);
  const [retailersList, setRetailersList] = useState<Retailer[]>([]);
  const [passbookData, setPassbookData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Toast State
  const [toast, setToast] = useState<{ id: string; title: string; message: string; variant: ToastVariant } | null>(null);

  // Modals
  const [showAddEntryModal, setShowAddEntryModal] = useState<boolean>(false);
  const [showRetailerModal, setShowRetailerModal] = useState<boolean>(false);
  const [editingRetailer, setEditingRetailer] = useState<Retailer | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [whatsAppText, setWhatsAppText] = useState<string>("");
  const [whatsAppPhone, setWhatsAppPhone] = useState<string>("");
  const [retailerModalError, setRetailerModalError] = useState<string | null>(null);

  // Form State for Log Entry
  const [entryForm, setEntryForm] = useState({
    retailerId: "",
    newRetailerName: "",
    newRetailerShop: "",
    newRetailerPhone: "",
    newRetailerCategory: "Dairy & Fresh Cream (Amul, etc.)",
    isNewRetailer: false,
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    type: "BILLING" as "BILLING" | "PAYMENT" | "RETURN" | "ADJUSTMENT",
    amount: "",
    paymentMethod: "CASH",
    referenceNo: "",
    description: "",
  });
  const [submittingEntry, setSubmittingEntry] = useState<boolean>(false);

  // Form State for Retailer / Supplier
  const [retailerForm, setRetailerForm] = useState({
    name: "",
    shopName: "",
    phone: "",
    email: "",
    address: "",
    city: "Surat",
    partyType: "VENDOR" as "VENDOR" | "RETAILER",
    category: "Dairy & Fresh Cream (Amul, etc.)",
    openingBalance: "0",
    creditLimit: "",
    notes: "",
  });
  const [submittingRetailer, setSubmittingRetailer] = useState<boolean>(false);

  // Fetch Retailers / Suppliers
  const fetchRetailers = async () => {
    try {
      const url = accountType === "ALL"
        ? "/api/v1/admin/accounts/retailers"
        : `/api/v1/admin/accounts/retailers?partyType=${accountType}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setRetailersList(json.data);
        if (json.data.length > 0) {
          const found = json.data.some((r: any) => r.id === passbookRetailerId);
          if (!found) setPassbookRetailerId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load accounts list", err);
    }
  };

  // Fetch Logbook (Daily or Monthly)
  const fetchLogbook = async () => {
    setLoading(true);
    try {
      let url = `/api/v1/admin/accounts/logbook?view=${activeTab === "monthly" ? "monthly" : "daily"}`;
      if (activeTab === "monthly") {
        url += `&month=${selectedMonth}`;
      } else {
        url += `&date=${selectedDate}`;
      }
      if (accountType !== "ALL") {
        url += `&partyType=${accountType}`;
      }
      if (retailerFilter !== "all") url += `&retailerId=${retailerFilter}`;
      if (typeFilter !== "all") url += `&type=${typeFilter}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setLogbookData(json.data);
      }
    } catch (err) {
      console.error("Failed to load logbook", err);
      setToast({
        id: Date.now().toString(),
        title: "Network Error",
        message: "Could not fetch logbook records",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Passbook Data for Selected Retailer/Supplier
  const fetchPassbook = async (retId: string) => {
    if (!retId) return;
    try {
      const res = await fetch(`/api/v1/admin/accounts/retailers/${retId}`);
      const json = await res.json();
      if (json.success) {
        setPassbookData(json.data);
      }
    } catch (err) {
      console.error("Failed to load passbook", err);
    }
  };

  // Initial and reactive load
  useEffect(() => {
    fetchRetailers();
  }, [accountType]);

  useEffect(() => {
    if (activeTab === "daily" || activeTab === "monthly") {
      fetchLogbook();
    } else if (activeTab === "passbook" && passbookRetailerId) {
      fetchPassbook(passbookRetailerId);
    }
  }, [activeTab, accountType, selectedDate, selectedMonth, retailerFilter, typeFilter, passbookRetailerId]);

  // Handle Log Entry Creation
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryForm.amount || Number(entryForm.amount) <= 0) {
      setToast({
        id: Date.now().toString(),
        title: "Invalid Amount",
        message: "Please enter a valid amount",
        variant: "warning",
      });
      return;
    }

    if (!entryForm.isNewRetailer && !entryForm.retailerId) {
      setToast({
        id: Date.now().toString(),
        title: "Account Required",
        message: `Please select an existing ${accountType === "VENDOR" ? "Supplier" : "Retailer"}`,
        variant: "warning",
      });
      return;
    }

    if (entryForm.isNewRetailer && !entryForm.newRetailerName.trim()) {
      setToast({
        id: Date.now().toString(),
        title: "Name Required",
        message: "Please specify contact name",
        variant: "warning",
      });
      return;
    }

    if (entryForm.isNewRetailer && entryForm.newRetailerPhone) {
      const clean = entryForm.newRetailerPhone.replace(/\D/g, "");
      if (clean.length > 0 && clean.length !== 10) {
        setToast({
          id: Date.now().toString(),
          title: "Invalid Phone",
          message: "Mobile number must be exactly 10 digits",
          variant: "warning",
        });
        return;
      }
    }

    setSubmittingEntry(true);
    try {
      const payload = {
        retailerId: entryForm.isNewRetailer ? undefined : entryForm.retailerId,
        newRetailerName: entryForm.isNewRetailer ? entryForm.newRetailerName : undefined,
        newRetailerShop: entryForm.isNewRetailer ? entryForm.newRetailerShop : undefined,
        newRetailerPhone: entryForm.isNewRetailer ? entryForm.newRetailerPhone.replace(/\D/g, "").slice(-10) : undefined,
        partyType: accountType === "RETAILER" ? "RETAILER" : "VENDOR",
        category: entryForm.newRetailerCategory,
        date: entryForm.date,
        type: entryForm.type,
        amount: Number(entryForm.amount),
        paymentMethod: entryForm.paymentMethod,
        referenceNo: entryForm.referenceNo,
        description: entryForm.description,
      };

      const res = await fetch("/api/v1/admin/accounts/logbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && (json.success || json.data)) {
        setToast({
          id: Date.now().toString(),
          title: "Entry Logged",
          message: `₹${Number(entryForm.amount).toLocaleString("en-IN")} recorded successfully.`,
          variant: "success",
        });
        setShowAddEntryModal(false);
        setEntryForm((prev) => ({
          ...prev,
          amount: "",
          referenceNo: "",
          description: "",
          isNewRetailer: false,
          newRetailerName: "",
          newRetailerShop: "",
          newRetailerPhone: "",
        }));
        await fetchRetailers();
        if (activeTab === "passbook") {
          await fetchPassbook(passbookRetailerId);
        } else {
          await fetchLogbook();
        }
      } else {
        setToast({
          id: Date.now().toString(),
          title: "Failed to Record",
          message: json.error || json.message || "Could not save log entry",
          variant: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setToast({
        id: Date.now().toString(),
        title: "Error",
        message: "An unexpected error occurred",
        variant: "error",
      });
    } finally {
      setSubmittingEntry(false);
    }
  };

  // Handle Delete Entry
  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry? The account balance will be reversed.")) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/accounts/logbook/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setToast({
          id: Date.now().toString(),
          title: "Entry Removed",
          message: "Transaction deleted and balance adjusted",
          variant: "info",
        });
        await fetchRetailers();
        if (activeTab === "passbook") {
          await fetchPassbook(passbookRetailerId);
        } else {
          await fetchLogbook();
        }
      } else {
        alert(json.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Save Retailer / Supplier
  const handleSaveRetailer = async (e: React.FormEvent) => {
    e.preventDefault();
    setRetailerModalError(null);

    if (!retailerForm.name.trim()) {
      setRetailerModalError("Contact Person Name is required.");
      return;
    }

    const cleanPhone = retailerForm.phone.replace(/\D/g, "");
    if (cleanPhone && cleanPhone.length !== 10) {
      setRetailerModalError(`Mobile number must be exactly 10 digits (currently ${cleanPhone.length} digits entered).`);
      return;
    }

    setSubmittingRetailer(true);
    try {
      const url = editingRetailer
        ? `/api/v1/admin/accounts/retailers/${editingRetailer.id}`
        : "/api/v1/admin/accounts/retailers";
      const method = editingRetailer ? "PATCH" : "POST";

      const payload = {
        name: retailerForm.name.trim(),
        shopName: retailerForm.shopName ? retailerForm.shopName.trim() : null,
        phone: cleanPhone || null,
        email: retailerForm.email ? retailerForm.email.trim() : null,
        address: retailerForm.address ? retailerForm.address.trim() : null,
        city: retailerForm.city ? retailerForm.city.trim() : "Surat",
        partyType: retailerForm.partyType,
        category: retailerForm.category,
        openingBalance: Number(retailerForm.openingBalance) || 0,
        creditLimit: (retailerForm.creditLimit !== "" && retailerForm.creditLimit !== null && !isNaN(Number(retailerForm.creditLimit)))
          ? Number(retailerForm.creditLimit)
          : null,
        notes: retailerForm.notes ? retailerForm.notes.trim() : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && (json.success || json.data)) {
        setToast({
          id: Date.now().toString(),
          title: editingRetailer
            ? "Account Updated"
            : retailerForm.partyType === "VENDOR"
            ? "Supplier Registered"
            : "Retailer Registered",
          message: `${retailerForm.shopName || retailerForm.name} saved successfully`,
          variant: "success",
        });
        setShowRetailerModal(false);
        setRetailerModalError(null);
        setEditingRetailer(null);
        setRetailerForm({
          name: "",
          shopName: "",
          phone: "",
          email: "",
          address: "",
          city: "Surat",
          partyType: accountType === "RETAILER" ? "RETAILER" : "VENDOR",
          category: accountType === "RETAILER" ? RETAILER_CATEGORIES[0] : SUPPLIER_CATEGORIES[0],
          openingBalance: "0",
          creditLimit: "",
          notes: "",
        });
        await fetchRetailers();
      } else {
        const errorMsg = json.error || json.message || "Failed to save account. Please check inputs.";
        setRetailerModalError(errorMsg);
        setToast({
          id: Date.now().toString(),
          title: "Save Failed",
          message: errorMsg,
          variant: "error",
        });
      }
    } catch (err: any) {
      console.error(err);
      setRetailerModalError(err.message || "Network error while saving");
    } finally {
      setSubmittingRetailer(false);
    }
  };

  // Prepare WhatsApp Message
  const openWhatsAppShare = (ret: { name: string; shopName?: string | null; currentBalance: number; phone?: string | null; partyType?: string }) => {
    const isVendor = ret.partyType === "VENDOR";
    const store = ret.shopName || ret.name;
    const bal = Number(ret.currentBalance).toLocaleString("en-IN");
    const today = format(new Date(), "dd MMMM yyyy");

    const text = isVendor
      ? `🎂 *GOPAL CAKE SHOP & BAKERS*\n*Supplier Purchase & Payment Statement*\n\n📦 Supplier: *${store}*\n📅 Date: ${today}\n💰 Balance Payable to You: *₹${bal}*\n\n_Payment processed via Bank / UPI. Thank you!_`
      : `🎂 *GOPAL CAKE SHOP & BAKERS*\n*Account Statement Update*\n\n🏪 Retailer: *${store}*\n📅 Statement Date: ${today}\n💰 Outstanding Balance Due: *₹${bal}*\n\nPlease arrange payment at your earliest convenience.\nUPI ID: *gopalbakes@upi*\n\n_Thank you for your business!_`;

    setWhatsAppText(text);
    setWhatsAppPhone(ret.phone?.replace(/[^0-9]/g, "") || "");
    setShowWhatsAppModal(true);
  };

  // Selected Retailer in Add Entry Modal
  const selectedRetailerInModal = useMemo(() => {
    return retailersList.find((r) => r.id === entryForm.retailerId);
  }, [retailersList, entryForm.retailerId]);

  // Projected Balance in Modal
  const projectedBalance = useMemo(() => {
    if (!selectedRetailerInModal) return null;
    const cur = Number(selectedRetailerInModal.currentBalance);
    const amt = Number(entryForm.amount) || 0;
    if (entryForm.type === "BILLING") return cur + amt;
    return Math.max(0, cur - amt);
  }, [selectedRetailerInModal, entryForm.amount, entryForm.type]);

  // Filtered Directory
  const filteredRetailers = useMemo(() => {
    return retailersList.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.shopName && r.shopName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.phone && r.phone.includes(searchQuery)) ||
        (r.category && r.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.address && r.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [retailersList, searchQuery]);

  const isSupplierMode = accountType === "VENDOR";

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#121110] text-zinc-900 dark:text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[99999] pointer-events-auto">
          <NotificationToast
            id={toast.id}
            title={toast.title}
            message={toast.message}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-zinc-200 dark:border-white/10 pb-4 sm:pb-5">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 flex items-center justify-center">
                <LucideReceipt className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight font-serif text-zinc-900 dark:text-white truncate">
                Accounts & Ledger
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Raw ingredient suppliers (we pay) & retailer wholesale accounts (they pay us)
            </p>
          </div>
        </div>

        {/* Action Controls - Mobile Grid */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setEntryForm((prev) => ({
                ...prev,
                date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                retailerId: retailersList[0]?.id || "",
                amount: "",
                type: isSupplierMode ? "BILLING" : "BILLING",
              }));
              setShowAddEntryModal(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Add size={16} className="shrink-0" />
            <span className="truncate">{isSupplierMode ? "+ Record Bill" : "+ Add Entry"}</span>
          </button>

          <button
            onClick={() => {
              setEditingRetailer(null);
              setRetailerForm({
                name: "",
                shopName: "",
                phone: "",
                email: "",
                address: "",
                city: "Surat",
                partyType: isSupplierMode ? "VENDOR" : "RETAILER",
                category: isSupplierMode ? SUPPLIER_CATEGORIES[0] : RETAILER_CATEGORIES[0],
                openingBalance: "0",
                creditLimit: "",
                notes: "",
              });
              setRetailerModalError(null);
              setShowRetailerModal(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 bg-white dark:bg-[#1A1918] text-zinc-800 dark:text-zinc-200 font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
          >
            <Shop size={16} className="shrink-0" />
            <span className="truncate">{isSupplierMode ? "+ New Supplier" : "+ New Retailer"}</span>
          </button>
        </div>
      </div>

      {/* Primary Account Type Switcher: 100% Mobile Safe Grid */}
      <div className="w-full bg-zinc-100 dark:bg-[#1A1918] p-1.5 rounded-2xl border border-zinc-200 dark:border-white/10 space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <button
            onClick={() => setAccountType("VENDOR")}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center cursor-pointer ${
              accountType === "VENDOR"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white dark:bg-[#242220] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Box size={15} className="shrink-0" />
              <span className="truncate">Suppliers (We Pay)</span>
            </div>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono shrink-0 ${
              accountType === "VENDOR" ? "bg-black/20 text-white" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            }`}>
              Payables
            </span>
          </button>

          <button
            onClick={() => setAccountType("RETAILER")}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center cursor-pointer ${
              accountType === "RETAILER"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-[#242220] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Shop size={15} className="shrink-0" />
              <span className="truncate">Retailers (They Pay)</span>
            </div>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono shrink-0 ${
              accountType === "RETAILER" ? "bg-black/20 text-white" : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
            }`}>
              Receivables
            </span>
          </button>

          <button
            onClick={() => setAccountType("ALL")}
            className={`col-span-2 sm:col-span-1 py-1.5 sm:py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
              accountType === "ALL"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                : "bg-white dark:bg-[#242220] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
            }`}
          >
            <span>All Combined</span>
          </button>
        </div>

        <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium px-1.5 pt-0.5">
          {accountType === "VENDOR"
            ? "🛒 Raw material suppliers (Dairy, Flour, Chocolate, Boxes) & money Gopal Cake Shop owes."
            : accountType === "RETAILER"
            ? "🏪 Retailers & cafes buying wholesale cakes & money they owe Gopal Cake Shop."
            : "📊 Combined view of all suppliers, wholesale retailers, and cashflow."}
        </div>
      </div>

      {/* Top Level Financial KPI Cards (2x2 Grid on Mobile, 4 Cols on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Balance Payable / Receivable */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#1A1918] border border-amber-500/20 shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 truncate">
              {isSupplierMode ? "We Owe" : "Due to Us"}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 flex items-center justify-center">
              <LucideWallet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              ₹
              {Number(
                isSupplierMode
                  ? logbookData?.summary.totalPayableToVendors || 0
                  : logbookData?.summary.totalReceivableFromRetailers || 0
              ).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
              {isSupplierMode ? "Payable to suppliers" : "Receivable from shops"}
            </div>
          </div>
        </motion.div>

        {/* Card 2: Period Bills (Purchases or Sales) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 truncate">
              {isSupplierMode
                ? activeTab === "monthly" ? "Month Purchases" : "Today Bills"
                : activeTab === "monthly" ? "Month Sales" : "Today Billed"}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              ₹{Number(logbookData?.summary.totalBilled || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
              {isSupplierMode ? "Raw material bills" : "Cake & pastry sales"}
            </div>
          </div>
        </motion.div>

        {/* Card 3: Payments Made or Collected */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#1A1918] border border-emerald-500/20 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 truncate">
              {isSupplierMode
                ? activeTab === "monthly" ? "Month Paid" : "Today Paid"
                : activeTab === "monthly" ? "Collections" : "Collected"}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              ₹{Number(logbookData?.summary.totalPaid || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
              {isSupplierMode ? "Payments cleared" : "Cash & UPI collected"}
            </div>
          </div>
        </motion.div>

        {/* Card 4: Count of Entries */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 truncate">
              {isSupplierMode ? "Suppliers" : "Retailers"}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 flex items-center justify-center">
              <LucideStore className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 shrink-0" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              {retailersList.length}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
              {logbookData?.summary.entriesCount || 0} period entries
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation: Mobile Smooth Swipe with Integrated Refresh */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "daily"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
            }`}
          >
            <LucideCalendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Daily Logbook</span>
          </button>

          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "monthly"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
            }`}
          >
            <LucideReceipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Monthly Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab("passbook")}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "passbook"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
            }`}
          >
            <LucideCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>{isSupplierMode ? "Supplier Khata" : "Retailer Khata"}</span>
          </button>

          <button
            onClick={() => setActiveTab("retailers")}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "retailers"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
            }`}
          >
            <LucideStore className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>
              {isSupplierMode ? `Suppliers (${retailersList.length})` : `Retailers (${retailersList.length})`}
            </span>
          </button>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => {
            fetchRetailers();
            if (activeTab === "passbook") fetchPassbook(passbookRetailerId);
            else fetchLogbook();
          }}
          className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-600" : ""}`} />
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 1: DAILY LOGBOOK
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "daily" && (
        <div className="space-y-6">
          {/* Daily Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 shadow-xs">
            {/* Date Navigator */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  const prev = subDays(parseISO(selectedDate), 1);
                  setSelectedDate(format(prev, "yyyy-MM-dd"));
                }}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/5 transition-all shrink-0 cursor-pointer"
                title="Previous Day"
              >
                ◀ Prev
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm font-bold text-zinc-900 dark:text-white text-center"
              />

              <button
                onClick={() => {
                  const next = addDays(parseISO(selectedDate), 1);
                  setSelectedDate(format(next, "yyyy-MM-dd"));
                }}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/5 transition-all shrink-0 cursor-pointer"
                title="Next Day"
              >
                Next ▶
              </button>

              <button
                onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all shrink-0 cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Type & Account Quick Filters */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
              <select
                value={retailerFilter}
                onChange={(e) => setRetailerFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate"
              >
                <option value="all">{isSupplierMode ? "All Suppliers" : "All Retailers"}</option>
                {retailersList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.shopName || r.name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate"
              >
                <option value="all">All Types</option>
                <option value="BILLING">{isSupplierMode ? "📦 Purchases" : "🛍️ Billed"}</option>
                <option value="PAYMENT">{isSupplierMode ? "💸 Paid Out" : "💰 Received"}</option>
                <option value="RETURN">🔄 Returns</option>
                <option value="ADJUSTMENT">⚖️ Adjustments</option>
              </select>
            </div>
          </div>

          {/* Daily Transactions Container */}
          <div className="rounded-2xl bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                  {isSupplierMode ? "Supplier Transactions on" : "Retailer Transactions on"}{" "}
                  {format(parseISO(selectedDate), "dd MMMM yyyy")}
                </h2>
                <p className="text-[11px] sm:text-xs text-zinc-500">
                  {logbookData?.entries.length || 0} entries recorded
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-8 sm:p-12 text-center text-zinc-400">Loading daily records...</div>
            ) : !logbookData || logbookData.entries.length === 0 ? (
              <div className="p-8 sm:p-12 text-center space-y-3">
                <LucideReceipt className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-zinc-300 dark:text-zinc-600" />
                <div className="text-sm sm:text-base font-bold text-zinc-700 dark:text-zinc-300">
                  No logbook entries for {format(parseISO(selectedDate), "dd MMM yyyy")}
                </div>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {isSupplierMode
                    ? "No raw ingredients purchased or supplier payments made on this date."
                    : "No retail orders billed or payments received on this date."}
                </p>
                <button
                  onClick={() => {
                    setEntryForm((prev) => ({
                      ...prev,
                      date: `${selectedDate}T12:00`,
                      retailerId: retailersList[0]?.id || "",
                    }));
                    setShowAddEntryModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold text-xs shadow-sm hover:bg-amber-700 transition-all cursor-pointer"
                >
                  + Record Entry for This Date
                </button>
              </div>
            ) : (
              <>
                {/* 1. Mobile Card List (block sm:hidden) */}
                <div className="block sm:hidden divide-y divide-zinc-200 dark:divide-white/5 p-2 space-y-2">
                  {logbookData.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/5 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                            {entry.retailer.shopName || entry.retailer.name}
                          </h4>
                          <span className="text-[10px] text-zinc-400">
                            {format(new Date(entry.date), "hh:mm a")} {entry.referenceNo ? `• Ref: ${entry.referenceNo}` : ""}
                          </span>
                        </div>

                        {/* Amount Badge */}
                        <div className="text-right shrink-0">
                          <div
                            className={`font-black text-sm ${
                              entry.type === "BILLING"
                                ? "text-blue-600 dark:text-blue-400"
                                : entry.type === "PAYMENT"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {entry.type === "PAYMENT" ? "-" : "+"}₹{Number(entry.amount).toLocaleString("en-IN")}
                          </div>
                          <span className="text-[9px] text-zinc-400 block font-mono">
                            Bal: ₹{Number(entry.balanceAfter ?? entry.retailer.currentBalance).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Type and Description */}
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          entry.type === "BILLING"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                            : entry.type === "PAYMENT"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                        }`}>
                          {entry.type === "BILLING" ? (entry.retailer.partyType === "VENDOR" ? "📦 Purchase" : "🛍️ Billed") : entry.type === "PAYMENT" ? (entry.retailer.partyType === "VENDOR" ? "💸 Paid" : "💰 Received") : entry.type}
                        </span>

                        <span className="text-zinc-600 dark:text-zinc-400 truncate flex-1 text-right text-[11px]">
                          {entry.description || entry.paymentMethod}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-200/50 dark:border-white/5">
                        <button
                          onClick={() => {
                            setPassbookRetailerId(entry.retailer.id);
                            setActiveTab("passbook");
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <LucideCard className="w-3 h-3" /> Passbook
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-500/10 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. Desktop Data Table (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 dark:bg-[#151413] text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider border-b border-zinc-200 dark:border-white/10">
                      <tr>
                        <th className="py-3 px-4">Time & Ref</th>
                        <th className="py-3 px-4">{isSupplierMode ? "Supplier / Business" : "Retailer / Store"}</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Raw Materials / Particulars</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4 text-right">Amount (₹)</th>
                        <th className="py-3 px-4 text-right">{isSupplierMode ? "Balance We Owe" : "Balance Due"}</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                      {logbookData.entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-zinc-900 dark:text-white">
                              {format(new Date(entry.date), "hh:mm a")}
                            </div>
                            {entry.referenceNo && (
                              <div className="text-[11px] font-mono text-zinc-400">
                                Ref: {entry.referenceNo}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-bold text-zinc-900 dark:text-white">
                              {entry.retailer.shopName || entry.retailer.name}
                            </div>
                            <div className="text-xs text-zinc-400">
                              {entry.retailer.category || (entry.retailer.partyType === "VENDOR" ? "Raw Ingredients" : "Retail")}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {entry.type === "BILLING" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                {entry.retailer.partyType === "VENDOR" ? "📦 Purchase Bill" : "🛍️ Goods Billed"}
                              </span>
                            ) : entry.type === "PAYMENT" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                {entry.retailer.partyType === "VENDOR" ? "💸 Paid to Supplier" : "💰 Payment Received"}
                              </span>
                            ) : entry.type === "RETURN" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                🔄 Return
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                ⚖️ Adjustment
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="text-xs text-zinc-700 dark:text-zinc-300 font-medium line-clamp-2">
                              {entry.description || "—"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#242220] text-zinc-700 dark:text-zinc-300">
                              {entry.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div
                              className={`font-black text-base ${
                                entry.type === "BILLING"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : entry.type === "PAYMENT"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {entry.type === "PAYMENT" ? "-" : "+"}₹
                              {Number(entry.amount).toLocaleString("en-IN")}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="font-bold text-xs text-zinc-600 dark:text-zinc-300">
                              ₹{Number(entry.balanceAfter ?? entry.retailer.currentBalance).toLocaleString("en-IN")}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setPassbookRetailerId(entry.retailer.id);
                                  setActiveTab("passbook");
                                }}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-600 hover:bg-amber-500/10 transition-all cursor-pointer"
                                title="View Passbook"
                              >
                                <LucideCard className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
                                title="Delete Entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 2: MONTHLY LEDGER
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "monthly" && (
        <div className="space-y-6">
          {/* Month Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const [y, m] = selectedMonth.split("-").map(Number);
                  const prev = subMonths(new Date(y, m - 1, 1), 1);
                  setSelectedMonth(format(prev, "yyyy-MM"));
                }}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
              >
                ◀ Prev Month
              </button>

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-900 dark:text-white"
              />

              <button
                onClick={() => {
                  const [y, m] = selectedMonth.split("-").map(Number);
                  const next = addMonths(new Date(y, m - 1, 1), 1);
                  setSelectedMonth(format(next, "yyyy-MM"));
                }}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
              >
                Next Month ▶
              </button>

              <button
                onClick={() => setSelectedMonth(format(new Date(), "yyyy-MM"))}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all"
              >
                Current Month
              </button>
            </div>

            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Showing statement for: {format(parseISO(`${selectedMonth}-01`), "MMMM yyyy")}
            </div>
          </div>

          {/* Monthly Trend Chart */}
          {logbookData && logbookData.trends.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  {isSupplierMode
                    ? `Daily Purchases vs Payments Made (${format(parseISO(`${selectedMonth}-01`), "MMMM yyyy")})`
                    : `Daily Billed vs Collections (${format(parseISO(`${selectedMonth}-01`), "MMMM yyyy")})`}
                </h3>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-500" />
                    {isSupplierMode ? "Purchased (We Owe)" : "Billed (Sales)"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500" />
                    {isSupplierMode ? "Paid to Suppliers" : "Collected (Paid)"}
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={logbookData.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => format(parseISO(val), "dd")}
                      stroke="#888"
                      fontSize={11}
                    />
                    <YAxis stroke="#888" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`]}
                      labelFormatter={(label) => format(parseISO(label as string), "dd MMMM yyyy")}
                      contentStyle={{
                        backgroundColor: "#1f1d1b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="billed" name={isSupplierMode ? "Purchased" : "Billed"} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="paid" name={isSupplierMode ? "Paid to Supplier" : "Collected"} fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Supplier / Retailer Monthly Statement Table */}
          <div className="rounded-2xl bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  {isSupplierMode ? "Supplier Purchase & Balance Statement" : "Retailer Khata Statement"} (
                  {format(parseISO(`${selectedMonth}-01`), "MMMM yyyy")})
                </h2>
                <p className="text-xs text-zinc-500">
                  {isSupplierMode
                    ? "Opening Balance, Raw Ingredients Purchased, Payments Made, and Closing Balance We Owe"
                    : "Opening Balance, Goods Billed, Collections, and Closing Due"}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-[#151413] text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider border-b border-zinc-200 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-4">{isSupplierMode ? "Supplier / Business" : "Retailer / Store"}</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Opening Bal (₹)</th>
                    <th className="py-3 px-4 text-right">{isSupplierMode ? "Month Purchased (₹)" : "Month Billed (₹)"}</th>
                    <th className="py-3 px-4 text-right">{isSupplierMode ? "Month Paid (₹)" : "Month Collected (₹)"}</th>
                    <th className="py-3 px-4 text-right">{isSupplierMode ? "Balance We Owe (₹)" : "Closing Due (₹)"}</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                  {logbookData?.retailerSummaries.map((ret) => (
                    <tr key={ret.id} className="hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-zinc-900 dark:text-white">
                          {ret.shopName || ret.name}
                        </div>
                        {ret.shopName && <div className="text-xs text-zinc-400">{ret.name}</div>}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-zinc-500">
                        {ret.category || (ret.partyType === "VENDOR" ? "Raw Ingredients" : "Retail")}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-medium text-zinc-600 dark:text-zinc-400">
                        ₹{ret.openingBalance.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                        ₹{ret.billed.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{ret.paid.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-amber-600 dark:text-amber-400">
                        ₹{ret.closingBalance.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {ret.closingBalance === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Settled
                          </span>
                        ) : ret.closingBalance > 30000 ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            {ret.partyType === "VENDOR" ? "Major Payable" : "High Due"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            {ret.partyType === "VENDOR" ? "Pending to Pay" : "Pending Due"}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setPassbookRetailerId(ret.id);
                              setActiveTab("passbook");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1"
                          >
                            <Card size={14} /> Passbook
                          </button>
                          <button
                            onClick={() => openWhatsAppShare({
                              name: ret.name,
                              shopName: ret.shopName,
                              currentBalance: ret.closingBalance,
                              phone: ret.phone,
                              partyType: ret.partyType,
                            })}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-all"
                            title="Share Statement"
                          >
                            <Share size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 3: PASSBOOK / KHATA STATEMENT
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "passbook" && (
        <div className="space-y-6">
          {/* Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                {isSupplierMode ? "Select Supplier Khata:" : "Select Retailer Khata:"}
              </span>
              <select
                value={passbookRetailerId}
                onChange={(e) => setPassbookRetailerId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-900 dark:text-white"
              >
                {retailersList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.shopName || r.name} ({r.category || r.city}) — {r.partyType === "VENDOR" ? "We Owe:" : "Due:"} ₹{r.currentBalance.toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>

            {passbookData?.retailer && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openWhatsAppShare(passbookData.retailer)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Share size={16} /> WhatsApp Statement
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition-all flex items-center gap-1.5"
                >
                  <Printer size={16} /> Print Passbook
                </button>
              </div>
            )}
          </div>

          {/* Account Profile Header Card */}
          {passbookData?.retailer && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-600/10 via-amber-500/5 to-transparent border border-amber-500/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                    {passbookData.retailer.shopName || passbookData.retailer.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400">
                    {passbookData.retailer.partyType === "VENDOR" ? "📦 Raw Material Supplier" : "🏪 Retail Store"}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-3">
                  <span>Category: <strong>{passbookData.retailer.category || "General"}</strong></span>
                  <span>•</span>
                  <span>Contact: <strong>{passbookData.retailer.name}</strong></span>
                  <span>•</span>
                  <span>Phone: <strong>{passbookData.retailer.phone || "—"}</strong></span>
                </div>
              </div>

              {/* Outstanding Balance Display */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {passbookData.retailer.partyType === "VENDOR"
                      ? "Money We Owe to This Supplier"
                      : "Current Outstanding Due to Us"}
                  </div>
                  <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                    ₹{Number(passbookData.retailer.currentBalance).toLocaleString("en-IN")}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEntryForm((prev) => ({
                      ...prev,
                      retailerId: passbookData.retailer.id,
                      type: passbookData.retailer.partyType === "VENDOR" ? "PAYMENT" : "PAYMENT",
                      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                      amount: "",
                    }));
                    setShowAddEntryModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all whitespace-nowrap"
                >
                  {passbookData.retailer.partyType === "VENDOR" ? "+ Record Payment Paid" : "+ Record Payment Received"}
                </button>
              </div>
            </div>
          )}

          {/* Passbook Chronological Ledger Table */}
          <div className="rounded-2xl bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-white/10">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Chronological Passbook Ledger
              </h3>
              <p className="text-xs text-zinc-500">
                {isSupplierMode
                  ? "Audit history of raw material purchase bills received, payments made, and running balance we owe"
                  : "Audit history of goods dispatched, cash/UPI receipts, and running balance"}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-[#151413] text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider border-b border-zinc-200 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Ref / Bill No</th>
                    <th className="py-3 px-4">Particulars</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">
                      {isSupplierMode ? "Purchase Bill (We Owe +)" : "Billed (Debit +)"}
                    </th>
                    <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                      {isSupplierMode ? "Paid to Supplier (-)" : "Collected (Credit -)"}
                    </th>
                    <th className="py-3 px-4 text-right text-amber-600 dark:text-amber-400">
                      {isSupplierMode ? "Balance We Owe (₹)" : "Running Due (₹)"}
                    </th>
                    <th className="py-3 px-4 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                  {passbookData?.entries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-xs text-zinc-900 dark:text-white">
                        {format(new Date(entry.date), "dd/MM/yyyy hh:mm a")}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-zinc-500">
                        {entry.referenceNo || "—"}
                      </td>

                      <td className="py-3 px-4 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {entry.description || "—"}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-xs">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#242220] font-mono">
                          {entry.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                        {entry.type === "BILLING" ? `₹${entry.amount.toLocaleString("en-IN")}` : "—"}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                        {entry.type === "PAYMENT" || entry.type === "RETURN"
                          ? `₹${entry.amount.toLocaleString("en-IN")}`
                          : "—"}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-black text-amber-600 dark:text-amber-400">
                        ₹{Number(entry.balanceAfter ?? 0).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1 rounded text-zinc-400 hover:text-rose-600 transition-colors"
                          title="Delete entry"
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 4: DIRECTORY (Suppliers or Retailers)
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "retailers" && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 shadow-sm">
            <div className="relative flex-1 min-w-[260px]">
              <SearchNormal1 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder={
                  isSupplierMode
                    ? "Search raw material suppliers by name, category (dairy, flour, packaging), phone..."
                    : "Search retailers by shop name, contact, phone, or area..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white"
              />
            </div>

            <button
              onClick={() => {
                setEditingRetailer(null);
                setRetailerForm({
                  name: "",
                  shopName: "",
                  phone: "",
                  email: "",
                  address: "",
                  city: "Surat",
                  partyType: isSupplierMode ? "VENDOR" : "RETAILER",
                  category: isSupplierMode ? SUPPLIER_CATEGORIES[0] : RETAILER_CATEGORIES[0],
                  openingBalance: "0",
                  creditLimit: "",
                  notes: "",
                });
                setRetailerModalError(null);
                setShowRetailerModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Add size={18} />
              <span>{isSupplierMode ? "Register Raw Material Supplier" : "Register Retailer Store"}</span>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRetailers.map((ret) => (
              <div
                key={ret.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 hover:border-amber-500/30 transition-all shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                        {ret.shopName || ret.name}
                      </h3>
                      {ret.shopName && (
                        <p className="text-xs text-zinc-500">Contact: {ret.name}</p>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      {ret.category || (ret.partyType === "VENDOR" ? "Raw Material" : "Retail")}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <p>📞 Phone: <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">+91 {ret.phone || "—"}</span></p>
                    <p>📍 Location: <span className="font-medium text-zinc-800 dark:text-zinc-200">{ret.address || ret.city}</span></p>
                    <p>📊 Entries: <span className="font-medium text-zinc-800 dark:text-zinc-200">{ret.entriesCount} logged</span></p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-zinc-400">
                      {ret.partyType === "VENDOR" ? "Money We Owe" : "Balance Due"}
                    </span>
                    <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                      ₹{ret.currentBalance.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setPassbookRetailerId(ret.id);
                        setActiveTab("passbook");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#242220] hover:bg-amber-500/10 hover:text-amber-600 text-xs font-bold transition-all"
                    >
                      Passbook
                    </button>
                    <button
                      onClick={() => {
                        setEditingRetailer(ret);
                        setRetailerForm({
                          name: ret.name,
                          shopName: ret.shopName,
                          phone: ret.phone,
                          email: ret.email,
                          address: ret.address,
                          city: ret.city,
                          partyType: ret.partyType,
                          category: ret.category || (ret.partyType === "VENDOR" ? SUPPLIER_CATEGORIES[0] : RETAILER_CATEGORIES[0]),
                          openingBalance: String(ret.openingBalance),
                          creditLimit: ret.creditLimit ? String(ret.creditLimit) : "",
                          notes: ret.notes,
                        });
                        setRetailerModalError(null);
                        setShowRetailerModal(true);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
                      title="Edit Account"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => openWhatsAppShare(ret)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                      title="Share Statement"
                    >
                      <Share size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL: ADD LOG ENTRY
      ────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddEntryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-[#1A1918] rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <Receipt21 size={20} variant="Bold" />
                  </span>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                    {isSupplierMode ? "Record Raw Material Purchase / Payment" : "Record Retailer Entry"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddEntryModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                >
                  <CloseCircle size={22} />
                </button>
              </div>

              <form onSubmit={handleSaveEntry} className="space-y-4">
                {/* Transaction Type Segmented Switcher */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">
                    Transaction Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        type: "BILLING",
                        label: isSupplierMode ? "📦 Purchase Bill" : "🛍️ Goods Billed",
                        color: "border-blue-500 text-blue-600",
                      },
                      {
                        type: "PAYMENT",
                        label: isSupplierMode ? "💸 Paid to Supplier" : "💰 Payment Received",
                        color: "border-emerald-500 text-emerald-600",
                      },
                      { type: "RETURN", label: "🔄 Return", color: "border-amber-500 text-amber-600" },
                      { type: "ADJUSTMENT", label: "⚖️ Adjustment", color: "border-purple-500 text-purple-600" },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.type}
                        onClick={() => setEntryForm((prev) => ({ ...prev, type: opt.type as any }))}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                          entryForm.type === opt.type
                            ? `${opt.color} bg-zinc-100 dark:bg-white/10 shadow-sm`
                            : "border-zinc-200 dark:border-white/10 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account / Supplier Selector or Inline New */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      {isSupplierMode ? "Supplier (We Pay)" : "Retailer Store (They Pay)"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setEntryForm((prev) => ({ ...prev, isNewRetailer: !prev.isNewRetailer }))}
                      className="text-xs font-semibold text-amber-600 hover:underline"
                    >
                      {entryForm.isNewRetailer ? "← Choose Existing" : "+ Quick Add New"}
                    </button>
                  </div>

                  {!entryForm.isNewRetailer ? (
                    <select
                      value={entryForm.retailerId}
                      onChange={(e) => setEntryForm((prev) => ({ ...prev, retailerId: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-900 dark:text-white"
                      required
                    >
                      <option value="">-- Select {isSupplierMode ? "Supplier" : "Retailer"} --</option>
                      {retailersList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.shopName || r.name} ({r.category || r.city}) — {r.partyType === "VENDOR" ? "We Owe:" : "Due:"} ₹{r.currentBalance.toLocaleString("en-IN")}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <input
                        type="text"
                        placeholder="Contact Person Name *"
                        value={entryForm.newRetailerName}
                        onChange={(e) => setEntryForm((prev) => ({ ...prev, newRetailerName: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 text-xs"
                        required
                      />
                      <input
                        type="text"
                        placeholder={isSupplierMode ? "Business / Brand (e.g. Amul Dairy Depot)" : "Shop Name"}
                        value={entryForm.newRetailerShop}
                        onChange={(e) => setEntryForm((prev) => ({ ...prev, newRetailerShop: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 text-xs"
                      />
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-zinc-400 select-none">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="10-digit Mobile (e.g. 9825112345)"
                          value={entryForm.newRetailerPhone}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setEntryForm((prev) => ({ ...prev, newRetailerPhone: digits }));
                          }}
                          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-[#1A1918] border border-zinc-200 dark:border-white/10 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount & Chips */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      placeholder="0.00"
                      value={entryForm.amount}
                      onChange={(e) => setEntryForm((prev) => ({ ...prev, amount: e.target.value }))}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-lg font-black text-zinc-900 dark:text-white"
                    />
                  </div>

                  {/* Fast Amount Chips */}
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto">
                    {[1000, 2500, 5000, 10000, 25000].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setEntryForm((prev) => ({ ...prev, amount: String(amt) }))}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-white/5 hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
                      >
                        +₹{amt.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                      Payment Mode
                    </label>
                    <select
                      value={entryForm.paymentMethod}
                      onChange={(e) => setEntryForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs font-bold"
                    >
                      <option value="CASH">💵 Cash</option>
                      <option value="UPI">📱 UPI / QR</option>
                      <option value="CARD">💳 Card</option>
                      <option value="MANUAL">🧾 Cheque / Bank NEFT</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={entryForm.date}
                      onChange={(e) => setEntryForm((prev) => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Reference No */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                    Invoice / Challan / Bill No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AMUL-INV-4912 or UPI-9843219"
                    value={entryForm.referenceNo}
                    onChange={(e) => setEntryForm((prev) => ({ ...prev, referenceNo: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs font-mono"
                  />
                </div>

                {/* Description & Quick Chips */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                    {isSupplierMode ? "Raw Material Items / Description" : "Particulars / Notes"}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={
                      isSupplierMode
                        ? "e.g. Fresh whipping cream 50L + butter 20kg received..."
                        : "e.g. 20 pineapple cakes + 10 dry bakes dispatched..."
                    }
                    value={entryForm.description}
                    onChange={(e) => setEntryForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(isSupplierMode
                      ? [
                          "Amul Fresh Cream & Butter",
                          "Maida Flour & Sugar Batch",
                          "Callebaut Dark Chocolate Slabs",
                          "Cake Boxes & Boards 500pcs",
                          "Fruit Fillings & Glaze",
                          "Supplier Bank Payment",
                        ]
                      : [
                          "Fresh Cakes Dispatch",
                          "Pastries & Dry Bakes",
                          "Counter Cash Received",
                          "Google Pay / UPI Transfer",
                          "Weekly Settlement",
                        ]
                    ).map((chip) => (
                      <button
                        type="button"
                        key={chip}
                        onClick={() => setEntryForm((prev) => ({ ...prev, description: chip }))}
                        className="px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Projected Balance Preview */}
                {projectedBalance !== null && (
                  <div className="p-3 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">
                      {selectedRetailerInModal?.partyType === "VENDOR" ? "Balance We Owe:" : "Projected Balance:"}
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      ₹{selectedRetailerInModal?.currentBalance.toLocaleString("en-IN")} →{" "}
                      <strong className="text-amber-600">₹{projectedBalance.toLocaleString("en-IN")}</strong>
                    </span>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddEntryModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEntry}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {submittingEntry ? "Recording..." : "Save Log Entry"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL: REGISTER / EDIT SUPPLIER OR RETAILER
      ────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRetailerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-[#1A1918] rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <Shop size={20} variant="Bold" />
                  </span>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                    {editingRetailer
                      ? "Edit Account Profile"
                      : retailerForm.partyType === "VENDOR"
                      ? "Register Raw Material Supplier (We Pay Them)"
                      : "Register B2B Retailer (They Pay Us)"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowRetailerModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                >
                  <CloseCircle size={22} />
                </button>
              </div>

              <form onSubmit={handleSaveRetailer} className="space-y-3">
                {/* Account Type Selector Inside Modal */}
                {!editingRetailer && (
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1">Account Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setRetailerForm((prev) => ({
                            ...prev,
                            partyType: "VENDOR",
                            category: SUPPLIER_CATEGORIES[0],
                          }))
                        }
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          retailerForm.partyType === "VENDOR"
                            ? "border-amber-500 bg-amber-500/10 text-amber-600 shadow-sm"
                            : "border-zinc-200 dark:border-white/10 text-zinc-500"
                        }`}
                      >
                        🛒 Raw Material Supplier (We Pay)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setRetailerForm((prev) => ({
                            ...prev,
                            partyType: "RETAILER",
                            category: RETAILER_CATEGORIES[0],
                          }))
                        }
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          retailerForm.partyType === "RETAILER"
                            ? "border-blue-500 bg-blue-500/10 text-blue-600 shadow-sm"
                            : "border-zinc-200 dark:border-white/10 text-zinc-500"
                        }`}
                      >
                        🏪 Retailer / Store (They Pay)
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1">Contact Person Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Bhai"
                      value={retailerForm.name}
                      onChange={(e) => setRetailerForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1">
                      {retailerForm.partyType === "VENDOR" ? "Supplier / Brand Name" : "Store / Shop Name"}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        retailerForm.partyType === "VENDOR"
                          ? "e.g. Amul Dairy Products"
                          : "e.g. Gopal Sweets & Dairy"
                      }
                      value={retailerForm.shopName}
                      onChange={(e) => setRetailerForm((prev) => ({ ...prev, shopName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-1">Supply Category</label>
                  <select
                    value={retailerForm.category}
                    onChange={(e) => setRetailerForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                  >
                    {(retailerForm.partyType === "VENDOR" ? SUPPLIER_CATEGORIES : RETAILER_CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-zinc-500">Phone Number (10 Digits) *</label>
                      <span
                        className={`text-[10px] font-bold ${
                          retailerForm.phone.length === 10
                            ? "text-emerald-500"
                            : retailerForm.phone.length > 0
                            ? "text-amber-500"
                            : "text-zinc-400"
                        }`}
                      >
                        {retailerForm.phone.length === 10 ? "✓ 10 Digits" : `${retailerForm.phone.length}/10 digits`}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        placeholder="9825112345"
                        value={retailerForm.phone}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setRetailerForm((prev) => ({ ...prev, phone: digitsOnly }));
                          if (retailerModalError) setRetailerModalError(null);
                        }}
                        className={`w-full pl-11 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border text-xs font-mono font-bold text-zinc-900 dark:text-white transition-colors ${
                          retailerForm.phone.length > 0 && retailerForm.phone.length < 10
                            ? "border-amber-500 focus:border-amber-600"
                            : retailerForm.phone.length === 10
                            ? "border-emerald-500 focus:border-emerald-600"
                            : "border-zinc-200 dark:border-white/10"
                        }`}
                      />
                    </div>
                    {retailerForm.phone.length > 0 && retailerForm.phone.length < 10 && (
                      <p className="text-[10px] text-amber-500 mt-1 font-medium">
                        Must be exactly 10 digits (enter {10 - retailerForm.phone.length} more)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1">City / Town</label>
                    <input
                      type="text"
                      value={retailerForm.city}
                      onChange={(e) => setRetailerForm((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-1">Depot / Shop Address</label>
                  <input
                    type="text"
                    placeholder="Depot No, Landmark, Area"
                    value={retailerForm.address}
                    onChange={(e) => setRetailerForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {!editingRetailer && (
                    <div>
                      <label className="text-xs font-bold text-zinc-500 block mb-1">
                        {retailerForm.partyType === "VENDOR" ? "Opening Money We Owe (₹)" : "Opening Balance (₹)"}
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={retailerForm.openingBalance}
                        onChange={(e) => setRetailerForm((prev) => ({ ...prev, openingBalance: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1">
                      Credit Limit (₹) — Optional
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50000 (Blank for no limit)"
                      value={retailerForm.creditLimit}
                      onChange={(e) => setRetailerForm((prev) => ({ ...prev, creditLimit: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Explainer card */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <InfoCircle size={15} />
                    <span>What is Credit Limit? (ઉધાર લિમિટ)</span>
                  </div>
                  <p className="leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {retailerForm.partyType === "VENDOR"
                      ? "The maximum credit balance allowed with this supplier before payment is required. Leave blank if no limit is set."
                      : "The maximum unpaid credit (udhar) this retailer can owe Gopal Cake Shop. Leave blank for unlimited."}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-1">Payment Terms / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Weekly settlement on Saturdays. Daily fresh cream supplier."
                    value={retailerForm.notes}
                    onChange={(e) => setRetailerForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs"
                  />
                </div>

                {/* Inline Modal Error */}
                {retailerModalError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                    <Danger size={18} className="shrink-0" />
                    <span>{retailerModalError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRetailerModal(false);
                      setRetailerModalError(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRetailer}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {submittingRetailer
                      ? "Saving..."
                      : retailerForm.partyType === "VENDOR"
                      ? "Save Supplier"
                      : "Save Retailer"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL: WHATSAPP STATEMENT SHARING
      ────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#1A1918] rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Share size={20} variant="Bold" />
                  </span>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                    Send WhatsApp Statement
                  </h3>
                </div>
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                >
                  <CloseCircle size={22} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-1">
                    WhatsApp Phone Number (with Country Code)
                  </label>
                  <input
                    type="tel"
                    value={whatsAppPhone}
                    onChange={(e) => setWhatsAppPhone(e.target.value)}
                    placeholder="919825112345"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-1">
                    Formatted Message Preview
                  </label>
                  <textarea
                    rows={8}
                    value={whatsAppText}
                    onChange={(e) => setWhatsAppText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-[#242220] border border-zinc-200 dark:border-white/10 text-xs font-mono leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(whatsAppText);
                    setToast({
                      id: Date.now().toString(),
                      title: "Copied!",
                      message: "Statement text copied to clipboard",
                      variant: "success",
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-white/10 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
                >
                  Copy Text
                </button>

                <a
                  href={`https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(whatsAppText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <DirectboxSend size={16} /> Open in WhatsApp
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
