'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/client'
import { DriverOrderDTO } from '@/dtos/OrderSchemas'
import { useDriverStore } from './DriverState'
import { TaskCard } from './components/TaskCard'
import { ProofOfDeliveryModal } from './components/ProofOfDeliveryModal'
import { FailureReasonModal } from './components/FailureReasonModal'
import { WifiSquare, Wifi, Refresh, BoxTick, User, Shop, ArrowRight, TickCircle, Car } from "iconsax-react"
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'

export default function DriverDashboard() {
  const { data: session } = useSession()
  const { 
    tasks, 
    setTasks, 
    offlineQueue, 
    queueAction, 
    isOnline, 
    setOnlineStatus, 
    syncQueue,
    optimisticUpdateTask,
    activeDriver,
    setActiveDriver
  } = useDriverStore()

  React.useEffect(() => {
    if (session?.user && (!activeDriver || activeDriver.id !== session.user.id)) {
      setActiveDriver({ id: session.user.id, name: session.user.name || 'Driver' })
    }
  }, [session, activeDriver, setActiveDriver])

  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = React.useState<'AVAILABLE' | 'PENDING' | 'COMPLETED'>('PENDING')
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  
  // Modal state
  const [activeTask, setActiveTask] = React.useState<DriverOrderDTO | null>(null)
  const [modalType, setModalType] = React.useState<'DELIVERED' | 'FAILED_DELIVERY' | null>(null)

  // Network listener
  React.useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true)
      syncQueue().then(() => queryClient.invalidateQueries({ queryKey: ['driver-tasks'] }))
    }
    const handleOffline = () => setOnlineStatus(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnlineStatus, syncQueue, queryClient])

  // Fetch initial data
  const { data, isLoading } = useQuery({
    queryKey: ['driver-tasks', activeDriver?.id],
    queryFn: () => fetchClient<{ success: boolean, data: DriverOrderDTO[] }>(`/driver/deliveries?driverId=${activeDriver?.id}`),
    refetchInterval: isOnline ? 30000 : false,
    enabled: isOnline && !!activeDriver
  })

  React.useEffect(() => {
    if (data && data.success && data.data) {
      setTasks(data.data)
    } else if (data && Array.isArray(data)) {
      // Fallback in case of raw array response
      setTasks(data as any)
    } else {
      setTasks([])
    }
  }, [data, setTasks])

  // Modals state
  const [activeExtraData, setActiveExtraData] = React.useState<any>(null)

  const handleAction = (item: DriverOrderDTO, action: string, extraData?: any) => {
    if (action === 'DELIVERED' || action === 'FAILED_DELIVERY') {
      setActiveTask(item)
      setModalType(action)
      setActiveExtraData(extraData)
      return
    }

    processAction(item, action, extraData)
  }

  const processAction = async (item: DriverOrderDTO, action: string, extraData?: any) => {
    const timestamp = new Date().toISOString()
    const payload = { orderId: item.id.replace('task-', ''), action, timestamp, ...extraData }

    // State machine logic
    let newStatus = item.status
    let newDriverId = item.assignedDriverId
    if (action === 'ACCEPTED') {
      newStatus = 'ACCEPTED'
      newDriverId = activeDriver?.id || null // Assign to me!
    }
    if (action === 'START_TRIP') newStatus = item.taskType === 'VENDOR_PICKUP' ? 'ON_THE_WAY_TO_VENDOR' : 'ON_THE_WAY'
    if (action === 'PICKED_UP') newStatus = item.taskType === 'CUSTOMER_DELIVERY' ? 'OUT_FOR_DELIVERY' : (item.taskType === 'VENDOR_PICKUP' ? 'DELIVERING_TO_BRANCH' : 'PICKED_UP')
    if (action === 'DELIVERED') newStatus = 'DELIVERED'
    if (action === 'FAILED_DELIVERY') newStatus = 'FAILED_DELIVERY'

    optimisticUpdateTask(item.id, { status: newStatus as any, assignedDriverId: newDriverId })

    if (!isOnline) {
      queueAction(payload)
      setToastMessage(`Action queued (Offline mode)`);
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      if (item.id.startsWith('task-')) {
        // Mock API success
        setTimeout(() => {}, 500); 
        setToastMessage(`Task successfully updated!`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        try {
          const isVendorTask = item.id.startsWith('vendor-');
          const realId = item.id.replace('vendor-', '').replace('delivery-', '');
          
          if (isVendorTask) {
            await fetchClient(`/driver/deliveries/${realId}/vendor-status`, {
              method: 'PATCH',
              body: JSON.stringify(payload)
            })
          } else {
            await fetchClient(`/driver/deliveries/${realId}/status`, {
              method: 'PATCH',
              body: JSON.stringify(payload)
            })
          }
          queryClient.invalidateQueries({ queryKey: ['driver-tasks', activeDriver?.id] })
          setToastMessage(`Task successfully updated!`);
          setTimeout(() => setToastMessage(null), 3000);
        } catch (err) {
          console.error("Action failed, queueing:", err)
          queueAction(payload)
          setToastMessage(`Action queued (Network error)`);
          setTimeout(() => setToastMessage(null), 3000);
        }
      }
    }

    setModalType(null)
    setActiveTask(null)
  }

  // Derived state
  const availableTasks = tasks.filter(t => !t.assignedDriverId && !['DELIVERED', 'FAILED_DELIVERY', 'COMPLETED'].includes(t.status))
  const myTasks = tasks.filter(t => activeDriver && t.assignedDriverId === activeDriver.id)
  
  const pendingTasks = myTasks.filter(d => !['DELIVERED', 'FAILED_DELIVERY', 'COMPLETED'].includes(d.status))
  const completedTasks = myTasks.filter(d => ['DELIVERED', 'FAILED_DELIVERY', 'COMPLETED'].includes(d.status))
  
  const customerCount = pendingTasks.filter(t => t.taskType === 'CUSTOMER_DELIVERY').length
  const vendorCount = pendingTasks.filter(t => t.taskType === 'VENDOR_PICKUP').length
  const branchCount = pendingTasks.filter(t => t.taskType === 'BRANCH_TRANSFER').length

  // Driver Login Screen is removed since auth is handled at the layout level or middleware.
  if (!activeDriver) {
    return (
      <div className="h-full bg-background flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground font-bold">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background pb-20 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-24 left-1/2 z-[100] w-[90%] max-w-[400px] bg-white border border-emerald-100 shadow-[0_8px_32px_rgba(16,185,129,0.15)] rounded-2xl px-6 py-4 flex items-center gap-3"
          >
            <TickCircle className="w-6 h-6 text-emerald-500 shrink-0" />
            <span className="font-bold text-emerald-900 text-sm leading-tight">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <header className="bg-white/40 backdrop-blur-md border-b border-border/40 p-6 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground leading-none">Driver Tasks</h1>
          <p className="text-[10px] font-sans font-bold text-primary uppercase tracking-[0.2em] mt-1">Driving as {activeDriver.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="/login"
            className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 hover:text-rose-600 transition-colors bg-white/50 px-3 py-1.5 rounded-full border border-border/40"
          >
            Sign Out
          </a>
          
          {offlineQueue.length > 0 && (
            <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-amber-200">
              <Refresh className="w-3 h-3 animate-spin" /> {offlineQueue.length} Pending
            </span>
          )}
          {isOnline ? (
            <span className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest shadow-sm">
              <Wifi className="w-3 h-3" /> Online
            </span>
          ) : (
            <span className="text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest shadow-sm">
              <WifiSquare className="w-3 h-3" /> Offline
            </span>
          )}
        </div>
      </header>

      {/* Summary Pills */}
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-3">Today's Tasks</h2>
        <div className="flex flex-wrap gap-2">
           <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg text-blue-700 font-bold text-[10px] uppercase tracking-widest">
              <Shop className="w-3.5 h-3.5" /> Vendor Pickups ({vendorCount})
           </div>
           <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg text-purple-700 font-bold text-[10px] uppercase tracking-widest">
              <User className="w-3.5 h-3.5" /> Customer Deliveries ({customerCount})
           </div>
           <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg text-orange-700 font-bold text-[10px] uppercase tracking-widest">
              <ArrowRight className="w-3.5 h-3.5" /> Branch Transfers ({branchCount})
           </div>
           <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg text-emerald-700 font-bold text-[10px] uppercase tracking-widest">
              <TickCircle className="w-3.5 h-3.5" /> Completed ({completedTasks.length})
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6 pb-2 flex gap-3">
        <button 
          onClick={() => setActiveTab('AVAILABLE')}
          className={`flex-1 py-3.5 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all duration-300 shadow-sm ${activeTab === 'AVAILABLE' ? 'bg-amber-500 text-white border border-amber-600' : 'bg-white/60 text-foreground/70 border border-white hover:border-secondary/20 hover:text-secondary'}`}
        >
          Available ({availableTasks.length})
        </button>
        <button 
          onClick={() => setActiveTab('PENDING')}
          className={`flex-1 py-3.5 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all duration-300 shadow-sm ${activeTab === 'PENDING' ? 'bg-primary text-primary-foreground border border-primary/20' : 'bg-white/60 text-foreground/70 border border-white hover:border-secondary/20 hover:text-secondary'}`}
        >
          My Tasks ({pendingTasks.length})
        </button>
        <button 
          onClick={() => setActiveTab('COMPLETED')}
          className={`flex-1 py-3.5 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all duration-300 shadow-sm ${activeTab === 'COMPLETED' ? 'bg-emerald-500 text-white border border-emerald-600' : 'bg-white/60 text-foreground/70 border border-white hover:border-secondary/20 hover:text-secondary'}`}
        >
          Completed ({completedTasks.length})
        </button>
      </div>

      {/* List */}
      <div className="p-4 space-y-4">
        {isLoading && tasks.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground font-bold">Loading route...</div>
        ) : activeTab === 'AVAILABLE' ? (
          availableTasks.length > 0 ? (
            availableTasks.map(item => (
              <TaskCard key={item.id} task={item} onAction={(action, extraData) => handleAction(item, action, extraData)} />
            ))
          ) : (
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="text-center p-12 bg-white/60 rounded-3xl border border-dashed border-secondary/30 flex flex-col items-center shadow-sm">
              <BoxTick className="w-16 h-16 text-secondary/30 mb-3" />
              <p className="font-serif font-black text-2xl text-secondary">No open tasks</p>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary/70 mt-1">Everything is assigned!</p>
            </motion.div>
          )
        ) : activeTab === 'PENDING' ? (
          pendingTasks.length > 0 ? (
            pendingTasks.map(item => (
              <TaskCard key={item.id} task={item} onAction={(action, extraData) => handleAction(item, action, extraData)} />
            ))
          ) : (
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="text-center p-12 bg-white/60 rounded-3xl border border-dashed border-emerald-500/30 flex flex-col items-center shadow-sm mt-4">
              <Car className="w-16 h-16 text-emerald-500/30 mb-3" />
              <p className="font-serif font-black text-2xl text-emerald-900">Standby</p>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700/70 mt-1">No pending tasks right now.</p>
            </motion.div>
          )
        ) : (
          completedTasks.length > 0 ? (
            completedTasks.map(item => (
              <TaskCard key={item.id} task={item} onAction={() => {}} />
            ))
          ) : (
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="text-center p-12 bg-white/60 rounded-3xl border border-dashed border-foreground/10 flex flex-col items-center shadow-sm mt-4">
              <TickCircle className="w-16 h-16 text-foreground/20 mb-3" />
              <p className="font-serif font-black text-2xl text-foreground/60">No History</p>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mt-1">You haven't completed tasks today.</p>
            </motion.div>
          )
        )}
      </div>

      {/* Modals */}
      {modalType === 'DELIVERED' && activeTask && (
        <ProofOfDeliveryModal
          expectedAmount={0}
          paymentStatus={'PAID'}
          onClose={() => setModalType(null)}
          onConfirm={(cash, notes) => processAction(activeTask, 'DELIVERED', { cashCollected: cash, notes })}
        />
      )}

      {modalType === 'FAILED_DELIVERY' && activeTask && (
        <FailureReasonModal
          onClose={() => setModalType(null)}
          onConfirm={(reason, notes) => processAction(activeTask, 'FAILED_DELIVERY', { failureReason: reason, notes })}
        />
      )}
    </div>
  )
}
