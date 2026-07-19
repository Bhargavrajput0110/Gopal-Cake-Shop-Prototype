"use client"

import { useState, useMemo } from "react"
import { useOrders, type Order, type OrderStatus } from "@/context/OrderContext"
import { DataTable, type ColumnDef, type RowAction, type ToolbarFilter, type BulkAction } from "@/components/ui/data-table"
import { PageHeader } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import { Clock, Car, Shop, Bag, Call, Eye, CloseCircle, TickCircle, Element4, TextalignJustifycenter } from "iconsax-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { OrderDetailsDialog } from "@/components/admin/orders/OrderDetailsDialog"
import { ReassignDriverDialog } from "@/components/admin/orders/ReassignDriverDialog"
import Link from "next/link"

// ─── Status Config ────────────────────────────────────────────────────────────
// Source of truth for label + badge variant.
// Hex colors from original STATUS_COLOR map have been removed and replaced with
// semantic Design System variants.

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info" }> = {
  NEW:                 { label: "NEW",          variant: "info" },
  DRAFT:               { label: "Draft",        variant: "secondary" },
  WAITING_FOR_CHEF:    { label: "Waiting",      variant: "warning" },
  CHEF_ACCEPTED:       { label: "Accepted",     variant: "warning" },
  MAKING:              { label: "MAKING",    variant: "warning" },
  DECORATING:          { label: "DECORATING",   variant: "secondary" },
  READY_FOR_PICKUP:    { label: "Ready",        variant: "success" },
  PENDING_ASSIGNMENT:  { label: "Dispatch",     variant: "info" },
  ASSIGNED_TO_DRIVER:  { label: "Assigned",     variant: "info" },
  PICKED_UP:           { label: "Picked Up",    variant: "info" },
  ON_THE_WAY:          { label: "On the Way",   variant: "info" },
  DELIVERED:           { label: "DELIVERED",    variant: "success" },
  FAILED_DELIVERY:     { label: "FAILED_DELIVERY",       variant: "destructive" },
  CANCELLED:           { label: "CANCELLED",    variant: "destructive" },
  COMPLETED:           { label: "Completed",    variant: "success" },
}

const BOARD_COLUMNS: { label: string; statuses: string[] }[] = [
  { label: "New & Draft",      statuses: ["NEW", "DRAFT"] },
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
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
        <div className="font-bold text-foreground text-xs">{row.original.id}</div>
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
  const { orders, transitionOrderAction } = useOrders()
  const [view, setView] = useState<"board" | "list">("board")
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [reassignOrderId, setReassignOrderId] = useState<string | null>(null)

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

  const filteredOrders = orders
  const activeOrders = filteredOrders.filter(
    (o) => !["DELIVERED", "FAILED_DELIVERY", "CANCELLED", "COMPLETED"].includes(o.status)
  )
  const archivedOrders = filteredOrders.filter((o) =>
    ["DELIVERED", "FAILED_DELIVERY", "CANCELLED", "COMPLETED"].includes(o.status)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Orders"
        description={`${orders.length} total orders — real-time from Supabase`}
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

      {/* ── Board View (existing, unchanged logic) ──────────────────────── */}
      {view === "board" && (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ maxHeight: "calc(100vh - 12rem)" }}>
          {BOARD_COLUMNS.map((col) => {
            const colOrders = filteredOrders.filter((o) =>
              col.statuses.includes(o.status)
            )
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
                    {colOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-card border border-border p-3.5 rounded-xl shadow-sm hover:border-primary/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-bold text-foreground text-xs">{order.id}</span>
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
                            <span>{order.branch}</span>
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
                      </motion.div>
                    ))}
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
              {archivedOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="bg-card border border-border/40 p-3 rounded-xl opacity-70 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{order.id}</span>
                    <Badge variant={STATUS_CONFIG[order.status]?.variant ?? "secondary"}>
                      {STATUS_CONFIG[order.status]?.label}
                    </Badge>
                  </div>
                  <p className="font-medium text-foreground truncate">{order.customerName}</p>
                  <p className="text-muted-foreground">₹{order.grandTotal?.toFixed(0)}</p>
                </div>
              ))}
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
            onExportCSV: () => console.log("Exporting CSV..."),
            onExportExcel: () => console.log("Exporting Excel..."),
            onExportPDF: () => console.log("Exporting PDF..."),
          }}
          renderMobileCard={(order) => (
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-sm">{order.id}</span>
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
    </div>
  )
}
