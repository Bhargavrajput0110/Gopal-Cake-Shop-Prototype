import * as React from 'react'
import { Call, Message, Location, Clock, Danger } from "iconsax-react"

// Generic DTO for rendering
export type DriverJobData = {
  id: string
  orderNumber: string
  status: string
  customer?: { name?: string; phone?: string }
  formattedAddress?: string
  coordinates?: { lat: number; lng: number }
  items: { id: string; quantity: number; productName: string; flavor?: string }[]
  timeTarget: string // ISO string
  pickedUpAt?: string // ISO string
  notes?: string
}

export interface DriverQueueCardProps {
  job: DriverJobData
  actions?: React.ReactNode
}

export function DriverQueueCard({ job, actions }: DriverQueueCardProps) {
  const [now, setNow] = React.useState(new Date())

  // Timer updates every minute to save renders for elapsed time
  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const pickedUpAt = job.pickedUpAt ? new Date(job.pickedUpAt) : null
  const targetDate = new Date(job.timeTarget)
  
  let elapsedMin = 0
  if (pickedUpAt) {
    elapsedMin = Math.floor((now.getTime() - pickedUpAt.getTime()) / 60000)
  }

  const windowStart = new Date(targetDate.getTime() - 30 * 60000)
  const timeWindow = `${windowStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

  let statusColor = "text-green-600 bg-green-50 border-green-200"
  let statusText = "On Time"
  if (now > targetDate) {
    statusColor = "text-destructive bg-destructive/10 border-destructive/30"
    statusText = "Late"
  } else if (now.getTime() + 15 * 60000 > targetDate.getTime()) {
    statusColor = "text-warning bg-warning/10 border-warning/30"
    statusText = "At Risk"
  }

  return (
    <div className="bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col mb-4 w-full max-w-[450px]">
      
      {/* 1. Customer */}
      <div className="p-4 border-b flex justify-between items-start bg-muted/10">
        <div>
          <h3 className="font-black text-lg leading-none mb-1">{job.customer?.name || "Walk-in Customer"}</h3>
          <p className="text-sm font-bold text-muted-foreground">{job.orderNumber}</p>
        </div>
        {job.customer?.phone && (
          <div className="flex gap-2">
            <a href={`tel:${job.customer.phone}`} className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Call className="w-5 h-5" />
            </a>
            <a href={`sms:${job.customer.phone}`} className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Message className="w-5 h-5" />
            </a>
          </div>
        )}
      </div>

      {/* 2. Address */}
      <div className="p-4 border-b bg-background flex gap-3">
        <Location className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium leading-snug">{job.formattedAddress || "Store Pickup"}</p>
          {job.coordinates && (
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${job.coordinates.lat},${job.coordinates.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center justify-center w-full min-h-[48px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 transition-colors"
            >
              <Location className="w-5 h-5 mr-2" />
              Navigate (Google Maps)
            </a>
          )}
        </div>
      </div>

      {/* 3. Items */}
      <div className="p-4 border-b bg-muted/5">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Order Items</h4>
        <ul className="space-y-2">
          {job.items.map(item => (
            <li key={item.id} className="flex gap-2 text-sm font-bold">
              <span className="text-primary">{item.quantity}x</span>
              <span>{item.productName}</span>
              {item.flavor && <span className="text-muted-foreground font-normal">({item.flavor})</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Time */}
      <div className="p-4 border-b flex justify-between items-center bg-background">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs font-bold text-muted-foreground">Promised Window</p>
            <p className="font-black">{timeWindow}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`px-2 py-1 rounded text-xs font-bold border ${statusColor} inline-block mb-1`}>
            {statusText}
          </div>
          {pickedUpAt && <p className="text-xs font-medium text-muted-foreground">Elapsed: {elapsedMin}m</p>}
        </div>
      </div>

      {/* 5. Notes */}
      {job.notes && (
        <div className="p-4 border-b bg-warning/10 border-warning/20">
          <div className="flex gap-2">
            <Danger className="w-5 h-5 text-warning shrink-0" />
            <p className="text-sm font-medium text-warning-foreground">{job.notes}</p>
          </div>
        </div>
      )}

      {/* 6. Actions (Injected via props) */}
      {actions && (
        <div className="p-4 bg-muted/20">
          {actions}
        </div>
      )}
    </div>
  )
}
