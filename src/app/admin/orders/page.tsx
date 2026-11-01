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
  Buildings2,
  User,
  Card,
  Cake,
  ClipboardText,
  DocumentText,
  Gallery,
  Gift
} from "iconsax-react"
import { ChefHat, MoreVertical } from "lucide-react"
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
    header: "Customer & Address",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-sm">{row.original.customerName}</div>
        <div className="text-xs text-muted-foreground">{row.original.customerPhone}</div>
        {row.original.deliveryAddress && (
          <div className="text-[11px] text-emerald-800 font-medium flex items-center gap-1 mt-0.5 max-w-[200px] truncate" title={row.original.deliveryAddress}>
            <Car className="w-3 h-3 shrink-0 text-emerald-600" />
            <span className="truncate">{row.original.deliveryAddress}</span>
          </div>
        )}
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
    id: "assignedStaff",
    header: "Assigned Team",
    cell: ({ row }) => {
      const o = row.original;
      return (
        <div className="flex flex-col gap-1 text-[11px] max-w-[150px]">
          {o.assignedDriverName && (
            <span className="text-indigo-700 font-bold flex items-center gap-1 truncate" title={`Driver: ${o.assignedDriverName}`}>
              <TruckFast className="w-3 h-3 shrink-0" /> {o.assignedDriverName}
            </span>
          )}
          {o.assignedChefName && (
            <span className="text-amber-800 font-bold flex items-center gap-1 truncate" title={`Chef: ${o.assignedChefName}`}>
              <ChefHat className="w-3 h-3 shrink-0" /> {o.assignedChefName}
            </span>
          )}
          {o.createdByName && (
            <span className="text-blue-700 font-medium flex items-center gap-1 truncate" title={`Sales: ${o.createdByName}`}>
              <User className="w-3 h-3 shrink-0" /> {o.createdByName}
            </span>
          )}
          {!o.assignedDriverName && !o.assignedChefName && !o.createdByName && (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </div>
      );
    },
    size: 140,
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
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)

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

  // Quick Balance Collection handler
  const handleCollectPayment = async (e: React.MouseEvent, order: Order) => {
    e.stopPropagation()
    const amountToCollect = order.pendingBalance || order.grandTotal || 0
    if (amountToCollect <= 0) {
      alert("No outstanding balance to collect.")
      return
    }
    const confirmed = window.confirm(`Collect ₹${amountToCollect.toLocaleString('en-IN')} cash payment for order #${(order as any).orderNumber || order.id}?`)
    if (!confirmed) return

    setLoadingOrderId(order.id)
    try {
      const res = await fetch(`/api/v1/orders/${order.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountToCollect, method: 'CASH' })
      })
      const data = await res.json()
      if (!data.success) {
        alert(data.error || "Failed to record payment")
        return
      }
      await refetchOrders()
      alert(`Payment of ₹${amountToCollect} collected successfully!`)
    } catch (err) {
      console.error(err)
      alert("Error recording payment")
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
    <div className="space-y-3.5">
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
      <div className="bg-card border border-border p-3 rounded-2xl shadow-xs space-y-2.5">
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
        <div
          className="flex gap-4 overflow-x-auto pb-4 items-start"
          style={{ height: "calc(100vh - 17rem)", maxHeight: "calc(100vh - 17rem)" }}
        >
          {BOARD_COLUMNS.map((col) => {
            const colOrders = filteredOrders
              .filter((o) => col.statuses.includes(o.status))
              .sort((a, b) => new Date(a.timeTarget).getTime() - new Date(b.timeTarget).getTime())
            return (
              <div
                key={col.label}
                className="flex-none w-80 sm:w-[340px] bg-secondary/30 rounded-2xl border border-border/50 flex flex-col h-full overflow-hidden"
              >
                <div className="p-3.5 border-b border-border/50 shrink-0 flex items-center justify-between bg-secondary/50">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    {col.label}
                    <span className="bg-background text-muted-foreground text-xs px-2 py-0.5 rounded-full font-bold border border-border">
                      {colOrders.length}
                    </span>
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-6">
                  <AnimatePresence initial={false}>
                    {colOrders.map((order) => {
                      const isOrderLoading = loadingOrderId === order.id
                      const firstItem = order.items?.[0]
                      const rawCardImages = [
                        ...(order.cakeImage ? [order.cakeImage] : []),
                        ...(order.items?.flatMap((i: any) => [...(i.referenceImages || []), ...(i.printImages || []), ...(i.image ? [i.image] : [])]) || [])
                      ].filter(Boolean) as string[]
                      const cardImages = Array.from(new Set(rawCardImages))
                      const cardPhoto = cardImages[0] || null
                      const cakeFlavor = firstItem?.flavor
                      const cakeWeight = firstItem?.weight
                      const cakeMessage = order.items?.map((i: any) => i.messageOnCake).filter(Boolean).join(" / ") || (order as any).messageOnCake || null
                      const customizationNote = order.items?.find((i: any) => i.notes)?.notes || (order as any).notes || (order as any).customerNotes || null

                      const isDeliveryOrder = order.orderType === 'delivery' || (order as any).deliveryType === 'DELIVERY'
                      const rawDeliveryInstructions = order.customerInstructions || (order as any).deliveryInstructions
                      const deliveryInstructions = (isDeliveryOrder && rawDeliveryInstructions && rawDeliveryInstructions.trim().toLowerCase() !== customizationNote?.trim().toLowerCase()) ? rawDeliveryInstructions : null

                      const cakeTitle = firstItem ? `${firstItem.qty > 1 ? `${firstItem.qty}x ` : ""}${firstItem.name || (firstItem as any).productName || "Custom Cake"}` : "Cake"

                      const dueDateTime = new Date(order.timeTarget)
                      const isValidDueTime = !isNaN(dueDateTime.getTime())
                      const formattedDueTime = isValidDueTime
                        ? dueDateTime.toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                          })
                        : formatTimeTarget(order.timeTarget) || "Pending Schedule"

                      const isKitchenCol = col.label === "In Kitchen" || ["WAITING_FOR_CHEF", "CHEF_ACCEPTED", "MAKING", "DECORATING"].includes(order.status)

                      if (isKitchenCol) {
                        return (
                          <motion.div
                            key={order.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={() => setSelectedOrderId(order.id)}
                            className="bg-white rounded-2xl shadow-xs overflow-hidden flex flex-col group transition-all duration-300 relative border border-amber-200/90 hover:border-amber-400 hover:shadow-md p-3.5 space-y-2.5 cursor-pointer text-slate-900"
                          >
                            {/* 1. Chef Kitchen Ticket Header */}
                            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-amber-100/80">
                              <div>
                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block leading-none">KITCHEN TICKET</span>
                                <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight leading-none mt-1">
                                  {order.orderNumber || order.id}
                                </h3>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs border ${
                                  order.status === 'WAITING_FOR_CHEF' 
                                    ? 'bg-[#FFF4E5] text-[#B45309] border-[#FCD34D]/80' 
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}>
                                  <ChefHat className="w-3.5 h-3.5 text-[#B45309]" />
                                  {order.status === 'WAITING_FOR_CHEF' ? 'WAITING FOR CHEF' : 'IN PRODUCTION'}
                                </span>

                                {order.priorityLevel === "high" && (
                                  <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider animate-pulse">
                                    Urgent
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 2. Cake Production Info (What the chef bakes) */}
                            <div className="bg-slate-50/70 rounded-xl border border-slate-200/90 p-2.5 flex items-center gap-3 shadow-2xs hover:border-slate-300 transition-all">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (cardPhoto) setZoomImageUrl(cardPhoto)
                                }}
                                className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden relative shrink-0 border border-slate-200 cursor-pointer group/thumb bg-slate-900 shadow-2xs"
                                title="Tap to zoom cake photo"
                              >
                                <img
                                  src={cardPhoto || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400"}
                                  alt={cakeTitle}
                                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover/thumb:bg-black/25 transition-colors" />
                                {cakeWeight && (
                                  <span className="absolute bottom-1 right-1 bg-black/85 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                                    {cakeWeight}
                                  </span>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight truncate leading-tight">
                                  {cakeTitle}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  {cakeWeight && (
                                    <span className="bg-slate-200/80 text-slate-900 text-[11px] font-extrabold px-2 py-0.5 rounded-md">
                                      ⚖️ {cakeWeight}
                                    </span>
                                  )}
                                  {cakeFlavor && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF0E6] text-[#78350F] text-[11px] font-black border border-[#F3E5D8]">
                                      🍰 {cakeFlavor}
                                    </span>
                                  )}
                                </div>
                                {(firstItem as any)?.shape && (
                                  <p className="text-[11px] font-bold text-slate-500 mt-1">
                                    Shape: <span className="text-slate-900 font-extrabold">{(firstItem as any).shape}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* 3. Customer Reference Design Photos (Critical for Kitchen Decorator) */}
                            {cardImages.length > 0 && (
                              <div className="p-2.5 bg-blue-50/40 rounded-xl border border-blue-200/70 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1">
                                    <Gallery className="w-3.5 h-3.5 text-blue-600" /> Reference Design Photos ({cardImages.length})
                                  </span>
                                  <span className="text-[9px] font-black text-blue-600">Tap photo to zoom</span>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                  {cardImages.map((img, rIdx) => (
                                    <div
                                      key={`k-ref-${rIdx}`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setZoomImageUrl(img)
                                      }}
                                      className="w-14 h-14 rounded-lg overflow-hidden border-2 border-blue-300 hover:border-blue-600 transition-all shadow-2xs shrink-0 cursor-pointer relative group/ref"
                                      title="Click to view reference photo full screen"
                                    >
                                      <img src={img} alt={`Ref ${rIdx + 1}`} className="w-full h-full object-cover group-hover/ref:scale-110 transition-transform" />
                                      <div className="absolute inset-0 bg-black/10 group-hover/ref:bg-transparent transition-colors" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 4. 🎂 WRITE ON CAKE (Prominent Pink Box for Chef) */}
                            {cakeMessage && (
                              <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3 flex items-start gap-2.5 shadow-2xs">
                                <Cake size={22} color="#E11D48" variant="Bold" className="shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 block leading-tight">
                                    WRITE ON CAKE
                                  </span>
                                  <p className="font-mono font-black text-rose-950 text-base sm:text-lg mt-0.5 break-words leading-snug">
                                    &ldquo;{cakeMessage}&rdquo;
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* 5. 📋 KITCHEN INSTRUCTIONS / CUSTOMIZATION NOTE (Bold Amber Box with Red Text) */}
                            {customizationNote && (
                              <div className="bg-[#FEFCE8] border-2 border-[#FEF08A] rounded-xl p-3 flex items-start gap-2.5 shadow-2xs">
                                <ClipboardText size={22} color="#D97706" variant="Bold" className="shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 block leading-tight">
                                    KITCHEN INSTRUCTIONS
                                  </span>
                                  <p className="text-sm font-black text-[#DC2626] mt-0.5 break-words leading-snug">
                                    &ldquo;{customizationNote}&rdquo;
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* 6. READY BY (DUE TIME) */}
                            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-2xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                                  <Clock size={16} color="#047857" variant="Bold" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[8px] font-black uppercase tracking-wider text-emerald-800 block leading-none">
                                    READY BY (DUE TIME)
                                  </span>
                                  <p className="text-xs sm:text-sm font-black text-emerald-950 tracking-tight mt-0.5 whitespace-nowrap">
                                    {formattedDueTime}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100/90 text-emerald-900">
                                  {order.branch}
                                </span>
                                <span className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                                  {formatTimeAgo(order.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* 6.1 Delivery Address (if Delivery) */}
                            {isDeliveryOrder && (order.deliveryAddress || (order as any).delivery?.address) && (
                              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-2.5 flex items-start gap-2 shadow-2xs">
                                <Car size={15} color="#059669" variant="Bold" className="shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-[8px] font-black uppercase tracking-wider text-emerald-700 block leading-tight">
                                    DELIVERY ADDRESS
                                  </span>
                                  <p className="text-xs font-bold text-slate-900 leading-snug mt-0.5 break-words">
                                    {order.deliveryAddress || (order as any).delivery?.address}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* 6.2 Staff & Stage Responsibility Strip */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5 shadow-2xs text-[11px]">
                              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-200/60">
                                <span>Responsible Team</span>
                                <span className="text-amber-700 font-extrabold">{col.label}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {(order.createdByName || order.createdBy) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[10px]">
                                    <User size={11} variant="Bold" /> Sales: {order.createdByName || order.createdBy}
                                  </span>
                                )}
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border text-[10px] ${
                                  (order.assignedChefName || order.assignedChef)
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-amber-50/50 text-amber-600 border-dashed border-amber-300'
                                }`}>
                                  <ChefHat className="w-3 h-3" /> Chef: {order.assignedChefName || order.assignedChef || 'Waiting for Chef'}
                                </span>
                                {isDeliveryOrder && (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border text-[10px] ${
                                    order.assignedDriverName
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                    <TruckFast size={11} variant="Bold" />
                                    {order.assignedDriverName ? `Driver: ${order.assignedDriverName}` : 'Driver: Unassigned'}
                                    {order.deliveryAssignedByName && <span className="text-[9px] opacity-75 font-normal">(by {order.deliveryAssignedByName})</span>}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 7. Kitchen Production Actions (Chef Workflow Controls) */}
                            <div
                              className="pt-2 border-t border-slate-100 flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.status === "WAITING_FOR_CHEF" && (
                                <button
                                  type="button"
                                  onClick={(e) => handleCardAction(e, order.id, "chef-accept")}
                                  disabled={isOrderLoading}
                                  className="flex-1 py-3 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <ChefHat className="w-4 h-4" />
                                  {isOrderLoading ? "Updating…" : "Accept Ticket"}
                                </button>
                              )}

                              {["CHEF_ACCEPTED", "MAKING", "DECORATING"].includes(order.status) && (
                                <button
                                  type="button"
                                  onClick={(e) => handleCardAction(e, order.id, "ready")}
                                  disabled={isOrderLoading}
                                  className="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <TickCircle className="w-4 h-4" />
                                  {isOrderLoading ? "Updating…" : "Mark Cake Ready"}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedOrderId(order.id)
                                }}
                                title="View Production Recipe & QC"
                                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer shrink-0 flex items-center justify-center shadow-2xs"
                              >
                                <MoreVertical className="w-4 h-4 text-slate-700" />
                              </button>
                            </div>
                          </motion.div>
                        )
                      }

                      return (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => setSelectedOrderId(order.id)}
                          className="bg-white rounded-2xl shadow-xs overflow-hidden flex flex-col group transition-all duration-300 relative border border-slate-200/90 hover:border-[#C5A059]/60 hover:shadow-md p-3.5 space-y-2.5 cursor-pointer text-slate-900"
                        >
                          {/* 1. Header: Order Number + Badges (Matching Sales Mockup) */}
                          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">ORDER</span>
                              <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight leading-none mt-1">
                                {order.orderNumber || order.id}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Status Badge */}
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs border ${
                                order.status === 'WAITING_FOR_CHEF' 
                                  ? 'bg-[#FFF4E5] text-[#B45309] border-[#FCD34D]/80' 
                                  : ['MAKING', 'DECORATING', 'CHEF_ACCEPTED'].includes(order.status)
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : ['READY_FOR_PICKUP'].includes(order.status)
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : ['COMPLETED', 'DELIVERED'].includes(order.status)
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : order.status === 'CANCELLED'
                                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                                  : 'bg-[#C5A059]/10 text-[#3E2723] border-[#C5A059]/30'
                              }`}>
                                {['WAITING_FOR_CHEF', 'MAKING', 'DECORATING', 'CHEF_ACCEPTED'].includes(order.status) && (
                                  <ChefHat className="w-3.5 h-3.5 text-[#B45309]" />
                                )}
                                {['READY_FOR_PICKUP', 'COMPLETED', 'DELIVERED'].includes(order.status) && (
                                  <TickCircle size={13} color="#059669" variant="Bold" />
                                )}
                                {STATUS_CONFIG[order.status]?.label ?? order.status.replace(/_/g, " ")}
                              </span>

                              {/* Fulfillment type badge */}
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs border ${
                                order.orderType === 'delivery'
                                  ? 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]'
                                  : 'bg-[#EBF5FF] text-[#1D4ED8] border-[#BFDBFE]'
                              }`}>
                                {order.orderType === 'delivery' ? (
                                  <TruckFast size={14} color="#4338CA" variant="Bold" />
                                ) : (
                                  <Shop size={14} color="#1D4ED8" variant="Bold" />
                                )}
                                {order.orderType === 'delivery' ? 'DELIVERY' : 'PICKUP'}
                              </span>

                              {order.priorityLevel === "high" && (
                                <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                  Urgent
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 2. Product Box: Thumbnail + Title + Weight + Flavour Pill */}
                          <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 flex items-center gap-3 shadow-2xs hover:border-slate-300 transition-all">
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                if (cardPhoto) setZoomImageUrl(cardPhoto)
                              }}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden relative shrink-0 border border-slate-200 cursor-pointer group/thumb bg-slate-900 shadow-2xs"
                              title="Click to zoom cake photo"
                            >
                              <img
                                src={cardPhoto || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400"}
                                alt={cakeTitle}
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/10 group-hover/thumb:bg-black/25 transition-colors" />
                              {cakeWeight && (
                                <span className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                                  {cakeWeight}
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate leading-tight">
                                {cakeTitle}
                              </h4>
                              {cakeWeight && (
                                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                  {cakeWeight}
                                </p>
                              )}
                              {cakeFlavor && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF0E6] text-[#78350F] text-[11px] font-bold border border-[#F3E5D8]">
                                    {cakeFlavor}
                                  </span>
                                </div>
                              )}
                              {cardImages.length > 0 && (
                                <div className="flex gap-1 mt-1.5 flex-wrap items-center">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Ref:</span>
                                  {cardImages.slice(0, 3).map((img, rIdx) => (
                                    <button
                                      key={`ref-${rIdx}`}
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setZoomImageUrl(img); }}
                                      className="w-6 h-6 rounded-md overflow-hidden border border-blue-300 hover:border-blue-500 transition-all shadow-2xs shrink-0 cursor-pointer"
                                    >
                                      <img src={img} alt={`Ref ${rIdx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setZoomImageUrl(cardImages[0]); }}
                                    className="text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-100 cursor-pointer"
                                  >
                                    {cardImages.length} Photo{cardImages.length > 1 ? "s" : ""}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 3. MESSAGE ON CAKE (Matching Sales Rose/Pink Box) */}
                          {cakeMessage && (
                            <div className="bg-[#FFF5F6] border border-[#FED4DA] rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-2xs">
                              <Cake size={20} color="#E11D48" variant="Bold" className="shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 block leading-tight">
                                  MESSAGE ON CAKE
                                </span>
                                <p className="text-sm sm:text-base font-black text-slate-900 tracking-tight mt-0.5 break-words leading-snug">
                                  &ldquo;{cakeMessage}&rdquo;
                                </p>
                              </div>
                            </div>
                          )}

                          {/* 4. CAKE CUSTOMIZATION NOTE (Matching Sales Amber Box + BOLD RED Text) */}
                          {customizationNote && (
                            <div className="bg-[#FEFCE8] border border-[#FEF08A] rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-2xs">
                              <ClipboardText size={20} color="#D97706" variant="Bold" className="shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 block leading-tight">
                                  CAKE CUSTOMIZATION NOTE
                                </span>
                                <p className="text-xs sm:text-sm font-black text-[#DC2626] tracking-tight mt-0.5 leading-snug break-words">
                                  &ldquo;{customizationNote}&rdquo;
                                </p>
                              </div>
                            </div>
                          )}

                          {/* 5. DELIVERY INSTRUCTIONS (Matching Sales Ice Blue Box) */}
                          {deliveryInstructions && (
                            <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-2xs">
                              <DocumentText size={20} color="#0284C7" variant="Bold" className="shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 block leading-tight">
                                  DELIVERY INSTRUCTIONS
                                </span>
                                <p className="text-xs font-black text-slate-900 tracking-tight mt-0.5 leading-snug break-words">
                                  &ldquo;{deliveryInstructions}&rdquo;
                                </p>
                              </div>
                            </div>
                          )}

                          {/* 6. Customer & Payment (2-Column Grid) */}
                          <div className="grid grid-cols-2 gap-2">
                            {/* Customer Box */}
                            <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-2.5 flex items-center gap-2 shadow-2xs min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center shrink-0">
                                <User size={15} color="#475569" variant="Bold" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">
                                  CUSTOMER
                                </span>
                                <p className="text-xs font-black text-slate-900 truncate leading-tight mt-0.5">
                                  {order.customerName}
                                </p>
                                {order.customerPhone && (
                                  <a
                                    href={`tel:${order.customerPhone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[11px] font-black text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5 tracking-wide truncate"
                                  >
                                    {order.customerPhone}
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Payment Box */}
                            <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-2.5 flex items-center gap-2 shadow-2xs min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center shrink-0">
                                <Card size={15} color="#475569" variant="Bold" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">
                                  PAYMENT
                                </span>
                                <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight mt-0.5 truncate">
                                  Total: ₹{(order.grandTotal || 0).toLocaleString("en-IN")}
                                </p>
                                <div className="mt-0.5">
                                  {order.status === "QUOTE_DRAFT" ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800">
                                      Quote Req.
                                    </span>
                                  ) : order.status === "QUOTE_SENT" ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 truncate max-w-full">
                                      Due: ₹{(order.pendingBalance ?? order.grandTotal).toLocaleString("en-IN")}
                                    </span>
                                  ) : order.pendingBalance > 0 ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700">
                                      Due: ₹{order.pendingBalance.toLocaleString("en-IN")}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                                      <TickCircle size={10} color="#047857" variant="Bold" /> Paid Full
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 7. DUE TIME (Mint Green Box) */}
                          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-2xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-emerald-100/90 text-emerald-800 flex items-center justify-center shrink-0">
                                <Clock size={16} color="#047857" variant="Bold" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 block leading-tight">
                                  DUE TIME
                                </span>
                                <p className="text-xs sm:text-sm font-black text-emerald-950 tracking-tight mt-0.5 whitespace-nowrap">
                                  {formattedDueTime}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-900">
                                {order.branch}
                              </span>
                              <span className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                                {formatTimeAgo(order.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* 7.1 Delivery Address Box */}
                          {isDeliveryOrder && (order.deliveryAddress || (order as any).delivery?.address) && (
                            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-2.5 flex items-start gap-2 shadow-2xs">
                              <Car size={15} color="#059669" variant="Bold" className="shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-700 block leading-tight">
                                  DELIVERY ADDRESS
                                </span>
                                <p className="text-xs font-bold text-slate-900 leading-snug mt-0.5 break-words">
                                  {order.deliveryAddress || (order as any).delivery?.address}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* 7.2 Staff & Stage Responsibility Strip */}
                          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5 shadow-2xs text-[11px]">
                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-200/60">
                              <span>Responsible Team & Stage</span>
                              <span className="text-primary font-extrabold">{col.label}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {/* Sales Staff */}
                              {(order.createdByName || order.createdBy) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[10px]">
                                  <User size={11} variant="Bold" /> Sales: {order.createdByName || order.createdBy}
                                </span>
                              )}

                              {/* Chef / Baker */}
                              {(order.assignedChefName || order.assignedChef || ['WAITING_FOR_CHEF', 'CHEF_ACCEPTED', 'MAKING', 'DECORATING', 'READY_FOR_PICKUP'].includes(order.status)) && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border text-[10px] ${
                                  (order.assignedChefName || order.assignedChef)
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-amber-50/50 text-amber-600 border-dashed border-amber-300'
                                }`}>
                                  <ChefHat className="w-3 h-3" /> Chef: {order.assignedChefName || order.assignedChef || 'Waiting for Chef'}
                                </span>
                              )}

                              {/* Driver */}
                              {isDeliveryOrder && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border text-[10px] ${
                                  order.assignedDriverName
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  <TruckFast size={11} variant="Bold" />
                                  {order.assignedDriverName ? (
                                    <>
                                      Driver: {order.assignedDriverName}
                                      {order.deliveryAssignedByName && (
                                        <span className="text-[9px] opacity-75 font-normal">
                                          (by {order.deliveryAssignedByName})
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    'Driver: Unassigned'
                                  )}
                                </span>
                              )}

                              {!isDeliveryOrder && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200 text-[10px]">
                                  <Shop size={11} variant="Bold" /> Store Pickup
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 8. 1-Tap Universal Admin Action Bar */}
                          <div
                            className="pt-2 border-t border-slate-100 flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* WORKFLOW BUTTONS */}
                            {order.status === "QUOTE_DRAFT" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setQuoteDialogOrderId(order.id)
                                }}
                                className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs cursor-pointer text-center"
                              >
                                Set Price & Approve &rarr;
                              </button>
                            )}

                            {order.status === "QUOTE_SENT" && (
                              <div className="flex-1 flex gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setQuoteDialogOrderId(order.id)
                                  }}
                                  className="flex-1 py-2 px-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs cursor-pointer text-center"
                                >
                                  Edit Price
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleCardAction(e, order.id, "approve")}
                                  disabled={isOrderLoading}
                                  className="flex-1 py-2 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer text-center"
                                >
                                  {isOrderLoading ? "…" : "Approve Kitchen"}
                                </button>
                              </div>
                            )}

                            {(order.status === "NEW" || order.status === "DRAFT" || order.status === "QUOTE_APPROVED") && (
                              <button
                                type="button"
                                onClick={(e) => handleCardAction(e, order.id, "approve")}
                                disabled={isOrderLoading}
                                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer text-center"
                              >
                                {isOrderLoading ? "Updating…" : "Send to Kitchen"}
                              </button>
                            )}

                            {order.status === "WAITING_FOR_CHEF" && (
                              <div className="flex-1 flex gap-1.5">
                                {order.pendingBalance > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleCollectPayment(e, order)}
                                    disabled={isOrderLoading}
                                    className="flex-1 py-2.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                                    title="Collect balance payment"
                                  >
                                    <Card size={14} variant="Bold" /> Collect ₹{order.pendingBalance.toLocaleString("en-IN")}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => handleCardAction(e, order.id, "chef-accept")}
                                  disabled={isOrderLoading}
                                  className={`py-2.5 px-3 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 ${
                                    order.pendingBalance > 0 ? "bg-[#3E2723] hover:bg-[#2c1c19] text-[#C5A059] flex-1" : "bg-amber-500 hover:bg-amber-600 flex-1"
                                  }`}
                                >
                                  <ChefHat className="w-3.5 h-3.5" />
                                  {isOrderLoading ? "…" : "Accept Ticket"}
                                </button>
                              </div>
                            )}

                            {["CHEF_ACCEPTED", "MAKING", "DECORATING"].includes(order.status) && (
                              <button
                                type="button"
                                onClick={(e) => handleCardAction(e, order.id, "ready")}
                                disabled={isOrderLoading}
                                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer text-center flex items-center justify-center gap-1"
                              >
                                <TickCircle className="w-3.5 h-3.5" />
                                {isOrderLoading ? "Updating…" : "Mark Ready"}
                              </button>
                            )}

                            {(order.status === "READY_FOR_PICKUP" || order.status === "PENDING_ASSIGNMENT") && (
                              <>
                                {order.orderType === "delivery" ? (
                                  <button
                                    type="button"
                                    onClick={() => setReassignOrderId(order.id)}
                                    className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <TruckFast className="w-3.5 h-3.5" /> Assign Driver
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => handleCardAction(e, order.id, "complete")}
                                    disabled={isOrderLoading}
                                    className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                                  >
                                    <TickCircle className="w-3.5 h-3.5" /> Handover / Done
                                  </button>
                                )}
                              </>
                            )}

                            {(order.status === "ASSIGNED_TO_DRIVER" || order.status === "PICKED_UP" || order.status === "ON_THE_WAY") && (
                              <button
                                type="button"
                                onClick={(e) => handleCardAction(e, order.id, "deliver")}
                                disabled={isOrderLoading}
                                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                              >
                                <TickCircle className="w-3.5 h-3.5" /> Mark Delivered
                              </button>
                            )}

                            {/* Quick Call Button */}
                            {order.customerPhone && (
                              <a
                                href={`tel:${order.customerPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center shadow-2xs shrink-0"
                                title={`Call ${order.customerPhone}`}
                              >
                                <Call size={18} color="#2563EB" variant="Bold" />
                              </a>
                            )}

                            {/* Quick WhatsApp Button */}
                            {order.customerPhone && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const cleanPhone = order.customerPhone.replace(/\D/g, "")
                                  const waUrl = `https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(order.customerName.split(' ')[0])},%20regarding%20your%20Gopal%20Cakes%20order%20${encodeURIComponent(order.orderNumber || order.id)}:`
                                  window.open(waUrl, "_blank")
                                }}
                                className="p-2.5 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/30 rounded-xl hover:bg-[#25D366]/20 transition-colors flex items-center justify-center shadow-2xs shrink-0 cursor-pointer"
                                title="WhatsApp Customer"
                              >
                                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-[#128C7E]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              </button>
                            )}

                            {/* Print Bill Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setReceiptOrderId(order.id)
                              }}
                              title="Print / View Bill"
                              className="p-2.5 bg-secondary/80 hover:bg-secondary text-foreground rounded-xl border border-border transition-colors cursor-pointer shrink-0 flex items-center justify-center shadow-2xs"
                            >
                              <Receipt21 className="w-4 h-4 text-slate-700" />
                            </button>

                            {/* More / Details Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedOrderId(order.id)
                              }}
                              title="Order Details"
                              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer shrink-0 flex items-center justify-center shadow-2xs"
                            >
                              <MoreVertical className="w-4 h-4 text-slate-600" />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                  {colOrders.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground text-sm opacity-50">No orders</div>
                  )}
                  {/* Bottom spacer so action buttons can be scrolled comfortably above the bottom border */}
                  <div className="h-20 shrink-0" aria-hidden="true" />
                </div>
              </div>
            )
          })}

          {/* Delivered column */}
          <div className="flex-none w-80 sm:w-[340px] bg-secondary/30 rounded-2xl border border-border/50 flex flex-col h-full overflow-hidden">
            <div className="p-3.5 border-b border-border/50 shrink-0 flex items-center justify-between bg-secondary/50">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                Delivered / Done
                <span className="bg-background text-muted-foreground text-xs px-2 py-0.5 rounded-full font-bold border border-border">
                  {archivedOrders.length}
                </span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-6">
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
              <div className="h-16 shrink-0" aria-hidden="true" />
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
        onOpenQuote={(id) => setQuoteDialogOrderId(id)}
      />

      {/* Fullscreen Photo Lightbox */}
      {zoomImageUrl && (
        <div 
          onClick={() => setZoomImageUrl(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[10000] flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomImageUrl(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/90 transition-colors z-10 cursor-pointer"
            >
              <CloseCircle className="w-5 h-5" />
            </button>
            <img src={zoomImageUrl} alt="Cake Enlarged" className="w-full h-full object-contain max-h-[85vh]" />
          </div>
        </div>
      )}

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
