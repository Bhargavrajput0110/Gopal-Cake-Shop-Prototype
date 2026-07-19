"use client";

import { useState, useEffect } from "react";
import { Car, TickCircle, Location, Box, Danger } from "iconsax-react";
import { useOrders } from "@/context/OrderContext";
import { BackButton } from "@/components/ui/BackButton";

type DriverWorkload = {
  driverId: string;
  name: string;
  phone: string;
  branch: string;
  activeCount: number;
  deliveredToday: number;
  lateCount: number;
  isOverloaded: boolean;
};

export default function DeliveryCoordinationPage() {
  const { orders, assignDriverToOrder } = useOrders();
  const [selectedRider, setSelectedRider] = useState<Record<string, string>>({});
  const [currentBranch, setCurrentBranch] = useState("Khanderao Branch"); // Salesperson's active branch
  const [drivers, setDrivers] = useState<DriverWorkload[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch("/api/v1/admin/drivers/workload");
        const json = await res.json();
        if (Array.isArray(json)) {
          setDrivers(json);
        }
      } catch (e) {
        console.error("Failed to fetch drivers", e);
      } finally {
        setIsLoadingDrivers(false);
      }
    };
    fetchDrivers();
  }, []);

  // Fetch pending delivery orders
  const pendingDeliveries = orders.filter(o => 
    o.orderType === "delivery" && 
    (o.status === "PENDING_ASSIGNMENT" || o.status === "READY_FOR_PICKUP")
  );

  // Fetch active and completed deliveries
  const activeDeliveries = orders.filter(o => 
    o.orderType === "delivery" && 
    ["ASSIGNED_TO_DRIVER", "PICKED_UP", "ON_THE_WAY"].includes(o.status)
  );

  const completedDeliveries = orders.filter(o => 
    o.orderType === "delivery" && o.status === "DELIVERED"
  );

  const handleAssign = async (orderId: string) => {
    const driverId = selectedRider[orderId];
    if (!driverId) {
      alert("Please select a driver first.");
      return;
    }
    const driver = drivers.find(d => d.driverId === driverId);
    if (driver) {
      setAssigningOrderId(orderId);
      await assignDriverToOrder(orderId, driver.driverId, driver.name);
      setAssigningOrderId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-2">
            <BackButton fallback="/sales" label="Back to Sales" variant="outline" size="sm" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Car className="w-6 h-6 text-primary" /> Delivery Assignment ({currentBranch})
          </h2>
          <p className="text-muted-foreground text-sm">Assign ready cakes to riders (including cross-branch driver overrides during high load).</p>
        </div>
        
        {/* Toggle active branch for testing purposes in prototype */}
        <select 
          value={currentBranch} 
          onChange={(e) => setCurrentBranch(e.target.value)}
          className="p-2 border rounded-lg text-sm bg-card text-foreground"
        >
          <option value="Khanderao Branch">Khanderao Branch</option>
          <option value="Uma Branch">Uma Branch</option>
          <option value="Varasiya Factory Outlet">Varasiya Factory Outlet</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cakes Ready for Pickup */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="font-bold border-b border-border pb-2 text-foreground flex justify-between items-center">
            <span>Ready for Dispatch</span>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
              {pendingDeliveries.length} Cake{pendingDeliveries.length !== 1 ? 's' : ''}
            </span>
          </h3>
          
          {pendingDeliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No pending delivery assignments.</p>
          ) : (
            pendingDeliveries.map((order) => {
              const isOverload = order.branch !== currentBranch;
              return (
                <div key={order.id} className={`border rounded-xl p-4 transition-all ${isOverload ? 'border-amber-300 bg-amber-50/10' : 'border-border bg-secondary/10'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-black text-lg text-foreground">{order.id}</span>
                      <span className="text-[10px] text-muted-foreground block font-bold">Branch: {order.branch}</span>
                    </div>
                    {isOverload ? (
                      <span className="text-[9px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                        <Danger className="w-3 h-3" /> External Branch Load
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest">Waiting Assignment</span>
                    )}
                  </div>
                  <p className="font-medium text-foreground">
                    {order.items.map(i => `${i.qty}x ${i.name}`).join(", ")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Location className="w-3.5 h-3.5 text-primary" /> Deliver to: {order.delivery?.address || "Address Not Available"}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <select 
                      value={selectedRider[order.id] || ""}
                      onChange={(e) => setSelectedRider(prev => ({ ...prev, [order.id]: e.target.value }))}
                      className="flex-1 p-2 rounded-lg border border-input bg-background text-sm font-medium"
                      disabled={isLoadingDrivers || assigningOrderId === order.id}
                    >
                      <option value="">{isLoadingDrivers ? "Loading riders..." : "Select Rider..."}</option>
                      {drivers.map(d => {
                        const isCrossBranch = d.branch !== order.branch;
                        const overloadWarning = d.isOverloaded ? " ⚠️ (Overloaded)" : "";
                        return (
                          <option key={d.driverId} value={d.driverId}>
                            {d.name} &bull; {d.branch} {isCrossBranch ? "(Cross-Branch Override)" : ""}{overloadWarning}
                          </option>
                        );
                      })}
                    </select>
                    <button 
                      onClick={() => handleAssign(order.id)}
                      disabled={assigningOrderId === order.id || isLoadingDrivers}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {assigningOrderId === order.id ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Active Deliveries */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="font-bold border-b border-border pb-2 text-foreground">Rider Status & Active Trips</h3>
          
          {activeDeliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center font-bold">No active delivery trips.</p>
          ) : (
            activeDeliveries.map((order) => (
              <div key={order.id} className="border border-blue-500/20 rounded-xl p-4 bg-blue-500/5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-black text-lg text-foreground">{order.id}</span>
                    <span className="text-[10px] text-muted-foreground block font-semibold">From: {order.branch}</span>
                  </div>
                  <span className="text-[10px] bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest flex items-center gap-1">
                    <Box className="w-3 h-3" /> {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-medium text-foreground">{order.items.map(i => i.name).join(", ")}</p>
                    <p className="text-xs text-muted-foreground mt-1">Assigned to: <span className="font-bold text-foreground">{order.assignedDriverName || "Unknown"}</span></p>
                  </div>
                </div>
              </div>
            ))
          )}

          {completedDeliveries.length > 0 && (
            <div className="pt-4 border-t border-border space-y-3">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Delivered Today</h4>
              {completedDeliveries.map((order) => (
                <div key={order.id} className="border border-emerald-500/20 rounded-xl p-3 bg-emerald-500/5 opacity-75 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-sm text-foreground">{order.id}</span>
                    <p className="text-xs text-muted-foreground">Rider: {order.assignedDriverName}</p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-bold uppercase tracking-widest flex items-center gap-1">
                    <TickCircle className="w-3 h-3" /> Delivered
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
