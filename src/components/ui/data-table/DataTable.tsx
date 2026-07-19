"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import { ArrowUp2, ArrowDown2, ArrangeHorizontal, ArrowLeft2, ArrowRight2, Setting4, SearchNormal1, CloseSquare, Refresh2, Danger, ArchiveBook, More, DocumentDownload, Element3, Devices } from "iconsax-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { DataTableProps } from "./DataTable.types"

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortIcon({ direction }: { direction: "asc" | "desc" | false }) {
  if (direction === "asc") return <ArrowUp2 className="ml-1.5 h-3.5 w-3.5 shrink-0" />
  if (direction === "desc") return <ArrowDown2 className="ml-1.5 h-3.5 w-3.5 shrink-0" />
  return <ArrangeHorizontal className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-40" />
}

function TableSkeleton({ cols, rows = 8 }: { cols: number; rows?: number }) {
  // Deterministic widths seeded by index to prevent React hydration mismatches.
  // Math.random() in render causes server/client diff → SSR crash.
  const getWidth = (ri: number, ci: number) =>
    60 + ((ri * 7 + ci * 13) % 30)
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b">
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="p-4">
              <div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${getWidth(ri, ci)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  label = "items",
  isLoading = false,
  isError = false,
  errorMessage = "Failed to load data. Please try again.",
  // ── Toolbar & Slots ───────────────────────────────────────────────────────
  toolbar,
  renderActions,
  renderMobileCard,
  searchPlaceholder,
  searchColumn,
  filters,
  savedViews,
  onSavedViewSelect,
  rowActions,
  bulkActions,
  exportActions,

  // ── Config ────────────────────────────────────────────────────────────────
  defaultHidden = [],
  defaultPageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  serverPagination,

  // ── Appearance & Debug ────────────────────────────────────────────────────
  emptyStateNode,
  showColumnVisibility = true,
  stickyHeader = true,
  persistState = false,
  debug = false,
}: DataTableProps<TData, TValue>) {
  // ── Local Storage State Hook ──────────────────────────────────────────────
  const usePersistentState = <T,>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = React.useState<T>(() => {
      if (!persistState || typeof window === "undefined") return initial
      const stored = localStorage.getItem(`table_${label}_${key}`)
      return stored ? JSON.parse(stored) : initial
    })
    
    React.useEffect(() => {
      if (persistState && typeof window !== "undefined") {
        localStorage.setItem(`table_${label}_${key}`, JSON.stringify(state))
      }
    }, [state, persistState, key])
    
    return [state, setState]
  }

  const [sorting, setSorting] = usePersistentState<SortingState>("sorting", [])
  const [columnFilters, setColumnFilters] = usePersistentState<ColumnFiltersState>("filters", [])
  const [columnVisibility, setColumnVisibility] = usePersistentState<VisibilityState>(
    "visibility",
    Object.fromEntries(defaultHidden.map((id) => [id, false]))
  )
  const [density, setDensity] = usePersistentState<"compact" | "comfortable" | "spacious">("density", "comfortable")
  const [pageSize, setPageSize] = usePersistentState<number>("pageSize", defaultPageSize)
  
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [showColumnPicker, setShowColumnPicker] = React.useState(false)
  const [showExportMenu, setShowExportMenu] = React.useState(false)

  // ── Debug Logging ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (debug) {
      console.log(`[DataTable:${label}] Rendered with ${data.length} rows.`)
      console.timeEnd(`[DataTable:${label}] RenderTime`)
    }
  })
  if (debug) console.time(`[DataTable:${label}] RenderTime`)

  // ── Column selection helper ───────────────────────────────────────────────
  const selectionColumn = React.useMemo(
    () => ({
      id: "__select__",
      header: ({ table }: any) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? "indeterminate" : false)}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label={`Select row ${row.index + 1}`}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    }),
    []
  )

  // ── Row actions column ─────────────────────────────────────────────────────
  const actionsColumn = React.useMemo(
    () => ({
      id: "__actions__",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }: any) => {
        const original = row.original as TData
        if (renderActions) return <div className="flex justify-end">{renderActions(original)}</div>
        
        const [open, setOpen] = React.useState(false)
        const visible = rowActions!.filter((a) => !a.hidden?.(original))
        if (!visible.length) return null
        return (
          <div className="relative flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Row actions"
            >
              <More className="h-4 w-4" />
            </button>
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-8 z-50 min-w-[140px] bg-popover border border-border rounded-lg shadow-lg py-1 overflow-hidden">
                  {visible.map((action) => (
                    <button
                      key={action.label}
                      onClick={(e) => { e.stopPropagation(); setOpen(false); action.onClick(original) }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-secondary",
                        action.variant === "destructive" && "text-destructive hover:bg-destructive/10"
                      )}
                    >
                      {action.icon && <action.icon className="h-4 w-4 shrink-0" />}
                      {action.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
      size: 60,
    }),
    [rowActions]
  )

  const allColumns = React.useMemo(() => [
    ...(bulkActions?.length ? [selectionColumn] : []),
    ...columns,
    ...(rowActions?.length || renderActions ? [actionsColumn] : []),
  ], [columns, bulkActions, rowActions, renderActions, selectionColumn, actionsColumn])

  const table = useReactTable({
    data,
    columns: allColumns as any,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    enableRowSelection: !!bulkActions?.length,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      setSorting(next)
      serverPagination?.onSortingChange?.(next)
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: (val) => {
      setGlobalFilter(val)
      serverPagination?.onSearchChange?.(val)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: serverPagination ? undefined : getSortedRowModel(),
    getFilteredRowModel: serverPagination ? undefined : getFilteredRowModel(),
    getPaginationRowModel: serverPagination ? undefined : getPaginationRowModel(),
    manualPagination: !!serverPagination,
    manualSorting: !!serverPagination,
    manualFiltering: !!serverPagination,
    pageCount: serverPagination?.meta.pageCount,
    initialState: { pagination: { pageSize } },
  })

  const selectedCount = Object.keys(rowSelection).length
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original)

  // Responsive: visible column count including hidden
  const visibleColCount = table.getAllColumns().filter((c) => c.getIsVisible()).length

  // ── Search debounce ───────────────────────────────────────────────────────
  const searchRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const handleSearch = (val: string) => {
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      if (serverPagination) {
        serverPagination.onSearchChange?.(val)
        serverPagination.onPaginationChange(0, table.getState().pagination.pageSize)
      } else {
        table.setGlobalFilter(val)
      }
    }, 250)
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      {toolbar || (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-0 w-full sm:max-w-sm">
            <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              defaultValue={globalFilter}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder ?? `Search ${label}...`}
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            {globalFilter && (
              <button
                onClick={() => { setGlobalFilter(""); table.setGlobalFilter("") }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <CloseSquare className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Column filters */}
          {filters?.map((f) => (
            <select
              key={f.columnId}
              onChange={(e) => table.getColumn(f.columnId)?.setFilterValue(e.target.value === "" ? undefined : e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={f.label}
            >
              <option value="">All {f.label}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}

          {/* Density Toggle */}
          <select
            value={density}
            onChange={(e) => setDensity(e.target.value as "compact" | "comfortable" | "spacious")}
            className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Table density"
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="spacious">Spacious</option>
          </select>

          {/* Export Actions */}
          {exportActions && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportMenu((v) => !v)}
                className="gap-2 h-9"
              >
                <DocumentDownload className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-11 z-50 min-w-[140px] bg-popover border border-border rounded-lg shadow-lg p-1 space-y-0.5">
                    {exportActions.onExportCSV && (
                      <button onClick={() => { setShowExportMenu(false); exportActions.onExportCSV!() }} className="flex w-full text-left px-3 py-1.5 text-sm hover:bg-secondary rounded">Export CSV</button>
                    )}
                    {exportActions.onExportExcel && (
                      <button onClick={() => { setShowExportMenu(false); exportActions.onExportExcel!() }} className="flex w-full text-left px-3 py-1.5 text-sm hover:bg-secondary rounded">Export Excel</button>
                    )}
                    {exportActions.onExportPDF && (
                      <button onClick={() => { setShowExportMenu(false); exportActions.onExportPDF!() }} className="flex w-full text-left px-3 py-1.5 text-sm hover:bg-secondary rounded">Export PDF</button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Column visibility */}
          {showColumnVisibility && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowColumnPicker((v) => !v)}
                className="gap-2 h-9"
              >
                <Setting4 className="h-4 w-4" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
              {showColumnPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColumnPicker(false)} />
                  <div className="absolute right-0 top-11 z-50 min-w-[180px] bg-popover border border-border rounded-lg shadow-lg p-2 space-y-1">
                    {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => (
                      <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary cursor-pointer text-sm">
                        <Checkbox
                          checked={col.getIsVisible()}
                          onCheckedChange={(v) => col.toggleVisibility(!!v)}
                        />
                        <span className="capitalize">{col.id.replace(/_/g, " ")}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Bulk action bar ───────────────────────────────────────────────── */}
      {bulkActions?.length && selectedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-semibold text-primary">{selectedCount} selected</span>
          <div className="flex-1" />
          {bulkActions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant={action.variant ?? "outline"}
              className="gap-2"
              onClick={() => action.onAction(selectedRows as TData[])}
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => table.resetRowSelection()}
            className="text-muted-foreground"
          >
            <CloseSquare className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Table (Desktop) / Cards (Mobile) ──────────────────────────────── */}
      
      {/* Mobile view if renderMobileCard is provided */}
      {renderMobileCard && (
        <div className="flex flex-col gap-3 md:hidden">
          {isLoading && (
            <div className="flex justify-center p-4"><Refresh2 className="w-6 h-6 animate-spin text-primary" /></div>
          )}
          {!isLoading && isError && (
             <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
               <Danger className="w-5 h-5" /> {errorMessage}
             </div>
          )}
          {!isLoading && !isError && table.getRowModel().rows.map(row => (
             <div key={row.id} className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
               {renderMobileCard(row.original)}
             </div>
          ))}
        </div>
      )}

      {/* Desktop view (always visible if no mobile card, hidden on mobile if mobile card exists) */}
      <div className={cn("relative w-full overflow-auto rounded-lg border border-border bg-card shadow-sm", renderMobileCard && "hidden md:block")}>
        <table
          className="w-full caption-bottom text-sm"
          aria-label={label}
          aria-rowcount={data.length}
          aria-busy={isLoading}
        >
          <thead className={cn(stickyHeader && "sticky top-0 z-10", "bg-muted/50 border-b border-border")}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "h-10 px-4 text-left align-middle text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap",
                        canSort && "cursor-pointer select-none hover:text-foreground transition-colors"
                      )}
                      style={{ width: header.column.columnDef.size }}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      aria-sort={
                        header.column.getIsSorted() === "asc" ? "ascending"
                          : header.column.getIsSorted() === "desc" ? "descending"
                          : canSort ? "none" : undefined
                      }
                    >
                      <span className="flex items-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && <SortIcon direction={header.column.getIsSorted()} />}
                      </span>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>

          <tbody className="[&_tr:last-child]:border-0 divide-y divide-border">
            {/* Loading state */}
            {isLoading && <TableSkeleton cols={visibleColCount} />}

            {/* Error state */}
            {!isLoading && isError && (
              <tr>
                <td colSpan={visibleColCount} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-destructive">
                    <Danger className="h-8 w-8 opacity-70" />
                    <p className="font-semibold text-sm">{errorMessage}</p>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty state */}
            {!isLoading && !isError && table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={visibleColCount} className="py-16 text-center">
                  {emptyStateNode ?? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ArchiveBook className="h-8 w-8 opacity-40" />
                      <p className="font-semibold text-sm">No {label} found</p>
                      <p className="text-xs opacity-70">Try adjusting your search or filters</p>
                    </div>
                  )}
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading && !isError && table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                className="transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/5"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      "px-4 align-middle",
                      density === "compact" && "py-1",
                      density === "comfortable" && "py-3",
                      density === "spacious" && "py-5"
                    )}
                    style={{ width: cell.column.columnDef.size }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        {/* Row count */}
        <p className="shrink-0">
          {isLoading ? (
            <span className="flex items-center gap-1.5"><Refresh2 className="h-3.5 w-3.5 animate-spin" /> Loading...</span>
          ) : serverPagination ? (
            `${serverPagination.meta.total} ${label} total`
          ) : (
            `${table.getFilteredRowModel().rows.length} ${label}${selectedCount > 0 ? ` · ${selectedCount} selected` : ""}`
          )}
        </p>

        <div className="flex items-center gap-4">
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs shrink-0 hidden sm:inline">Rows per page</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                const size = Number(e.target.value)
                setPageSize(size)
                table.setPageSize(size)
                serverPagination?.onPaginationChange(0, size)
              }}
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          {/* Page info */}
          <span className="text-xs shrink-0">
            Page{" "}
            {serverPagination
              ? `${serverPagination.meta.pageIndex + 1} of ${serverPagination.meta.pageCount}`
              : `${table.getState().pagination.pageIndex + 1} of ${Math.max(1, table.getPageCount())}`}
          </span>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                table.setPageIndex(0)
                serverPagination?.onPaginationChange(0, table.getState().pagination.pageSize)
              }}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-md border border-input hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="First page"
            >
              <ArrowLeft2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                table.previousPage()
                serverPagination?.onPaginationChange(
                  table.getState().pagination.pageIndex - 1,
                  table.getState().pagination.pageSize
                )
              }}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-md border border-input hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ArrowLeft2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                table.nextPage()
                serverPagination?.onPaginationChange(
                  table.getState().pagination.pageIndex + 1,
                  table.getState().pagination.pageSize
                )
              }}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-md border border-input hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ArrowRight2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const last = table.getPageCount() - 1
                table.setPageIndex(last)
                serverPagination?.onPaginationChange(last, table.getState().pagination.pageSize)
              }}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-md border border-input hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Last page"
            >
              <ArrowRight2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
