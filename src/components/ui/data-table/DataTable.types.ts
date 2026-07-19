import type { ColumnDef, SortingState, VisibilityState, RowSelectionState } from "@tanstack/react-table"
import type { ReactNode } from "react"

// ─── Column definition re-exported for consumer convenience ──────────────────
export type { ColumnDef }

// ─── Bulk Action ──────────────────────────────────────────────────────────────
export interface BulkAction<TData> {
  /** Button label */
  label: string
  /** Lucide icon component */
  icon?: React.ElementType
  /** Visual intent */
  variant?: "default" | "destructive" | "outline"
  /** Called with all currently selected row originals */
  onAction: (selectedRows: TData[]) => void | Promise<void>
}

// ─── Row Action ───────────────────────────────────────────────────────────────
export interface RowAction<TData> {
  label: string
  icon?: React.ElementType
  variant?: "default" | "destructive"
  onClick: (row: TData) => void | Promise<void>
  /** If provided, hides the action when it returns false */
  hidden?: (row: TData) => boolean
}

// ─── Toolbar filter ───────────────────────────────────────────────────────────
export interface FilterOption {
  label: string
  value: string
}

export interface ToolbarFilter {
  /** Must match a column `accessorKey` */
  columnId: string
  label: string
  options: FilterOption[]
}

// ─── Server-side pagination metadata ─────────────────────────────────────────
export interface PaginationMeta {
  pageIndex: number
  pageSize: number
  pageCount: number
  total: number
}

// ─── Export Actions ─────────────────────────────────────────────────────────
export interface ExportActions {
  onExportCSV?: () => void | Promise<void>
  onExportExcel?: () => void | Promise<void>
  onExportPDF?: () => void | Promise<void>
}

// ─── Saved Filters ────────────────────────────────────────────────────────────
export interface SavedFilterView {
  id: string
  name: string
  filters: Record<string, any>
}

// ─── DataTable Props ──────────────────────────────────────────────────────────
export interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  
  // ── Identity & Persistence ──────────────────────────────────────────────────
  /** Used for aria-label, empty-state copy, and LocalStorage persistence key */
  label?: string
  /** If true, persists visibility, page size, density, etc. in LocalStorage under `table_${label}` */
  persistState?: boolean

  // ── States ────────────────────────────────────────────────────────────────
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string

  // ── Toolbar & Slots ───────────────────────────────────────────────────────
  /** Completely override the toolbar area */
  toolbar?: React.ReactNode
  /** Renders custom actions for a row. Replaces the default rowActions dropdown. */
  renderActions?: (row: TData) => React.ReactNode
  /** Renders a custom mobile card for a row when screen width is small */
  renderMobileCard?: (row: TData) => React.ReactNode

  searchPlaceholder?: string
  searchColumn?: string
  filters?: ToolbarFilter[]
  savedViews?: SavedFilterView[]
  onSavedViewSelect?: (view: SavedFilterView) => void

  // ── Row & Bulk actions ────────────────────────────────────────────────────
  rowActions?: RowAction<TData>[]
  bulkActions?: BulkAction<TData>[]
  exportActions?: ExportActions

  // ── Config ────────────────────────────────────────────────────────────────
  defaultHidden?: string[]
  defaultPageSize?: number
  pageSizeOptions?: number[]
  serverPagination?: {
    meta: PaginationMeta
    onPaginationChange: (pageIndex: number, pageSize: number) => void
    onSortingChange?: (sorting: SortingState) => void
    onSearchChange?: (value: string) => void
  }

  // ── Appearance & Debug ────────────────────────────────────────────────────
  emptyStateNode?: React.ReactNode
  showColumnVisibility?: boolean
  stickyHeader?: boolean
  /** Measure and log render times and row counts for performance tuning */
  debug?: boolean
}
