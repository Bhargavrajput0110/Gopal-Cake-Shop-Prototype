'use client'

import React, { useState, useEffect } from 'react'
import { Activity, Warning2, TickCircle, Location, Routing, Map, DirectboxSend, CloseCircle } from "iconsax-react"
import { BackButton } from "@/components/ui/BackButton"
import { OrderCard } from "@/components/domain/OrderCard"

interface MockOrder {
  id: string
  orderNumber: string
  customerName: string
  address: string
  branch: string
  distance: number
  status: 'READY' | 'DELAYED'
  items: { name: string; quantity: number; weight?: number }[]
  grandTotal: number
}

interface MockDriver {
  id: string
  name: string
  phone: string
  branch: string
  activeCount: number
  deliveredToday: number
  lateCount: number
  isOverloaded: boolean
  status: 'AVAILABLE' | 'ON_DELIVERY' | 'OFFLINE'
}

export default function AdminDriversPage() {
  const [selectedBranch, setSelectedBranch] = useState<string>('All')
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null)
  
  const branches = ['All', 'Khanderao', 'Uma', 'Warasiya', 'Ellora']

  const [drivers, setDrivers] = useState<MockDriver[]>([])
  const [orders, setOrders] = useState<MockOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFleet() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/admin/drivers/fleet?branchName=${encodeURIComponent(selectedBranch)}`);
        const json = await res.json();
        if (json.success) {
          setDrivers(json.drivers);
          setOrders(json.dispatchOrders);
        }
      } catch (err) {
        console.error('Failed to fetch fleet:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFleet();
  }, [selectedBranch]);

  const filteredDrivers = drivers;
  const filteredOrders = orders;

  const handleAssignClick = (order: MockOrder) => {
    setSelectedOrder(order)
    setAssignModalOpen(true)
  }

  if (loading && drivers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] relative">
      <div className="absolute top-6 left-6 z-50 print:hidden">
        <BackButton fallback="/admin" label="Back to Dashboard" variant="ghost" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
      </div>
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}></div>
      
      <div className="relative z-10 p-6 md:p-10 pb-20 pt-20 max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-6 border-b border-[var(--border)] pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-[var(--foreground)] leading-none">
              Driver Fleet Management
            </h1>
            <p className="font-editorial italic text-[var(--muted-foreground)] text-lg mt-2">Real-time dispatch and logistics overview.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-md border border-emerald-100 rounded-full px-4 py-2 shadow-sm font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            Live Fleet Tracking
          </div>
        </div>

        {/* Branch Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar print:hidden">
          {branches.map(branch => (
            <button
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              className={`px-6 py-3 rounded-full font-ui text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedBranch === branch 
                  ? 'bg-[var(--foreground)] text-[var(--background)] shadow-md' 
                  : 'bg-white border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              {branch}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Orders Awaiting Dispatch */}
          <div className="lg:col-span-1 bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] p-6 shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] flex flex-col relative overflow-hidden h-fit">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <DirectboxSend className="w-6 h-6 text-orange-500" /> Dispatch Queue
              </h2>
              <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-3 py-1 rounded-full">{filteredOrders.length} Pending</span>
            </div>
            
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-500 font-bold text-sm">No orders waiting for dispatch.</p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div key={order.id} className="relative">
                    <OrderCard 
                      orderId={order.orderNumber}
                      status={order.status}
                      customerName={order.customerName}
                      items={order.items}
                      timeTarget="Target: 14:30"
                      createdAt={new Date().toISOString()}
                      grandTotal={order.grandTotal}
                      isFarDistance={order.distance > 20}
                      onAssign={() => handleAssignClick(order)}
                    />
                    <div className="mt-2 text-xs text-muted-foreground bg-gray-50 p-2 rounded border border-gray-100 flex items-start gap-1">
                      <Location className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/> 
                      <span>{order.address}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Fleet */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDrivers.map(driver => (
                <div key={driver.id} className={`bg-white/80 backdrop-blur-md border rounded-[2rem] p-6 shadow-sm relative overflow-hidden ${driver.isOverloaded ? 'border-rose-300 bg-rose-50/50' : 'border-[var(--border)]'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-display text-xl font-bold">{driver.name}</h3>
                      <p className="font-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{driver.branch} • {driver.phone}</p>
                    </div>
                    {driver.status === 'AVAILABLE' && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded border border-emerald-200">AVAILABLE</span>}
                    {driver.status === 'ON_DELIVERY' && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded border border-blue-200">ON DELIVERY</span>}
                    {driver.status === 'OFFLINE' && <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded border border-gray-300">OFFLINE</span>}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                      <p className="text-[9px] font-ui uppercase font-bold text-gray-500">Active</p>
                      <p className="text-xl font-black font-display">{driver.activeCount}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                      <p className="text-[9px] font-ui uppercase font-bold text-emerald-700">Done</p>
                      <p className="text-xl font-black font-display text-emerald-700">{driver.deliveredToday}</p>
                    </div>
                    <div className={`p-3 rounded-xl border text-center ${driver.lateCount > 0 ? 'bg-rose-50 border-rose-100' : 'bg-gray-50 border-gray-100'}`}>
                      <p className={`text-[9px] font-ui uppercase font-bold ${driver.lateCount > 0 ? 'text-rose-700' : 'text-gray-500'}`}>Late</p>
                      <p className={`text-xl font-black font-display ${driver.lateCount > 0 ? 'text-rose-700' : ''}`}>{driver.lateCount}</p>
                    </div>
                  </div>

                  {driver.isOverloaded && (
                    <div className="mb-4 bg-rose-100 text-rose-700 text-xs font-bold p-2 rounded-lg flex items-center gap-2">
                      <Warning2 className="w-4 h-4" /> Driver is currently overloaded (4+ orders)
                    </div>
                  )}

                  <button className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 rounded-xl font-ui text-[10px] font-bold uppercase tracking-wider transition-colors flex justify-center items-center gap-2">
                    <Map className="w-4 h-4" /> View on Map
                  </button>
                </div>
              ))}
            </div>
            {filteredDrivers.length === 0 && (
              <div className="text-center p-12 bg-white/50 border border-[var(--border)] rounded-[2.5rem]">
                <p className="text-gray-500 font-bold">No drivers found for this branch.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Assign Modal */}
      {assignModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-display text-xl font-bold">Assign Driver</h3>
                <p className="text-xs font-ui uppercase tracking-wider text-muted-foreground font-bold mt-1">{selectedOrder.orderNumber}</p>
              </div>
              <button onClick={() => setAssignModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <CloseCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-gray-700 mb-4">Select an active driver in {selectedOrder.branch}:</p>
              {drivers.filter(d => d.branch === selectedOrder.branch && d.status !== 'OFFLINE').map(driver => (
                <div key={driver.id} className="flex justify-between items-center p-4 border border-border rounded-xl hover:bg-gray-50 cursor-pointer group transition-colors">
                  <div>
                    <h4 className="font-bold text-sm">{driver.name}</h4>
                    <p className="text-[10px] font-ui uppercase tracking-wider text-muted-foreground font-bold mt-1">
                      {driver.activeCount} Active Orders • {driver.status === 'AVAILABLE' ? <span className="text-emerald-500">Available</span> : <span className="text-blue-500">On Route</span>}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      alert(`Order ${selectedOrder.orderNumber} assigned to ${driver.name}`)
                      setAssignModalOpen(false)
                    }}
                    className="bg-[var(--brand-champagne)] text-white px-4 py-2 rounded-lg font-ui text-[10px] font-bold uppercase tracking-wider group-hover:scale-105 transition-transform"
                  >
                    Assign
                  </button>
                </div>
              ))}
              {drivers.filter(d => d.branch === selectedOrder.branch && d.status !== 'OFFLINE').length === 0 && (
                <p className="text-center text-rose-500 font-bold p-4 bg-rose-50 rounded-xl">No active drivers available in this branch.</p>
              )}
              
              <div className="pt-4 mt-2 border-t border-border">
                <button 
                  onClick={() => setAssignModalOpen(false)}
                  className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-xl font-ui text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
