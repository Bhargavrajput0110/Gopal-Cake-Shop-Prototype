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
  TickCircle,
  CloseCircle,
  ShieldSecurity,
  InfoCircle,
} from "iconsax-react";

export type PermissionScopeType = "global" | "branch" | "task" | "none";

export interface PermissionItem {
  id: string;
  category: "orders" | "kitchen" | "logistics" | "vendors" | "management";
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
];

const CATEGORY_TABS = [
  { id: "all", label: "All Permissions" },
  { id: "orders", label: "Orders & POS" },
  { id: "kitchen", label: "Kitchen (KDS)" },
  { id: "logistics", label: "Logistics" },
  { id: "vendors", label: "Vendor Add-ons" },
  { id: "management", label: "Management" },
] as const;

interface RoleCapabilitiesProps {
  role: Role;
  assignedBranchName?: string | null;
}

export function RoleCapabilities({ role, assignedBranchName }: RoleCapabilitiesProps) {
  const roleInfo = ROLE_DETAILS[role] || ROLE_DETAILS.SALESPERSON;
  const [activeTab, setActiveTab] = React.useState<string>("all");

  const filteredItems = React.useMemo(() => {
    if (activeTab === "all") return PERMISSIONS_LIST;
    return PERMISSIONS_LIST.filter((p) => p.category === activeTab);
  }, [activeTab]);

  // Count granted vs denied
  const stats = React.useMemo(() => {
    let granted = 0;
    let denied = 0;
    for (const item of PERMISSIONS_LIST) {
      const { scope } = item.evaluator(role);
      if (scope === "none") denied++;
      else granted++;
    }
    return { granted, denied };
  }, [role]);

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
            <span className="text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              {stats.granted} Allowed
            </span>
            <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
              {stats.denied} Denied
            </span>
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
        {filteredItems.map((item) => {
          const evalResult = item.evaluator(role);
          const isAllowed = evalResult.scope !== "none";
          const IconComponent = item.icon;

          return (
            <div
              key={item.id}
              className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-all ${
                isAllowed
                  ? "bg-card border-border hover:border-primary/40 shadow-xs"
                  : "bg-muted/20 border-border/60 opacity-60 hover:opacity-80"
              }`}
            >
              {/* Left icon & texts */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    evalResult.scope === "global"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : evalResult.scope === "branch"
                      ? "bg-blue-500/10 text-blue-600"
                      : evalResult.scope === "task"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <IconComponent className="w-4 h-4 shrink-0" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-foreground leading-snug">
                      {item.title}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                  {evalResult.details && (
                    <p className="text-[10px] text-primary/80 font-medium mt-0.5">
                      ↳ {evalResult.details}
                    </p>
                  )}
                </div>
              </div>

              {/* Right badge pill */}
              <div className="shrink-0 flex items-center pl-2">
                {evalResult.scope === "global" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-md">
                    <TickCircle className="w-3.5 h-3.5 shrink-0" variant="Bold" />
                    {evalResult.label}
                  </span>
                ) : evalResult.scope === "branch" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 rounded-md">
                    <TickCircle className="w-3.5 h-3.5 shrink-0" variant="Bold" />
                    {evalResult.label}
                  </span>
                ) : evalResult.scope === "task" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-md">
                    <TickCircle className="w-3.5 h-3.5 shrink-0" variant="Bold" />
                    {evalResult.label}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border px-2 py-1 rounded-md">
                    <CloseCircle className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    {evalResult.label}
                  </span>
                )}
              </div>
            </div>
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
