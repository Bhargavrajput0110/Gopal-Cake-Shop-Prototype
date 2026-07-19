'use client'

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { OrdersApiClient } from "@/lib/api/orders.api"
import { format } from "date-fns"
import { TickCircle, Clock, User, Danger, PlayCircle, TruckFast, Bag, Send } from "iconsax-react"

interface TimelineEvent {
  id: string
  action: string
  eventType: string
  previousState: string | null
  nextState: string
  note: string | null
  createdAt: string
  actor?: {
    name: string
    role: string
  } | null
  systemGenerated: boolean
}

export function OrderTimelineViewer({ orderId }: { orderId: string }) {
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['orderTimeline', orderId],
    queryFn: () => OrdersApiClient.getOrderTimeline(orderId)
  })

  if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Loading timeline...</div>
  if (error) return <div className="p-4 text-center text-sm text-destructive">Failed to load timeline.</div>

  const events = response?.data || []

  if (events.length === 0) {
    return <div className="p-4 text-center text-sm text-muted-foreground">No timeline events found.</div>
  }

  const getEventIcon = (action: string, nextState: string) => {
    const act = action.toLowerCase()
    const state = nextState.toLowerCase()

    if (act.includes('create') || state === 'NEW') return <Bag className="w-4 h-4 text-blue-500" />
    if (act.includes('pay') || state.includes('pay')) return <TickCircle className="w-4 h-4 text-emerald-500" />
    if (state.includes('chef') || state.includes('prepar') || state.includes('bak') || state.includes('decorat')) return <PlayCircle className="w-4 h-4 text-amber-500" />
    if (state.includes('ready')) return <TickCircle className="w-4 h-4 text-emerald-600" />
    if (state.includes('driver') || state.includes('way') || state.includes('deliver')) return <TruckFast className="w-4 h-4 text-purple-500" />
    if (state.includes('cancel') || state.includes('fail')) return <Danger className="w-4 h-4 text-destructive" />
    
    return <Clock className="w-4 h-4 text-muted-foreground" />
  }

  const formatStateName = (state: string) => {
    return state.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {events.map((event: TimelineEvent, index: number) => {
        const isLast = index === events.length - 1
        return (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Icon Circle */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
              {getEventIcon(event.action, event.nextState)}
            </div>

            {/* Content Box */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-foreground">
                    {formatStateName(event.nextState)}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    {format(new Date(event.createdAt), 'HH:mm')}
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {event.note || formatStateName(event.action)}
                </p>

                {/* Meta details */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t text-[10px] text-muted-foreground font-medium">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {event.systemGenerated ? 'System' : (event.actor?.name || 'Unknown')}
                  </div>
                  {event.actor?.role && (
                    <span className="uppercase bg-secondary px-1.5 py-0.5 rounded text-[9px] tracking-wider">
                      {event.actor.role}
                    </span>
                  )}
                  <span className="ml-auto text-muted-foreground/60">
                    {format(new Date(event.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
