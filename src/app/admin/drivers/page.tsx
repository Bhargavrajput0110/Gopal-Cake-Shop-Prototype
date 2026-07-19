'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Activity, Warning2, TickCircle } from "iconsax-react"
import { BackButton } from "@/components/ui/BackButton"

interface DriverWorkload {
  driverId: string
  name: string
  phone: string
  activeCount: number
  deliveredToday: number
  lateCount: number
  isOverloaded: boolean
}

export default function AdminDriversPage() {
  const { data: workload, isLoading } = useQuery({
    queryKey: ['admin-driver-workload'],
    queryFn: () => fetchClient<DriverWorkload[]>('/admin/drivers/workload'),
    refetchInterval: 15000 // Refetch every 15s for live dashboard
  })

  if (isLoading) return <div className="p-8 font-bold text-muted-foreground animate-pulse">Loading Driver Fleet...</div>
  if (!workload) return <div className="p-8 text-destructive font-bold">Failed to load fleet data</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2">
            <BackButton fallback="/admin" label="Back" variant="outline" size="sm" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Driver Fleet Dashboard</h1>
          <p className="text-muted-foreground font-bold">Real-time delivery management</p>
        </div>
        <div className="bg-muted px-4 py-2 rounded-lg flex items-center gap-2 border">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-bold text-sm uppercase tracking-wider">Live Sync</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {workload.map(driver => (
          <Card key={driver.driverId} className={`border-2 transition-all ${driver.isOverloaded ? 'border-destructive shadow-destructive/10 bg-destructive/5' : 'border-border'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span className="font-black text-xl">{driver.name}</span>
                {driver.isOverloaded ? (
                  <div className="flex items-center gap-1 text-destructive bg-destructive/10 px-2 py-1 rounded text-xs font-black uppercase">
                    <Warning2 className="w-4 h-4" /> Overloaded
                  </div>
                ) : (
                  <div className="w-3 h-3 rounded-full bg-success animate-pulse"></div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-background p-2 rounded border">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Active / On Way</span>
                  <span className="font-black text-lg">{driver.activeCount}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded border flex flex-col ${driver.lateCount > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-background border-border'}`}>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Late</span>
                    <span className={`font-black text-lg ${driver.lateCount > 0 ? 'text-destructive' : 'text-foreground'}`}>{driver.lateCount}</span>
                  </div>
                  <div className="p-2 rounded border flex flex-col bg-success/5 border-success/30">
                    <span className="text-[10px] font-bold text-success uppercase">Delivered</span>
                    <div className="flex items-center gap-1">
                      <span className="font-black text-lg text-success">{driver.deliveredToday}</span>
                      <TickCircle className="w-4 h-4 text-success opacity-50" />
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t flex gap-2">
                  <button className="flex-1 text-xs font-bold bg-muted hover:bg-muted/80 py-1.5 rounded transition-colors" onClick={() => window.open(`tel:${driver.phone}`)}>
                    Call Driver
                  </button>
                  <button className="flex-1 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 py-1.5 rounded transition-colors">
                    Assign Orders
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {workload.length === 0 && (
          <div className="col-span-full text-center p-12 bg-muted/30 border-2 border-dashed rounded-xl">
            <span className="font-bold text-muted-foreground">No active delivery drivers found for this branch.</span>
          </div>
        )}
      </div>
    </div>
  )
}
