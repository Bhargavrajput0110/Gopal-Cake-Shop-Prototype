"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Activity } from "iconsax-react"
import { formatDistanceToNow } from "date-fns"
import type { TimelineEvent, TimelineEventColor } from "./Timeline.types"

// ─── Constants & Utils ────────────────────────────────────────────────────────

const colorVariants: Record<TimelineEventColor, { iconBg: string; iconColor: string; line: string }> = {
  default: { iconBg: "bg-secondary", iconColor: "text-foreground", line: "bg-border" },
  muted: { iconBg: "bg-muted", iconColor: "text-muted-foreground", line: "bg-border/50" },
  info: { iconBg: "bg-blue-500/10", iconColor: "text-blue-500", line: "bg-blue-500/20" },
  success: { iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500", line: "bg-emerald-500/20" },
  warning: { iconBg: "bg-amber-500/10", iconColor: "text-amber-500", line: "bg-amber-500/20" },
  destructive: { iconBg: "bg-destructive/10", iconColor: "text-destructive", line: "bg-destructive/20" },
}

function formatDate(date: Date | string) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return { relative: "Invalid Date", absolute: "Invalid Date" }
  
  const relative = formatDistanceToNow(d, { addSuffix: true })
  const absolute = d.toLocaleDateString(undefined, { 
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
  })
  
  return { relative, absolute }
}

// ─── Primitives ───────────────────────────────────────────────────────────────

const Timeline = React.forwardRef<HTMLOListElement, React.HTMLAttributes<HTMLOListElement>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn("flex flex-col", className)}
      {...props}
    />
  )
)
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      className={cn("relative flex gap-4 min-h-[3rem] pb-6 last:pb-0", className)}
      {...props}
    />
  )
)
TimelineItem.displayName = "TimelineItem"

const TimelineConnector = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { color?: TimelineEventColor }>(
  ({ className, color = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "absolute left-[1.125rem] top-8 bottom-0 w-px -translate-x-1/2",
        colorVariants[color].line,
        "group-last:hidden", // hide connector on the last item
        className
      )}
      {...props}
    />
  )
)
TimelineConnector.displayName = "TimelineConnector"

const TimelineIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    icon?: React.ElementType, 
    color?: TimelineEventColor,
    avatar?: string
  }
>(({ className, icon: Icon, color = "default", avatar, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-background shadow-sm ring-4 ring-background",
      avatar ? "p-0 overflow-hidden bg-background" : colorVariants[color].iconBg,
      className
    )}
    {...props}
  >
    {avatar ? (
      <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
    ) : Icon ? (
      <Icon className={cn("h-4 w-4", colorVariants[color].iconColor)} />
    ) : (
      <Activity className={cn("h-4 w-4", colorVariants[color].iconColor)} />
    )}
  </div>
))
TimelineIcon.displayName = "TimelineIcon"

const TimelineContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-1 flex-col gap-1.5 pt-1", className)}
      {...props}
    />
  )
)
TimelineContent.displayName = "TimelineContent"

const TimelineTimestamp = React.forwardRef<
  HTMLTimeElement,
  React.TimeHTMLAttributes<HTMLTimeElement> & { timestamp: Date | string }
>(({ className, timestamp, ...props }, ref) => {
  const { relative, absolute } = formatDate(timestamp)
  return (
    <time
      ref={ref}
      dateTime={new Date(timestamp).toISOString()}
      title={absolute}
      className={cn("text-xs font-medium text-muted-foreground", className)}
      {...props}
    >
      {relative}
    </time>
  )
})
TimelineTimestamp.displayName = "TimelineTimestamp"

const TimelineMetadata = React.forwardRef<
  HTMLDetailsElement,
  React.DetailsHTMLAttributes<HTMLDetailsElement> & { data: Record<string, unknown> }
>(({ className, data, ...props }, ref) => {
  if (!data || Object.keys(data).length === 0) return null
  return (
    <details
      ref={ref}
      className={cn("group mt-2 text-sm", className)}
      {...props}
    >
      <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground transition-colors list-none inline-flex items-center gap-1">
        <span className="group-open:hidden">Show details</span>
        <span className="hidden group-open:inline">Hide details</span>
      </summary>
      <div className="mt-2 rounded-md bg-muted/50 p-3 text-xs overflow-auto max-h-[200px] border border-border/50">
        <pre className="text-muted-foreground font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </details>
  )
})
TimelineMetadata.displayName = "TimelineMetadata"


// ─── High-Level Renderer ──────────────────────────────────────────────────────

export interface TimelineRendererProps extends React.HTMLAttributes<HTMLOListElement> {
  events: TimelineEvent[]
}

/**
 * A ready-to-use component that assembles the Timeline primitives into a standard list.
 */
export function TimelineRenderer({ events, className, ...props }: TimelineRendererProps) {
  if (!events?.length) return null

  // Sort descending by default
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <Timeline className={className} {...props}>
      {sortedEvents.map((event, index) => (
        <TimelineItem key={event.id} className="group">
          {index !== sortedEvents.length - 1 && (
            <TimelineConnector color={event.color ?? "default"} />
          )}
          
          <TimelineIcon 
            icon={event.icon} 
            color={event.color ?? "default"} 
            avatar={event.actor?.avatar} 
          />
          
          <TimelineContent>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
              <div className="text-sm font-medium text-foreground">
                {event.title}
                {event.actor?.name && (
                  <span className="text-muted-foreground font-normal ml-1">
                    by {event.actor.name}
                  </span>
                )}
              </div>
              <TimelineTimestamp timestamp={event.timestamp} />
            </div>
            
            {event.description && (
              <div className="text-sm text-muted-foreground">
                {event.description}
              </div>
            )}

            {event.metadata && (
              <TimelineMetadata data={event.metadata} />
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  )
}

export {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineIcon,
  TimelineContent,
  TimelineTimestamp,
  TimelineMetadata,
}
