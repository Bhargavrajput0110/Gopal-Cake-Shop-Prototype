"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ArrowDown2, ArrowUp2, Activity } from "iconsax-react"

// ─── Layout Primitives ────────────────────────────────────────────────────────

export const DashboardSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { title?: string; description?: string; action?: React.ReactNode }
>(({ className, title, description, action, children, ...props }, ref) => (
  <section ref={ref} className={cn("flex flex-col gap-4", className)} {...props}>
    {(title || description || action) && (
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </section>
))
DashboardSection.displayName = "DashboardSection"


export const KPIGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", className)}
      {...props}
    />
  )
)
KPIGrid.displayName = "KPIGrid"


export const WidgetContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grid gap-4 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4", className)}
      {...props}
    />
  )
)
WidgetContainer.displayName = "WidgetContainer"


// ─── Cards ────────────────────────────────────────────────────────────────────

const BaseCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
)
BaseCard.displayName = "BaseCard"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: React.ReactNode
  icon?: React.ElementType
  trend?: {
    value: number
    label: string
    direction: "up" | "down" | "neutral"
  }
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, icon: Icon, trend, ...props }, ref) => (
    <BaseCard ref={ref} className={cn("p-6 flex flex-col gap-2", className)} {...props}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground tracking-tight">{title}</h3>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "flex items-center font-medium",
              trend.direction === "up" && "text-emerald-500",
              trend.direction === "down" && "text-destructive",
              trend.direction === "neutral" && "text-muted-foreground"
            )}
          >
            {trend.direction === "up" && <ArrowUp2 className="h-3 w-3 mr-0.5" />}
            {trend.direction === "down" && <ArrowDown2 className="h-3 w-3 mr-0.5" />}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </BaseCard>
  )
)
StatCard.displayName = "StatCard"

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: React.ReactNode
  description?: string
  progress?: number
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className, title, value, description, progress, ...props }, ref) => (
    <BaseCard ref={ref} className={cn("p-6", className)} {...props}>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {typeof progress === "number" && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        )}
      </div>
    </BaseCard>
  )
)
MetricCard.displayName = "MetricCard"


export const ChartCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { title: string; subtitle?: string; action?: React.ReactNode }
>(({ className, title, subtitle, action, children, ...props }, ref) => (
  <BaseCard ref={ref} className={cn("flex flex-col", className)} {...props}>
    <div className="flex items-center justify-between p-6 pb-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className="p-6 pt-0 flex-1 min-h-[250px]">
      {children}
    </div>
  </BaseCard>
))
ChartCard.displayName = "ChartCard"


export const RecentActivityCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { title?: string; action?: React.ReactNode }
>(({ className, title = "Recent Activity", action, children, ...props }, ref) => (
  <BaseCard ref={ref} className={cn("flex flex-col", className)} {...props}>
    <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
      <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
      {action && <div>{action}</div>}
    </div>
    <div className="p-6 pt-4 flex-1">
      {children}
    </div>
  </BaseCard>
))
RecentActivityCard.displayName = "RecentActivityCard"


export const QuickActionsCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { title?: string }
>(({ className, title = "Quick Actions", children, ...props }, ref) => (
  <BaseCard ref={ref} className={cn("flex flex-col", className)} {...props}>
    <div className="p-6 pb-4">
      <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
    </div>
    <div className="p-6 pt-0 grid gap-2">
      {children}
    </div>
  </BaseCard>
))
QuickActionsCard.displayName = "QuickActionsCard"


export const EmptyDashboardCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { title: string; description: string; action?: React.ReactNode }
>(({ className, title, description, action, ...props }, ref) => (
  <BaseCard ref={ref} className={cn("flex flex-col items-center justify-center p-8 sm:p-12 text-center", className)} {...props}>
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
      <Activity className="h-6 w-6 text-muted-foreground opacity-50" />
    </div>
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="mt-2 text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
    {action && <div>{action}</div>}
  </BaseCard>
))
EmptyDashboardCard.displayName = "EmptyDashboardCard"
