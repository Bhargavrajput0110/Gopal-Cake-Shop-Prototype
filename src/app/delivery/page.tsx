"use client"

import * as React from 'react'
import { DriverLayout } from './components/DriverLayout'
import { DeliveryJobCard } from './components/DeliveryJobCard'
import { OrdersApiClient } from '@/lib/api/orders.api'
import { useQuery } from '@tanstack/react-query'
import { Refresh2, Danger, BoxTime, WifiSquare } from "iconsax-react"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DeliveryPage() {
  const [activeTab, setActiveTab] = useState<'pool' | 'active'>('active')
  const [isOffline, setIsOffline] = useState(false)

  // Track network status for offline logic
  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const { data: orders, isLoading, isError, error } = useQuery({
    queryKey: ['driver-orders'],
    queryFn: () => OrdersApiClient.getDriverOrders(),
    refetchInterval: isOffline ? false : 15000, 
    refetchOnWindowFocus: true,
  })

  // Separate orders based on status
  const poolJobs = orders?.filter(o => o.status === 'READY_FOR_PICKUP') || []
  const myJobs = orders?.filter(o => ['DRIVER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'].includes(o.status)) || []

  const hasActiveJob = myJobs.length > 0
  const completedToday = 0 // Stub for V1

  const metrics = {
    active: hasActiveJob,
    today: completedToday + myJobs.length,
    completed: completedToday,
    pending: poolJobs.length,
    failed: 0,
    avgTime: '22m'
  }

  // Auto-switch to active if we have jobs, or pool if we don't, on first load
  useEffect(() => {
    if (orders) {
      if (myJobs.length > 0 && activeTab === 'pool') {
        setActiveTab('active')
      }
    }
  }, [orders?.length])

  return (
    <DriverLayout isOffline={isOffline} metrics={metrics}>
      
      {/* Offline Sticky Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-600 text-white font-ui text-[10px] uppercase tracking-[0.2em] font-black flex items-center justify-center py-3 gap-2 z-50 sticky top-0"
          >
            <WifiSquare className="w-5 h-5" />
            NO INTERNET CONNECTION
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Edge-to-Edge Tabs */}
      <div className="flex bg-gray-900 text-gray-400 sticky top-0 z-40 shadow-xl">
        <button 
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-5 font-ui text-[11px] uppercase tracking-[0.2em] font-black transition-all border-b-4 ${activeTab === 'active' ? 'border-amber-400 text-white bg-gray-800' : 'border-transparent hover:bg-gray-800'}`}
        >
          My Route 
          {myJobs.length > 0 && <span className={`ml-2 px-2 py-0.5 rounded text-[10px] ${activeTab === 'active' ? 'bg-amber-400 text-gray-900' : 'bg-gray-700 text-gray-300'}`}>{myJobs.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('pool')}
          className={`flex-1 py-5 font-ui text-[11px] uppercase tracking-[0.2em] font-black transition-all border-b-4 ${activeTab === 'pool' ? 'border-emerald-500 text-white bg-gray-800' : 'border-transparent hover:bg-gray-800'}`}
        >
          Open Pool 
          {poolJobs.length > 0 && <span className={`ml-2 px-2 py-0.5 rounded text-[10px] ${activeTab === 'pool' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300'}`}>{poolJobs.length}</span>}
        </button>
      </div>

      <div className="bg-gray-100 min-h-screen">
        {isLoading ? (
          <div className="flex flex-col h-64 items-center justify-center text-gray-400">
            <Refresh2 className="w-12 h-12 animate-spin text-gray-300 mb-4" />
            <p className="font-ui text-[10px] uppercase tracking-[0.2em] font-black">Syncing Route...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col h-64 items-center justify-center text-rose-500">
            <Danger className="w-16 h-16 mb-4" />
            <p className="font-display font-black text-3xl">Sync Error</p>
            <p className="text-sm opacity-80 mt-2 font-bold">{error?.message || "Could not fetch route"}</p>
          </div>
        ) : (
          <div className="pb-32">
            {activeTab === 'active' ? (
              myJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                  <BoxTime className="w-20 h-20 mb-6 opacity-20" />
                  <p className="font-display font-black text-2xl text-gray-500 mb-2">NO ACTIVE DELIVERIES</p>
                  <button onClick={() => setActiveTab('pool')} className="px-6 py-3 bg-white border-2 border-gray-200 rounded-full text-gray-600 font-ui text-[10px] uppercase tracking-[0.2em] font-black shadow-sm active:scale-95 transition-transform">Check Open Pool</button>
                </div>
              ) : (
                <div className="space-y-4 pt-4 px-4">
                  {myJobs.map(order => <DeliveryJobCard key={order.id} order={order} isActiveRoute={true} />)}
                </div>
              )
            ) : (
              poolJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                  <BoxTime className="w-20 h-20 mb-6 opacity-20" />
                  <p className="font-display font-black text-2xl text-gray-500 mb-2">POOL IS EMPTY</p>
                  <p className="font-ui text-[10px] uppercase tracking-[0.2em] font-black opacity-70">Waiting for Kitchen...</p>
                </div>
              ) : (
                <div className="space-y-4 pt-4 px-4">
                  {poolJobs.map(order => <DeliveryJobCard key={order.id} order={order} isActiveRoute={false} />)}
                </div>
              )
            )}
          </div>
        )}
      </div>

    </DriverLayout>
  )
}
