'use client'

import React, { useState, useEffect } from 'react'
import { Activity, DirectboxSend, CloseCircle, User, Location, Calendar } from "iconsax-react"
import { BackButton } from "@/components/ui/BackButton"
import { OrderCard } from "@/components/domain/OrderCard"

interface DeliveryAssignment {
  status: string
  deliveryPerson: string
  assignedBy: string
  assignedAt: string
  unassignedAt: string | null
}

interface MockOrder {
  id: string
  orderNumber: string
  customerName: string
  address: string
  branch: string
  distance: number
  status: string
  targetDate: string
  items: { name: string; quantity: number; weight?: number }[]
  grandTotal: number
  assignedDriver: { name: string; phone: string } | null
  assignments: DeliveryAssignment[]
}

interface MockDriver {
  id: string
  name: string
  phone: string
  branch: string
  activeCount: number
  deliveredToday: number
  status: 'AVAILABLE' | 'ON_DELIVERY' | 'OFFLINE'
}

export default function AdminDriversPage() {
  const [selectedBranch, setSelectedBranch] = useState<string>('All')
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  
  const branches = ['All', 'Khanderao', 'Uma', 'Warasiya', 'Ellora']

  const [drivers, setDrivers] = useState<MockDriver[]>([])
  const [orders, setOrders] = useState<MockOrder[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    fetchFleet();
  }, [selectedBranch]);

  const handleAssignClick = (order: MockOrder) => {
    setSelectedOrder(order)
    setAssignModalOpen(true)
  }

  const handleHistoryClick = (order: MockOrder) => {
    setSelectedOrder(order)
    setHistoryModalOpen(true)
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
              Delivery Assignments
            </h1>
            <p className="font-editorial italic text-[var(--muted-foreground)] text-lg mt-2">Manage dispatch and delivery staff.</p>
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
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] p-6 shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] flex flex-col relative overflow-hidden h-fit">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <DirectboxSend className="w-6 h-6 text-orange-500" /> Deliveries
              </h2>
              <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-3 py-1 rounded-full">{orders.length} Total</span>
            </div>
            
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-500 font-bold text-sm">No delivery orders found.</p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="relative bg-white border border-border p-4 rounded-2xl">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-bold text-lg">{order.orderNumber}</h4>
                        <p className="text-sm text-gray-500">{order.customerName}</p>
                        <p className="text-xs text-gray-400 mt-1">Fulfillment Branch: UMA • Distance: {order.distance?.toFixed(1) || 0} km (UMA → Customer)</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full ${
                          order.status === 'ASSIGNED_TO_DRIVER' ? 'bg-blue-100 text-blue-700' : 
                          order.status === 'PENDING_ASSIGNMENT' || order.status === 'READY_FOR_PICKUP' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button 
                        className="px-4 py-2 bg-black text-white text-xs font-bold uppercase rounded-lg"
                        onClick={() => handleAssignClick(order)}
                      >
                        {order.assignedDriver ? 'Reassign' : 'Assign Delivery Person'}
                      </button>
                      <button 
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg"
                        onClick={() => handleHistoryClick(order)}
                      >
                        View History
                      </button>
                      <button 
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg"
                        onClick={() => alert('Call customer functionality')}
                      >
                        Call Customer
                      </button>
                    </div>

                    {order.assignedDriver && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                        <User className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-xs font-bold text-blue-900">Assigned To: {order.assignedDriver.name}</p>
                          <p className="text-[10px] text-blue-700">{order.assignedDriver.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Delivery Staff */}
          <div className="lg:col-span-1">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2 mb-6">
              <User className="w-6 h-6 text-gray-700" /> Delivery Staff
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {drivers.map(driver => (
                <div key={driver.id} className="bg-white/80 backdrop-blur-md border rounded-[2rem] p-6 shadow-sm relative overflow-hidden border-[var(--border)]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-display text-xl font-bold">{driver.name}</h3>
                      <p className="font-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{driver.branch} • {driver.phone}</p>
                    </div>
                    {driver.status === 'AVAILABLE' && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded border border-emerald-200">AVAILABLE</span>}
                    {driver.status === 'ON_DELIVERY' && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded border border-blue-200">ON DELIVERY</span>}
                    {driver.status === 'OFFLINE' && <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded border border-gray-300">OFFLINE</span>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                      <p className="text-[9px] font-ui uppercase font-bold text-gray-500">Active</p>
                      <p className="text-xl font-black font-display">{driver.activeCount}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                      <p className="text-[9px] font-ui uppercase font-bold text-emerald-700">Done</p>
                      <p className="text-xl font-black font-display text-emerald-700">{driver.deliveredToday}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {drivers.length === 0 && (
              <div className="text-center p-12 bg-white/50 border border-[var(--border)] rounded-[2.5rem]">
                <p className="text-gray-500 font-bold">No delivery staff found.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Assign Modal */}
      {assignModalOpen && selectedOrder && (
        <AssignModal 
          order={selectedOrder} 
          drivers={drivers} 
          onClose={() => setAssignModalOpen(false)} 
          onSuccess={() => {
            setAssignModalOpen(false);
            fetchFleet();
          }} 
        />
      )}

      {/* History Modal */}
      {historyModalOpen && selectedOrder && (
        <HistoryModal 
          order={selectedOrder} 
          onClose={() => setHistoryModalOpen(false)} 
        />
      )}
    </div>
  )
}

function AssignModal({ order, drivers, onClose, onSuccess }: { order: MockOrder, drivers: MockDriver[], onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);

  const assign = async (driverId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${order.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryPersonId: driverId })
      });
      const json = await res.json();
      if (json.success) {
        alert('Assigned successfully');
        onSuccess();
      } else {
        alert('Error: ' + json.error);
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-border">
        <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-display text-xl font-bold">Assign Delivery Person</h3>
            <p className="text-xs font-ui uppercase tracking-wider text-muted-foreground font-bold mt-1">{order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <CloseCircle className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm font-bold text-gray-700 mb-4">Select an active delivery staff member:</p>
          {drivers.map(driver => (
            <div key={driver.id} className="flex justify-between items-center p-4 border border-border rounded-xl hover:bg-gray-50 cursor-pointer group transition-colors">
              <div>
                <h4 className="font-bold text-sm">{driver.name}</h4>
                <p className="text-[10px] font-ui uppercase tracking-wider text-muted-foreground font-bold mt-1">
                  {driver.activeCount} Active Orders • {driver.branch}
                </p>
              </div>
              <button 
                onClick={() => assign(driver.id)}
                disabled={loading}
                className="bg-black text-white px-4 py-2 rounded-lg font-ui text-[10px] font-bold uppercase tracking-wider group-hover:scale-105 transition-transform disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          ))}
          
          <div className="pt-4 mt-2 border-t border-border">
            <button 
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-xl font-ui text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function HistoryModal({ order, onClose }: { order: MockOrder, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-border">
        <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-display text-xl font-bold">Assignment History</h3>
            <p className="text-xs font-ui uppercase tracking-wider text-muted-foreground font-bold mt-1">{order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <CloseCircle className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {order.assignments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No assignment history found.</p>
          ) : (
            order.assignments.map((a, i) => (
              <div key={i} className="border border-border p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
                    a.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {a.status}
                  </span>
                </div>
                <p className="text-sm font-bold">Assigned to: {a.deliveryPerson}</p>
                <p className="text-xs text-gray-500 mt-1">Assigned by: {a.assignedBy}</p>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Calendar size={12}/> {new Date(a.assignedAt).toLocaleString()}</p>
                {a.unassignedAt && (
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12}/> Unassigned: {new Date(a.unassignedAt).toLocaleString()}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
