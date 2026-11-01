"use client"

import { useState, useMemo } from "react"
import { useOrders, type Order, type OrderStatus } from "@/context/OrderContext"
import { DataTable, type ColumnDef, type RowAction, type ToolbarFilter, type BulkAction } from "@/components/ui/data-table"
import { PageHeader } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Car,
  Shop,
  Bag,
  Call,
  Eye,
  CloseCircle,
  TickCircle,
  Element4,
  TextalignJustifycenter,
  Receipt21,
  TruckFast,
  Refresh2,
  Calendar,
  Buildings2
} from "iconsax-react"
import { ReceiptStub } from "@/app/sales/pos/components/ReceiptStub"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { OrderDetailsDialog } from "@/components/admin/orders/OrderDetailsDialog"
import { ReassignDriverDialog } from "@/components/admin/orders/ReassignDriverDialog"
import { AdminQuoteDialog } from "@/components/admin/orders/AdminQuoteDialog"
import { BRANCHES, toBranchId, type BranchId } from "@/lib/branches"
import { matchesDayFilter } from "@/lib/formatTime"
import Link from "next/link"

// ─── Status Config ────────────────────────────────────────────────────────────
// Source of truth for label + badge variant.
// Hex colors from original STATUS_COLOR map have been removed and replaced with
// semantic Design System variants.

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info" }> = {
  QUOTE_DRAFT:         { label: "Quote Draft",  variant: "warning" },
  QUOTE_SENT:          { label: "Quote Sent",   variant: "info" },
  QUOTE_APPROVED:      { label: "Quote Approved", variant: "success" },
  NEW:                 { label: "NEW",          variant: "info" },
  DRAFT:               { label: "Draft",        variant: "secondary" },
  WAITING_FOR_CHEF:    { label: "Waiting",      variant: "warning" },
  CHEF_ACCEPTED:       { label: "Accepted",     variant: "warning" },
  MAKING:              { label: "MAKING",       variant: "warning" },
  DECORATING:          { label: "DECORATING",   variant: "secondary" },
  READY_FOR_PICKUP:    { label: "Ready",        variant: "success" },
  PENDING_ASSIGNMENT:  { label: "Dispatch",     variant: "info" },
  ASSIGNED_TO_DRIVER:  { label: "Assigned",     variant: "info" },
  PICKED_UP:           { label: "Picked Up",    variant: "info" },
  ON_THE_WAY:          { label: "On the Way",   variant: "info" },
  DELIVERED:           { label: "DELIVERED",    variant: "success" },
  FAILED_DELIVERY:     { label: "FAILED_DELIVERY", variant: "destructive" },
  CANCELLED:           { label: "CANCELLED",    variant: "destructive" },
  COMPLETED:           { label: "Completed",    variant: "success" },
}

const BOARD_COLUMNS: { label: string; statuses: string[] }[] = [
  { label: "Quotes & Inquiries", statuses: ["QUOTE_DRAFT", "QUOTE_SENT"] },
  { label: "New & Draft",      statuses: ["NEW", "DRAFT", "QUOTE_APPROVED"] },
  { label: "In Kitchen",       statuses: ["WAITING_FOR_CHEF", "CHEF_ACCEPTED", "MAKING", "DECORATING"] },
  { label: "Ready",            statuses: ["READY_FOR_PICKUP", "PENDING_ASSIGNMENT"] },
  { label: "Out for Delivery", statuses: ["ASSIGNED_TO_DRIVER", "PICKED_UP", "ON_THE_WAY"] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string) {
  if (!dateStr) return ""
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m ago`
}

function formatTimeTarget(dateStr: string) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: "numeric", minute: "2-digit", hour12: true })
}

function OrderTypeIcon({ type }: { type: string }) {
  if (type === "delivery")  return <Car      className="w-3.5 h-3.5 text-primary/70" />
  if (type === "pickup")    return <Shop     className="w-3.5 h-3.5 text-amber-600" />
  if (type === "walk_in")   return <Bag className="w-3.5 h-3.5 text-emerald-600" />
  if (type === "phone")     return <Call     className="w-3.5 h-3.5 text-blue-600" />
  return null
}

// ─── DataTable column definitions ────────────────────────────────────────────

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => (
      <div>
        <div className="font-bold text-foreground text-xs">{row.original.orderNumber || row.original.id}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <Clock className="w-3 h-3" />
          {formatTimeAgo(row.original.createdAt)}
        </div>
      </div>
    ),
    size: 140,
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-sm">{row.original.customerName}</div>
        <div className="text-xs text-muted-foreground">{row.original.customerPhone}</div>
      </div>
    ),
  },
  {
    accessorKey: "items",
    header: "Items",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="max-w-[200px]">
        <p className="truncate text-sm">
          {row.original.items?.map((i: any) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ")}
        </p>
        {row.original.priorityLevel === "high" && (
          <Badge variant="destructive" className="text-[10px] mt-0.5">URGENT</Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "branch",
    header: "Branch",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <OrderTypeIcon type={row.original.orderType} />
        <span>{row.original.branch}</span>
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const cfg = STATUS_CONFIG[row.original.status]
      return <Badge variant={cfg?.variant ?? "secondary"}>{cfg?.label ?? row.original.status}</Badge>
    },
    filterFn: "equals",
    size: 120,
  },
  {
    accessorKey: "grandTotal",
    header: "Amount",
    cell: ({ row }) => (
      <span className="font-bold text-primary text-sm">
        ₹{row.original.grandTotal?.toFixed(0)}
      </span>
    ),
    size: 90,
  },
  {
    accessorKey: "timeTarget",
    header: "Deadline",
    cell: ({ row }) => (
      <span className="text-xs font-semibold">{formatTimeTarget(row.original.timeTarget)}</span>
    ),
    size: 90,
  },
]

// ─── Filter options ───────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = Object.entries(STATUS_CONFIG).map(([val, cfg]) => ({
  value: val,
  label: cfg.label,
}))

const tableFilters: ToolbarFilter[] = [
  { columnId: "status", label: "Status", options: STATUS_FILTER_OPTIONS },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveOrdersPage() {
  const { orders, transitionOrderAction, refetchOrders } = useOrders()
  const [view, setView] = useState<"board" | "list">("board")
  const [selectedBranch, setSelectedBranch] = useState<BranchId | "all">("all")
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'TOMORROW' | 'YESTERDAY' | 'ALL'>('TODAY')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [quoteDialogOrderId, setQuoteDialogOrderId] = useState<string | null>(null)
  const [reassignOrderId, setReassignOrderId] = useState<string | null>(null)
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null)

  // 1-Tap Admin Action handler
  const handleCardAction = async (e: React.MouseEvent, orderId: string, actionVerb: string) => {
    e.stopPropagation()
    setLoadingOrderId(orderId)
    try {
      await transitionOrderAction(orderId, actionVerb)
    } finally {
      setLoadingOrderId(null)
    }
  }

  // Live Refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetchOrders()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Row actions — preserve existing business logic, wrapped in Design System pattern
  const rowActions: RowAction<Order>[] = [
    {
      label: "View Details",
      icon: Eye,
      onClick: (order) => {
        setSelectedOrderId(order.id)
      },
    },
    {
      label: "View / Print Bill",
      icon: Receipt21,
      onClick: (order) => {
        setReceiptOrderId(order.id)
      },
    },
    {
      label: "Mark Ready",
      icon: TickCircle,
      onClick: (order) => transitionOrderAction(order.id, "ready"),
      hidden: (order) => ["DELIVERED", "CANCELLED", "FAILED_DELIVERY", "READY_FOR_PICKUP", "COMPLETED"].includes(order.status as any),
    },
    {
      label: "Reassign",
      icon: TickCircle,
      onClick: (order) => setReassignOrderId(order.id),
      hidden: (order) => (order.status as any) !== "FAILED_DELIVERY",
    },
    {
      label: "Cancel Order",
      icon: CloseCircle,
      variant: "destructive",
      onClick: (order) => transitionOrderAction(order.id, "cancel", "Cancelled by Admin"),
      hidden: (order) => ["DELIVERED", "CANCELLED", "FAILED_DELIVERY", "COMPLETED"].includes(order.status as any),
    },
  ]

  const bulkActions: BulkAction<Order>[] = [
    {
      label: "Cancel Selected",
      variant: "destructive",
      icon: CloseCircle,
      onAction: async (rows) => {
        await Promise.all(rows.map((o) => transitionOrderAction(o.id, "cancel", "Bulk cancelled by Admin")))
      },
    },
  ]

  // Branch & Date counts
  const branchCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length }
    for (const b of BRANCHES) {
      counts[b.id] = orders.filter((o) => toBranchId(o.branch) === b.id).length
    }
    return counts
  }, [orders])

  const dateCounts = useMemo(() => {
    const branchFiltered =
      selectedBranch === "all"
        ? orders
        : orders.filter((o) => toBranchId(o.branch) === selectedBranch)

    return {
      TODAY: branchFiltered.filter((o) => matchesDayFilter(o.timeTarget, "TODAY")).length,
      TOMORROW: branchFiltered.filter((o) => matchesDayFilter(o.timeTarget, "TOMORROW")).length,
      YESTERDAY: branchFiltered.filter((o) => matchesDayFilter(o.timeTarget, "YESTERDAY")).length,
      ALL: branchFiltered.length,
    }
  }, [orders, selectedBranch])

  // Filtered orders respecting BOTH branch & date selection
  const filteredOrders = useMemo(() => {
    return [...orders]
      .filter((o) => {
        if (selectedBranch !== "all" && toBranchId(o.branch) !== selectedBranch) return false
        if (dateFilter !== "ALL" && !matchesDayFilter(o.timeTarget, dateFilter)) return false
        return true
      })
      .sort((a, b) => new Date(a.timeTarget).getTime() - new Date(b.timeTarget).getTime())
  }, [orders, selectedBranch, dateFilter])

  const activeOrders = useMemo(() => {
    return filteredOrders.filter(
      (o) => !["DELIVERED", "FAILED_DELIVERY", "CANCELLED", "COMPLETED"].includes(o.status)
    )
  }, [filteredOrders])

  const archivedOrders = useMemo(() => {
    return filteredOrders.filter((o) =>
      ["DELIVERED", "FAILED_DELIVERY", "CANCELLED", "COMPLETED"].includes(o.status)
    )
  }, [filteredOrders])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Live Orders"
        description={`${filteredOrders.length} orders displayed (${activeOrders.length} active) — real-time from Supabase`}
        actions={
          <div className="flex items-center gap-4">
            <div className="flex bg-secondary p-1 rounded-lg">
              <button
                onClick={() => setView("board")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  view === "board" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Element4 className="w-4 h-4" /> Board
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  view === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TextalignJustifycenter className="w-4 h-4" /> List
              </button>
            </div>
          </div>
        }
      />

      {/* ── Branch & Date Filters Toolbar ────────────────────────────────── */}
      <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs space-y-3">
        {/* Branch Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mr-1">
            <Buildings2 className="w-3.5 h-3.5 text-primary" /> Branch:
          </span>
          <button
            onClick={() => setSelectedBranch("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              selectedBranch === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <span>All Branches</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px]",
              selectedBranch === "all" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
            )}>
              {branchCounts.all ?? 0}
            </span>
          </button>
          {BRANCHES.map((b) => {
            const count = branchCounts[b.id] ?? 0
            const active = selectedBranch === b.id
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBranch(b.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <span>{b.shortName}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px]",
                  active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Date Filters + Live Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" /> Date:
            </span>
            {(
              [
                { id: "TODAY", label: "Daily (Today)", count: dateCounts.TODAY },
                { id: "TOMORROW", label: "Tomorrow", count: dateCounts.TOMORROW },
                { id: "YESTERDAY", label: "Yesterday", count: dateCounts.YESTERDAY },
                { id: "ALL", label: "All Dates", count: dateCounts.ALL },
              ] as const
            ).map((df) => {
              const active = dateFilter === df.id
              return (
                <button
                  key={df.id}
                  onClick={() => setDateFilter(df.id)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                    active
                      ? df.id === "TODAY"
                        ? "bg-amber-500 text-white shadow-xs"
                        : df.id === "TOMORROW"
                        ? "bg-blue-600 text-white shadow-xs"
                        : df.id === "YESTERDAY"
                        ? "bg-slate-700 text-white shadow-xs"
                        : "bg-foreground text-background shadow-xs"
                      : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <span>{df.label}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px]",
                    active ? "bg-black/20 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {df.count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Filtered: <strong>{filteredOrders.length}</strong> orders
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Refresh Live Orders"
              className={cn(
                "p-1.5 rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer",
                isRefreshing && "animate-spin text-primary"
              )}
            >
              <Refresh2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Board View ─────────────────────────────────────────────────── */}
      {view === "board" && (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ maxHeight: "calc(100vh - 15rem)" }}>
          {BOARD_COLUMNS.map((col) => {
            const colOrders = filteredOrders
              .filter((o) => col.statuses.includes(o.status))
              .sort((a, b) => new Date(a.timeTarget).getTime() - new Date(b.timeTarget).getTime())
            return (
              <div
                key={col.label}
                className="flex-none w-72 bg-secondary/30 rounded-xl border border-border/50 flex flex-col h-full"
              >
                <div className="p-4 border-b border-border/50 shrink-0 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    {col.label}
                    <span className="bg-background text-muted-foreground text-xs px-2 py-0.5 rounded-full font-bold border border-border">
                      {colOrders.length}
                    </span>
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <AnimatePresence initial={false}>
                    {colOrders.map((order) => {
                      const isOrderLoading = loadingOrderId === order.id
                      return (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => setSelectedOrderId(order.id)}
                          className="bg-card border border-border p-3.5 rounded-xl shadow-sm hover:border-primary/50 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="font-bold text-foreground text-xs">{order.orderNumber || order.id}</span>
                              {order.isSurprise && (
                                <Badge variant="secondary" className="ml-1.5 text-[9px]">Surprise</Badge>
                              )}
                              {order.priorityLevel === "high" && (
                                <Badge variant="destructive" className="ml-1.5 text-[9px]">Urgent</Badge>
                              )}
                            </div>
                            <Badge variant={STATUS_CONFIG[order.status]?.variant ?? "secondary"}>
                              {STATUS_CONFIG[order.status]?.label ?? order.status}
                            </Badge>
                          </div>
                          <p className="font-semibold text-sm text-foreground truncate">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {order.items?.map((i: any) => `${i.name}${i.weight ? ` (${i.weight})` : ""}`).join(", ")}
                          </p>
                          <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <OrderTypeIcon type={order.orderType} />
                              <span className="font-medium">{order.branch}</span>
                            </div>
                            <div className="flex items-center gap-1 font-bold text-foreground">
                              <Clock className="w-3 h-3" />
                              {formatTimeTarget(order.timeTarget)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(order.createdAt)}</span>
                            <span className="font-black text-sm text-primary">₹{order.grandTotal?.toFixed(0)}</span>
                          </div>

                          {/* ── 1-Tap Universal Admin Actions ── */}
                          <div
                            className="mt-2.5 pt-2 border-t border-border/50 flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* SALES ACTIONS */}
                            {order.status === "QUOTE_DRAFT" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setQuoteDialogOrderId(order.id)
                                }}
                                className="flex-1 text-center py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                              >
                                Set Price & Approve &rarr;
                              </button>
                            )}
                            {order.status === "QUOTE_SENT" && (
                              <button
                                onClick={(e) => handleCardAction(e, order.id, "approve")}
                                disabled={isOrderLoading}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                              >
                                {isOrderLoading ? "Updating…" : "Approve → Kitchen"}
                              </button>
                            )}
                            {(order.status === "NEW" || order.status === "DRAFT" || order.status === "QUOTE_APPROVED") && (
                              <button
                                onClick={(e) => handleCardAction(e, order.id, "approve")}
                                disabled={isOrderLoading}
                                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                              >
                                {isOrderLoading ? "Updating…" : "Send to Kitchen"}
                              </button>
                            )}

                            {/* CHEF / KITCHEN ACTIONS */}
                            {order.status === "WAITING_FOR_CHEF" && (
                              <button
                                onClick={(e) => handleCardAction(e, order.id, "chef-accept")}
                                disabled={isOrderLoading}
                                className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                              >
                                {isOrderLoading ? "Updating…" : "Accept Ticket"}
                              </button>
                            )}
                            {order.status === "CHEF_ACCEPTED" && (
                              <button
                                onClick={(e) => handleCardAction(e, order.id, "start-making")}
                                disabled={isOrderLoading}
                                className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                              >
                                {isOrderLoading ? "Updating…" : "Start Baking"}
                              </button>
                            )}
                            {order.status === "MAKING" && (
                              <button
                                onClick={(e) => handleCardAction(e, order.id, "start-decorating")}
                                disabled={isOrderLoading}
                                className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                              >
                                {isOrderLoading ? "Updating…" : "Start Decorating"}
                              </button>
                            )}
                            {order.status === "DECORATING" && (
                              <button
                                onClick={(e) => handleCardAction(e, order.id, "ready")}
                                disabled={isOrderLoading}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                              >
                                {isOrderLoading ? "Updating…" : "Mark Ready"}
                              </button>
                            )}

                            {/* DISPATCH / DELIVERY / HANDOVER ACTIONS */}
                            {(order.status === "READY_FOR_PICKUP" || order.status === "PENDING_ASSIGNMENT") && (
                              <>
                                {order.orderType === "delivery" ? (
                                  <button
                                    onClick={() => setReassignOrderId(order.id)}
                                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <TruckFast className="w-3.5 h-3.5" /> Assign Driver
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => handleCardAction(e, order.id, "complete")}
                                    disabled={isOrderLoading}
                                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                                  >
                                    <TickCircle className="w-3.5 h-3.5" /> Handover / Complete
                                  </button>
                                )}
                              </>
                            )}
                            {(order.status === "ASSIGNED_TO_DRIVER" || order.status === "PICKED_UP" || order.status === "ON_THE_WAY") && (
                              <button
                                onClick={(e) => handleCardAction(e, order.id, "deliver")}
                                disabled={isOrderLoading}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                              >
                                <TickCircle className="w-3.5 h-3.5" /> Mark Delivered
                              </button>
                            )}

                            {/* Bill / Receipt Print Icon */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setReceiptOrderId(order.id)
                              }}
                              title="Print / View Bill"
                              className="p-1.5 bg-secondary/80 hover:bg-secondary text-foreground rounded-lg border border-border transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                            >
                              <Receipt21 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                  {colOrders.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground text-sm opacity-50">No orders</div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Delivered column */}
          <div className="flex-none w-72 bg-secondary/30 rounded-xl border border-border/50 flex flex-col h-full">
            <div className="p-4 border-b border-border/50 shrink-0 flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                Delivered / Done
                <span className="bg-background text-muted-foreground text-xs px-2 py-0.5 rounded-full font-bold border border-border">
                  {archivedOrders.length}
                </span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {archivedOrders.slice(0, 15).map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className="bg-card border border-border/40 p-3 rounded-xl opacity-80 text-xs hover:border-primary/40 hover:opacity-100 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{order.orderNumber || order.id}</span>
                    <Badge variant={STATUS_CONFIG[order.status]?.variant ?? "secondary"}>
                      {STATUS_CONFIG[order.status]?.label}
                    </Badge>
                  </div>
                  <p className="font-medium text-foreground truncate">{order.customerName}</p>
                  <div className="flex justify-between items-center text-muted-foreground mt-1">
                    <span>{order.branch}</span>
                    <span className="font-bold text-foreground">₹{order.grandTotal?.toFixed(0)}</span>
                  </div>
                </div>
              ))}
              {archivedOrders.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm opacity-50">No delivered orders</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── List View — powered by Design System DataTable ──────────────── */}
      {view === "list" && (
        <DataTable<Order>
          columns={columns}
          data={filteredOrders}
          label="orders"
          searchPlaceholder="Search by ID, customer, phone..."
          filters={tableFilters}
          rowActions={rowActions}
          bulkActions={bulkActions}
          exportActions={{
            onExportCSV: () => {
              const headers = ["Order ID", "Order Type", "Customer", "Phone", "Branch", "Status", "Items", "Total Amount", "Paid", "Due", "Created At", "Target Time"];
              const rows = filteredOrders.map(o => [
                o.orderNumber || o.id,
                o.orderType,
                o.customerName,
                o.customerPhone || '',
                o.branch,
                o.status,
                o.items?.map(i => `${i.qty}x ${i.name}`).join('; '),
                o.grandTotal,
                o.advancePaid,
                o.pendingBalance,
                new Date(o.createdAt).toLocaleString(),
                new Date(o.timeTarget).toLocaleString()
              ]);
              const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            },
            onExportExcel: () => {
              const headers = ["Order ID", "Order Type", "Customer", "Phone", "Branch", "Status", "Items", "Total Amount", "Paid", "Due", "Created At", "Target Time"];
              const rows = filteredOrders.map(o => [
                o.orderNumber || o.id,
                o.orderType,
                o.customerName,
                o.customerPhone || '',
                o.branch,
                o.status,
                o.items?.map(i => `${i.qty}x ${i.name}`).join('; '),
                o.grandTotal,
                o.advancePaid,
                o.pendingBalance,
                new Date(o.createdAt).toLocaleString(),
                new Date(o.timeTarget).toLocaleString()
              ]);
              const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
              const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.xls`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            },
            onExportPDF: () => {
               const win = window.open('', '_blank');
               if (!win) return;
               
               const headers = ["Order ID", "Customer", "Branch", "Status", "Total", "Due", "Target Time"];
               const rows = filteredOrders.map(o => `
                 <tr>
                   <td>${o.orderNumber || o.id}</td>
                   <td>${o.customerName}</td>
                   <td>${o.branch}</td>
                   <td>${o.status}</td>
                   <td>₹${(o.grandTotal || 0).toFixed(2)}</td>
                   <td>₹${(o.pendingBalance || 0).toFixed(2)}</td>
                   <td>${new Date(o.timeTarget).toLocaleString()}</td>
                 </tr>
               `).join('');

               win.document.write(`
                 <html>
                 <head>
                   <title>Orders Export</title>
                   <style>
                     body { font-family: sans-serif; padding: 20px; }
                     table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                     th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                     th { background-color: #f4f4f4; }
                     @media print {
                       button { display: none; }
                     }
                   </style>
                 </head>
                 <body>
                   <h2>Orders Report</h2>
                   <p>Generated on ${new Date().toLocaleString()}</p>
                   <p>Total Records: ${filteredOrders.length}</p>
                   <button onclick="window.print()">Print / Save as PDF</button>
                   <table>
                     <thead>
                       <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                     </thead>
                     <tbody>
                       ${rows}
                     </tbody>
                   </table>
                   <script>window.onload = () => window.print()</script>
                 </body>
                 </html>
               `);
               win.document.close();
            },
          }}
          renderMobileCard={(order) => (
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-sm">{order.orderNumber || order.id}</span>
                  <div className="text-xs text-muted-foreground">{formatTimeAgo(order.createdAt)}</div>
                </div>
                <Badge variant={STATUS_CONFIG[order.status]?.variant ?? "secondary"}>
                  {STATUS_CONFIG[order.status]?.label ?? order.status}
                </Badge>
              </div>
              <div>
                <div className="font-medium">{order.customerName}</div>
                <div className="text-sm text-muted-foreground">{order.items?.map((i: any) => i.name).join(", ")}</div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-bold text-primary">₹{order.grandTotal?.toFixed(0)}</span>
                <span className="text-sm">{formatTimeTarget(order.timeTarget)}</span>
              </div>
            </div>
          )}
          defaultHidden={["timeTarget"]}
          defaultPageSize={20}
          showColumnVisibility
          persistState
          debug
        />
      )}

      <OrderDetailsDialog 
        orderId={selectedOrderId} 
        isOpen={!!selectedOrderId} 
        onClose={() => setSelectedOrderId(null)} 
      />

      <AdminQuoteDialog
        orderId={quoteDialogOrderId}
        isOpen={!!quoteDialogOrderId}
        onClose={() => setQuoteDialogOrderId(null)}
      />

      {reassignOrderId && (
        <ReassignDriverDialog
          orderId={reassignOrderId}
          isOpen={!!reassignOrderId}
          onClose={() => setReassignOrderId(null)}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}

      {/* Bill & Receipt Modal */}
      {receiptOrderId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full relative p-4 max-h-[90vh] overflow-y-auto my-auto shadow-2xl">
            <button
              onClick={() => setReceiptOrderId(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10 p-1"
            >
              <CloseCircle className="w-6 h-6" />
            </button>
            <ReceiptStub orderId={receiptOrderId} onClose={() => setReceiptOrderId(null)} />
          </div>
        </div>
      )}
    </div>
  )
}
