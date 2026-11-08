"use client";

import * as React from "react";
import { Role } from "@prisma/client";
import {
  Bag,
  Shop,
  Cake,
  Car,
  TruckFast,
  Brush,
  Camera,
  Scissor,
  People,
  Chart,
  Box,
  Setting2,
  ScanBarcode,
  Printer,
  Layer,
  Category,
  Timer1,
  Danger,
  Edit2,
  Flash,
  ArchiveBook,
  TickCircle,
  CloseCircle,
  ShieldSecurity,
  InfoCircle,
} from "iconsax-react";

export type PermissionScopeType = "global" | "branch" | "task" | "none";

export interface PermissionItem {
  id: string;
  category: "orders" | "kitchen" | "logistics" | "vendors" | "management" | "inventory";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  evaluator: (role: Role) => {
    scope: PermissionScopeType;
    label: string;
    details?: string;
  };
}

export const ROLE_DETAILS: Record<
  Role,
  {
    title: string;
    badgeCls: string;
    portalRoute: string;
    portalName: string;
    summary: string;
    scopeType: "Global" | "Branch" | "Vendor Task";
  }
> = {
  ADMIN: {
    title: "Administrator",
    badgeCls: "bg-rose-500/10 text-rose-600 border-rose-500/30",
    portalRoute: "/admin",
    portalName: "Admin Console",
    summary: "Full unrestricted access across all branches, operations, staff, and financial data.",
    scopeType: "Global",
  },
  MANAGER: {
    title: "Branch Manager",
    badgeCls: "bg-violet-500/10 text-violet-600 border-violet-500/30",
    portalRoute: "/manager",
    portalName: "Branch Manager Portal",
    summary: "Supervises branch operations, local kitchen queue, inventory, and branch delivery riders.",
    scopeType: "Branch",
  },
  SALESPERSON: {
    title: "Salesperson",
    badgeCls: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    portalRoute: "/sales",
    portalName: "Sales Desk & POS",
    summary: "Punches counter orders, customizes cakes, collects payments, and assigns local drivers.",
    scopeType: "Branch",
  },
  CHEF: {
    title: "Head / Baking Chef",
    badgeCls: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    portalRoute: "/chef",
    portalName: "Kitchen Display (KDS)",
    summary: "Receives baking tickets, cake specifications (flavor/weight/photo), and updates prep stages.",
    scopeType: "Branch",
  },
  DELIVERY: {
    title: "Delivery Driver",
    badgeCls: "bg-green-500/10 text-green-600 border-green-500/30",
    portalRoute: "/driver",
    portalName: "Driver App",
    summary: "Receives parcel dispatch assignments, navigates customer addresses, and submits delivery proof.",
    scopeType: "Branch",
  },
  VENDOR_FLORIST: {
    title: "Florist Vendor",
    badgeCls: "bg-pink-500/10 text-pink-600 border-pink-500/30",
    portalRoute: "/vendor",
    portalName: "Florist Task Portal",
    summary: "Receives custom fresh flower and bouquet decoration requests attached to cake orders.",
    scopeType: "Vendor Task",
  },
  VENDOR_PHOTO: {
    title: "Photo Printing Vendor",
    badgeCls: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
    portalRoute: "/vendor",
    portalName: "Photo Print Portal",
    summary: "Downloads customer photos, prints edible sugar sheets, and marks print tasks complete.",
    scopeType: "Vendor Task",
  },
  VENDOR_ACRYLIC: {
    title: "Acrylic Topper Vendor",
    badgeCls: "bg-teal-500/10 text-teal-600 border-teal-500/30",
    portalRoute: "/vendor",
    portalName: "Acrylic Topper Portal",
    summary: "Custom text & silhouette cutting for custom acrylic cake toppers.",
    scopeType: "Vendor Task",
  },
};

export const PERMISSIONS_LIST: PermissionItem[] = [
  // ── 1. Orders & POS ────────────────────────────────────────────────────────
  {
    id: "view_orders",
    category: "orders",
    title: "View Customer Orders",
    description: "Browse order lists, customer details, and order progress",
    icon: Bag,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "All Branches" };
      if (role === "MANAGER") return { scope: "branch", label: "Own Branch Only" };
      if (role === "SALESPERSON") return { scope: "branch", label: "Own Branch Only" };
      if (role === "CHEF") return { scope: "task", label: "Kitchen Tickets", details: "Orders with baking items only" };
      if (role === "DELIVERY") return { scope: "task", label: "Assigned Parcels", details: "Deliveries assigned to this driver" };
      return { scope: "task", label: "Vendor Tasks", details: "Orders with vendor add-ons only" };
    },
  },
  {
    id: "pos_orders",
    category: "orders",
    title: "Counter POS & Order Creation",
    description: "Ring up sales, select sponge/flavor, print receipt, collect payment",
    icon: Shop,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "All Counters" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Counter" };
      if (role === "SALESPERSON") return { scope: "branch", label: "Primary Workflow", details: "Full POS & Billing access" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "order_overrides",
    category: "orders",
    title: "Order Cancellation & Price Overrides",
    description: "Approve special discounts, cancel placed orders, issue refunds",
    icon: ShieldSecurity,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Full Authority" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Approvals" };
      return { scope: "none", label: "No Access" };
    },
  },

  // ── 2. Kitchen & Baking (KDS) ──────────────────────────────────────────────
  {
    id: "kds_screen",
    category: "kitchen",
    title: "Kitchen Display System (KDS)",
    description: "Live kitchen terminal with incoming orders, prep timer, and queue",
    icon: Cake,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Monitor All Kitchens" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Kitchen" };
      if (role === "CHEF") return { scope: "branch", label: "Active Station", details: "Main workstation queue" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "cake_prep_stages",
    category: "kitchen",
    title: "Stage Updates (Baking → Icing → Ready)",
    description: "Move tickets through: Queued → In Oven → Decorating → Ready for Dispatch",
    icon: Cake,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Allowed" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Kitchen" };
      if (role === "CHEF") return { scope: "branch", label: "Primary Workflow" };
      return { scope: "none", label: "No Access" };
    },
  },

  // ── 3. Logistics & Delivery ────────────────────────────────────────────────
  {
    id: "driver_dispatch",
    category: "logistics",
    title: "Delivery Driver App & Route",
    description: "Customer delivery addresses, navigation link, COD collection, photo proof",
    icon: Car,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Monitor All Deliveries" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Driver Pool" };
      if (role === "SALESPERSON") return { scope: "branch", label: "Assign Counter Deliveries" };
      if (role === "DELIVERY") return { scope: "task", label: "Driver Mobile App", details: "Assigned delivery route" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "stock_transfers",
    category: "logistics",
    title: "Branch Stock Transfers",
    description: "Move inventory items between Central Factory (Warasiya) and retail branches",
    icon: TruckFast,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "All Transfers" };
      if (role === "MANAGER") return { scope: "branch", label: "Request & Receive Stock" };
      if (role === "SALESPERSON") return { scope: "branch", label: "View Incoming Stock" };
      return { scope: "none", label: "No Access" };
    },
  },

  // ── 4. Specialized Vendor Services ─────────────────────────────────────────
  {
    id: "vendor_florist",
    category: "vendors",
    title: "Fresh Flower & Bouquet Add-ons",
    description: "Prepare fresh flower arrangements and bouquets specified on custom cakes",
    icon: Brush,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "All Vendor Orders" };
      if (role === "VENDOR_FLORIST") return { scope: "task", label: "Dedicated Florist Portal", details: "Flower preparation queue" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "vendor_photo",
    category: "vendors",
    title: "Edible Cake Photo Prints",
    description: "Download high-res customer image and print food-grade sugar icing sheets",
    icon: Camera,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "All Vendor Orders" };
      if (role === "VENDOR_PHOTO") return { scope: "task", label: "Dedicated Photo Portal", details: "Download & print queue" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "vendor_acrylic",
    category: "vendors",
    title: "Custom Acrylic Cake Toppers",
    description: "Laser cut custom names, numbers, and festive silhouette acrylic toppers",
    icon: Scissor,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "All Vendor Orders" };
      if (role === "VENDOR_ACRYLIC") return { scope: "task", label: "Dedicated Acrylic Portal", details: "Topper fabrication queue" };
      return { scope: "none", label: "No Access" };
    },
  },

  // ── 5. Customers & Management ──────────────────────────────────────────────
  {
    id: "customers_crm",
    category: "management",
    title: "Customer Directory & History",
    description: "Customer phone, address, past cakes ordered, and birthday dates",
    icon: People,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Full Database" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Customers" };
      if (role === "SALESPERSON") return { scope: "branch", label: "Lookup During Billing" };
      return { scope: "none", label: "Restricted (Privacy)" };
    },
  },
  {
    id: "financial_reports",
    category: "management",
    title: "Sales Analytics & Financials",
    description: "Revenue charts, profit & loss, daily sales reconciliation, payment breakdown",
    icon: Chart,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Full Analytics & Reports" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Daily Sales" };
      if (role === "SALESPERSON") return { scope: "branch", label: "Shift Cash Summary" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "catalog_pricing",
    category: "management",
    title: "Catalog, Cakes & Pricing",
    description: "Add/edit cakes, price per kg, flavor variants, categories, design library",
    icon: Box,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Full Catalog Control" };
      if (role === "MANAGER" || role === "SALESPERSON") return { scope: "branch", label: "View Catalog & Flavors" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "settings_users",
    category: "management",
    title: "Employee Accounts & Store Settings",
    description: "Invite users, change roles, assign branch scope, configure store printers",
    icon: Setting2,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Full Control" };
      return { scope: "none", label: "Strictly Restricted" };
    },
  },
  {
    id: "inventory_management",
    category: "inventory",
    title: "Live Bakery Inventory & Stock Tracking (Master Access)",
    description: "Master access switch for inventory portal. Automatically includes counter viewing, basic inwarding & shift closing within assigned branch.",
    icon: ScanBarcode,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Full Multi-Branch & Financials" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Stock & Shift Close" };
      if (role === "SALESPERSON") return { scope: "none", label: "Restricted by Default", details: "Toggle YES to grant assigned branch inventory" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "inv_view",
    category: "inventory",
    title: "Finished Cakes & Live Counter Stock Display",
    description: "Access Live Inventory portal, view display chiller cakes, flavor variants, and live counter availability.",
    icon: Box,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Full Multi-Branch Stock" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Counter Stock" };
      if (role === "CHEF") return { scope: "branch", label: "Display Stock Reference" };
      if (role === "SALESPERSON") return { scope: "none", label: "Restricted by Default", details: "Toggle YES to allow viewing counter inventory" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "inv_inward",
    category: "inventory",
    title: "Morning Cake Inward & Thermal Barcode Printing",
    description: "Inward freshly baked counter cakes, bouquets & add-ons, generate unique serial barcodes, and print thermal adhesive labels.",
    icon: Printer,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Full Inward & Printing" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Morning Inward" };
      if (role === "CHEF") return { scope: "branch", label: "Bake Dispatch Inward" };
      if (role === "SALESPERSON") return { scope: "none", label: "Restricted by Default", details: "Toggle YES if salesperson inwards morning dispatch" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "inv_hot_bakes",
    category: "inventory",
    title: "Hot Bakes, Puffs & Patties Management",
    description: "Manage morning oven hot bakes, quantity-based puffs & patties (non-barcoded batch counters).",
    icon: Shop,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "All Outlets & Kitchens" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Hot Bakes Counter" };
      if (role === "CHEF") return { scope: "branch", label: "Oven Batch Inward" };
      if (role === "SALESPERSON") return { scope: "none", label: "Restricted by Default", details: "Toggle YES if salesperson manages puff batch counts" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "inv_brownie_trays",
    category: "inventory",
    title: "Brownie Trays & Slicing Log",
    description: "Log whole brownie slab deliveries, track cut piece counts (16/24/32), and monitor shelf life.",
    icon: Cake,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "All Brownie Trays" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Brownie Slices" };
      if (role === "CHEF") return { scope: "branch", label: "Kitchen Tray Slicing" };
      if (role === "SALESPERSON") return { scope: "none", label: "Restricted by Default", details: "Toggle YES if salesperson manages brownie counter" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "inv_kitchen_prep",
    category: "inventory",
    title: "Kitchen Prep Stocks (Sponges & Creams)",
    description: "Track chocolate/vanilla sponge bases, whipped cream, chocolate ganache, and minimum prep stock alerts.",
    icon: Layer,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Central Factory & All Preps" };
      if (role === "CHEF") return { scope: "branch", label: "Kitchen Prep Authority" };
      if (role === "MANAGER") return { scope: "branch", label: "View Kitchen Preps" };
      return { scope: "none", label: "Strictly Restricted to Kitchen" };
    },
  },
  {
    id: "inv_raw_ingredients",
    category: "inventory",
    title: "Raw Ingredients & Pantry Thresholds",
    description: "Monitor flour, dairy, cocoa powder, butter slabs, and minimum re-order inventory alert levels.",
    icon: Category,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Full Factory & Store Stock" };
      if (role === "CHEF") return { scope: "branch", label: "Bakery Pantry Stock" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Pantry Stock" };
      return { scope: "none", label: "Strictly Restricted" };
    },
  },
  {
    id: "inv_eod_closing",
    category: "inventory",
    title: "End-of-Day (EOD) Store Closing Wizard",
    description: "Reconcile counter leftovers (discard / staff meal / rollover), verify chiller displays, and record register cash shift.",
    icon: Timer1,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Full Closing Authority" };
      if (role === "MANAGER") return { scope: "branch", label: "Night Shift Reconciliation" };
      if (role === "SALESPERSON") return { scope: "none", label: "Restricted by Default", details: "Toggle YES to allow counter staff to run EOD closing" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "inv_spoilage_damage",
    category: "inventory",
    title: "Report Spoilage, Melting & Damaged Items",
    description: "Mark damaged, melted, or expired display cakes with reason tags and monitor wastage loss.",
    icon: Danger,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Full Wastage Auditing" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Damage Reporting" };
      if (role === "CHEF") return { scope: "branch", label: "Kitchen Wastage Log" };
      if (role === "SALESPERSON") return { scope: "none", label: "Restricted by Default", details: "Toggle YES to let sales report melted/damaged cakes" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "inv_edit_delete",
    category: "inventory",
    title: "Modify Details & Delete Inventory Items",
    description: "Edit cake prices, weights, flavors, best before dates, or permanently delete incorrect stock entries.",
    icon: Edit2,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Full Edit & Delete Authority" };
      if (role === "MANAGER") return { scope: "none", label: "Restricted by Default", details: "Toggle YES to allow correcting price/stock errors" };
      return { scope: "none", label: "Strictly Restricted to prevent accidental deletion" };
    },
  },
  {
    id: "inv_dead_stock",
    category: "inventory",
    title: "Dead Stock & Daily Movement Register",
    description: "Audit slow-moving cakes older than 48 hours, locked capital, and daily formula movement ledger.",
    icon: Flash,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Full Dead Stock & Movement" };
      if (role === "MANAGER") return { scope: "branch", label: "Branch Movement Register" };
      if (role === "SALESPERSON") return { scope: "none", label: "Restricted by Default", details: "Toggle YES to view slow-moving cakes" };
      return { scope: "none", label: "No Access" };
    },
  },
  {
    id: "inv_financials",
    category: "inventory",
    title: "Revenue Realization & Counter Discounts (Confidential)",
    description: "View total sale revenue realized on inventory items, counter discount deductions, and profit realization rate.",
    icon: Chart,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Confidential Store Financials" };
      if (role === "MANAGER") return { scope: "none", label: "Restricted by Default", details: "Toggle YES only if manager has revenue visibility" };
      return { scope: "none", label: "Strictly Confidential (Admin Only)" };
    },
  },
  {
    id: "inv_ca_monthly_report",
    category: "inventory",
    title: "Monthly CA Tax & Valuation Statement (Confidential)",
    description: "Generate and export official monthly inventory valuation, scrap loss write-offs, and certified audit statement for CA.",
    icon: ArchiveBook,
    evaluator: (role) => {
      if (role === "ADMIN") return { scope: "global", label: "Official Tax & CA Audit Statement" };
      return { scope: "none", label: "Strictly Confidential (Rishi Bhai / Admin Only)" };
    },
  },
];

const CATEGORY_TABS = [
  { id: "all", label: "All Permissions" },
  { id: "inventory", label: "🎂 Bakery Inventory (13)" },
  { id: "orders", label: "🛒 Orders & POS" },
  { id: "kitchen", label: "👨‍🍳 Kitchen (KDS)" },
  { id: "logistics", label: "🚚 Logistics" },
  { id: "vendors", label: "🌸 Vendor Add-ons" },
  { id: "management", label: "⚙️ Management" },
] as const;

const CATEGORY_HEADERS: Record<string, { label: string; icon: string; count: number }> = {
  inventory: { label: "Bakery Inventory Access (13 Features)", icon: "🎂", count: 13 },
  orders: { label: "Orders & POS Counter", icon: "🛒", count: 3 },
  kitchen: { label: "Kitchen & KDS Screens", icon: "👨‍🍳", count: 2 },
  logistics: { label: "Logistics & Delivery Riders", icon: "🚚", count: 2 },
  vendors: { label: "Vendor Supplies & Add-ons", icon: "🌸", count: 3 },
  management: { label: "Store Management & Settings", icon: "⚙️", count: 4 },
};

interface RoleCapabilitiesProps {
  role: Role;
  assignedBranchName?: string | null;
  deliveryScope?: string | null;
  customPermissions?: string | null;
  onCustomPermissionsChange?: (updatedJson: string) => void;
  editable?: boolean;
}

export function RoleCapabilities({
  role,
  assignedBranchName,
  deliveryScope,
  customPermissions,
  onCustomPermissionsChange,
  editable = true,
}: RoleCapabilitiesProps) {
  const roleInfo = ROLE_DETAILS[role] || ROLE_DETAILS.SALESPERSON;
  const [activeTab, setActiveTab] = React.useState<string>("all");

  const overrides: Record<string, boolean> = React.useMemo(() => {
    if (!customPermissions) return {};
    try {
      return typeof customPermissions === "string" ? JSON.parse(customPermissions) : customPermissions;
    } catch {
      return {};
    }
  }, [customPermissions]);

  const handleToggle = (id: string, value: boolean) => {
    if (!onCustomPermissionsChange) return;
    const nextOverrides = { ...overrides, [id]: value };
    onCustomPermissionsChange(JSON.stringify(nextOverrides));
  };

  const handleGrantAll = () => {
    if (!onCustomPermissionsChange) return;
    const nextOverrides: Record<string, boolean> = {};
    PERMISSIONS_LIST.forEach((p) => {
      nextOverrides[p.id] = true;
    });
    onCustomPermissionsChange(JSON.stringify(nextOverrides));
  };

  const handleRevokeAll = () => {
    if (!onCustomPermissionsChange) return;
    const nextOverrides: Record<string, boolean> = {};
    PERMISSIONS_LIST.forEach((p) => {
      nextOverrides[p.id] = false;
    });
    onCustomPermissionsChange(JSON.stringify(nextOverrides));
  };

  const handleResetDefaults = () => {
    if (!onCustomPermissionsChange) return;
    onCustomPermissionsChange("");
  };

  const filteredItems = React.useMemo(() => {
    if (activeTab === "all") return PERMISSIONS_LIST;
    return PERMISSIONS_LIST.filter((p) => p.category === activeTab);
  }, [activeTab]);

  // Count granted vs denied with custom overrides considered
  const stats = React.useMemo(() => {
    let granted = 0;
    let denied = 0;
    let customCount = 0;
    for (const item of PERMISSIONS_LIST) {
      const defaultAllowed = item.evaluator(role).scope !== "none";
      const overrideVal = overrides[item.id];
      const isAllowed = overrideVal !== undefined ? overrideVal : defaultAllowed;
      if (overrideVal !== undefined && overrideVal !== defaultAllowed) {
        customCount++;
      }
      if (isAllowed) granted++;
      else denied++;
    }
    return { granted, denied, customCount };
  }, [role, overrides]);

  const isGlobalDelivery =
    role === "DELIVERY" &&
    (deliveryScope === "ALL_BRANCHES" ||
      deliveryScope === "GLOBAL" ||
      assignedBranchName?.toLowerCase().includes("global") ||
      assignedBranchName?.toLowerCase().includes("all"));

  return (
    <div className="space-y-4">
      {/* ── Role Identity Card ────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.badgeCls}`}>
              {roleInfo.title}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Default Portal: <strong className="text-foreground">{roleInfo.portalRoute}</strong> ({roleInfo.portalName})
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 font-bold">
              {stats.granted} Allowed (YES)
            </span>
            <span className="text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 font-bold">
              {stats.denied} Denied (NO)
            </span>
            {stats.customCount > 0 && (
              <span className="text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30 font-bold">
                ⚡ {stats.customCount} Custom Overrides
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">
          {roleInfo.summary}
        </p>

        {/* Scope Context Banner */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <InfoCircle className="w-4 h-4 text-primary shrink-0" />
            <span>
              Effective Data Scope:{" "}
              {role === "ADMIN" ? (
                <strong className="text-emerald-600">Global (All branches & central operations)</strong>
              ) : isGlobalDelivery ? (
                <strong className="text-emerald-600">🌐 Global Delivery (All branches covered)</strong>
              ) : role.startsWith("VENDOR_") ? (
                <strong className="text-amber-600">Task-Isolated (Only sees assigned custom items)</strong>
              ) : assignedBranchName ? (
                <strong className="text-blue-600">Restricted to {assignedBranchName}</strong>
              ) : (
                <strong className="text-destructive">⚠️ Unassigned (User will have zero branch access)</strong>
              )}
            </span>
          </div>
        </div>

        {/* Quick Override Controls */}
        {editable && onCustomPermissionsChange && (
          <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Admin Access Controls:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGrantAll}
                className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md border border-emerald-500/30 transition-colors cursor-pointer"
              >
                Grant All (YES)
              </button>
              <button
                type="button"
                onClick={handleRevokeAll}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 rounded-md border border-rose-500/30 transition-colors cursor-pointer"
              >
                Revoke All (NO)
              </button>
              {stats.customCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 rounded-md border border-amber-500/30 transition-colors cursor-pointer"
                >
                  Reset to Role Defaults
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Category Filters ────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Permissions Grid ────────────────────────────────────────── */}
      <div className="space-y-2">
        {filteredItems.map((item, index) => {
          const defaultEval = item.evaluator(role);
          const defaultAllowed = defaultEval.scope !== "none";
          const overrideVal = overrides[item.id];
          const isEffectiveAllowed = overrideVal !== undefined ? overrideVal : defaultAllowed;
          const isOverridden = overrideVal !== undefined && overrideVal !== defaultAllowed;
          const IconComponent = item.icon;

          const prevItem = index > 0 ? filteredItems[index - 1] : null;
          const showCatHeader = activeTab === "all" && (!prevItem || prevItem.category !== item.category);
          const catInfo = CATEGORY_HEADERS[item.category];

          return (
            <React.Fragment key={item.id}>
              {showCatHeader && catInfo && (
                <div className="pt-4 pb-1.5 flex items-center justify-between border-b border-border/60 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground font-black">
                    <span className="text-sm">{catInfo.icon}</span>
                    <span>{catInfo.label}</span>
                  </span>
                  <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    {catInfo.count} controls
                  </span>
                </div>
              )}
              <div
                className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-all ${
                  isEffectiveAllowed
                    ? isOverridden
                      ? "bg-emerald-500/[0.04] border-emerald-500/40 shadow-xs"
                      : "bg-card border-border hover:border-primary/40 shadow-xs"
                    : isOverridden
                    ? "bg-rose-500/[0.04] border-rose-500/40"
                    : "bg-muted/20 border-border/60 opacity-70 hover:opacity-90"
                }`}
              >
                {/* Left icon & texts */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isEffectiveAllowed
                        ? defaultEval.scope === "global"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : defaultEval.scope === "branch"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-amber-500/10 text-amber-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-foreground leading-snug">
                        {item.title}
                      </p>
                      {isOverridden && (
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                            isEffectiveAllowed
                              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-700 border-rose-500/30"
                          }`}
                        >
                          {isEffectiveAllowed ? "⚡ Admin Granted" : "⛔ Admin Revoked"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Role Default: <strong className="text-foreground">{defaultEval.label}</strong>
                      </span>
                      {defaultEval.details && (
                        <span className="text-[10px] text-primary/80 font-medium">
                          ↳ {defaultEval.details}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right interactive YES / NO toggle button */}
                <div className="shrink-0 flex items-center pl-2">
                  {editable && onCustomPermissionsChange ? (
                    <div className="flex items-center gap-1 bg-muted/80 p-0.5 sm:p-1 rounded-xl border border-border shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id, true)}
                        className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          isEffectiveAllowed
                            ? "bg-emerald-600 text-white shadow-xs font-black ring-1 ring-emerald-500"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                        }`}
                        title={`Grant "${item.title}" to this user`}
                      >
                        <TickCircle className="w-3.5 h-3.5" variant={isEffectiveAllowed ? "Bold" : "Linear"} />
                        YES
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id, false)}
                        className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          !isEffectiveAllowed
                            ? "bg-rose-600 text-white shadow-xs font-black ring-1 ring-rose-500"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                        }`}
                        title={`Revoke "${item.title}" from this user`}
                      >
                        <CloseCircle className="w-3.5 h-3.5" variant={!isEffectiveAllowed ? "Bold" : "Linear"} />
                        NO
                      </button>
                    </div>
                  ) : (
                    <div>
                      {isEffectiveAllowed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-md">
                          <TickCircle className="w-3.5 h-3.5 shrink-0" variant="Bold" />
                          YES (Allowed)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md">
                          <CloseCircle className="w-3.5 h-3.5 shrink-0" />
                          NO (Denied)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// Backward compatibility export
export const ROLE_META = Object.fromEntries(
  Object.entries(ROLE_DETAILS).map(([role, val]) => [
    role,
    {
      label: val.title,
      color: val.badgeCls,
      icon: null,
      scope: val.summary,
    },
  ])
) as any;
