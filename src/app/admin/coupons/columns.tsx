import * as React from "react"
import { ColumnDef } from "@/components/ui/data-table"
import { StatusBadge, BadgeStatus } from "@/components/ui/status-badge"
import { Tag } from "iconsax-react"
import { format } from "date-fns"

export type Coupon = {
  id: string
  code: string
  discountType: "FLAT" | "PERCENTAGE"
  discountValue: number
  minOrderValue: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  validFrom: string | null
  validUntil: string | null
  isActive: boolean
}

export const columns: ColumnDef<Coupon, any>[] = [
  {
    accessorKey: "code",
    header: "Coupon Code",
    cell: ({ row }) => {
      const coupon = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-foreground">{coupon.code}</p>
            <p className="text-xs text-muted-foreground">
              {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
            </p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "usage",
    header: "Usage",
    cell: ({ row }) => {
      const coupon = row.original
      return (
        <div className="text-sm">
          <span className="font-medium text-foreground">{coupon.usedCount}</span>
          <span className="text-muted-foreground"> / {coupon.usageLimit || "∞"}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "validity",
    header: "Validity",
    cell: ({ row }) => {
      const { validFrom, validUntil } = row.original
      if (!validFrom && !validUntil) return <span className="text-sm text-muted-foreground">Forever</span>
      
      const formatString = "MMM d, yyyy"
      const from = validFrom ? format(new Date(validFrom), formatString) : "Start"
      const to = validUntil ? format(new Date(validUntil), formatString) : "End"
      
      return (
        <div className="text-xs text-muted-foreground font-medium">
          {from} - {to}
        </div>
      )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      let status: BadgeStatus = row.original.isActive ? "active" : "inactive"
      const now = new Date()
      if (row.original.validUntil && new Date(row.original.validUntil) < now) {
        status = "inactive"
      }
      return <StatusBadge status={status} />
    }
  }
]
