"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

export type OrderStatus = 
  | "QUOTE_DRAFT"
  | "QUOTE_SENT"
  | "QUOTE_APPROVED"
  | "QUOTE_EXPIRED"
  | "QUOTE_REJECTED"
  | "QUOTE_CONVERTED"
  | "DRAFT"
  | "NEW" 
  | "WAITING_FOR_CHEF"
  | "CHEF_ACCEPTED" 
  | "MAKING"
  | "DECORATING" 
  | "READY_FOR_PICKUP" 
  | "PENDING_ASSIGNMENT" 
  | "ASSIGNED_TO_DRIVER" 
  | "PICKED_UP" 
  | "ON_THE_WAY" 
  | "DELIVERED" 
  | "FAILED_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

export type VendorType = "flower" | "photo" | "acrylic";
export type VendorTask = {
  vendorId?: string;
  vendorName?: string;
  vendorType: VendorType;
  status: "pending" | "accepted" | "in_progress" | "ready";
  instructions: string;
  referenceImage?: string;
  notes?: { text: string; timestamp: string; read: boolean }[];
};

export type IngredientRequest = {
  id: string;
  itemCode: string;
  itemName: string;
  qty?: number, unit?: string;
  requestedBy: string;
  status: "pending" | "resolved";
  timestamp: string;
};

export type TimelineEvent = {
  event: string;
  actor: string;
  timestamp: string;
};

export type AuditEntry = {
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  timestamp: string;
};

export type Order = {
  id: string;
  orderType: "delivery" | "pickup" | "walk_in" | "phone";
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  delivery?: {
    address: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
  };
  branch: string;
  items: { id?: string; name: string; qty: number; weight?: string; notes?: string; productId?: string; referenceImages?: string[]; printImages?: string[] }[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryCharge: number;
  grandTotal: number;
  advancePaid: number;
  pendingBalance: number;
  priorityLevel: "normal" | "high" | "vip";
  isSurprise: boolean;
  vip: boolean;
  timeTarget: string;
  createdAt: string;
  customerInstructions?: string;
  productionStartTime?: string;
  delayLevel?: "none" | "warning" | "delayed";
  assignedChef?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  vendorTasks?: VendorTask[];
  cakeImage?: string;
  ingredientRequests?: IngredientRequest[];
  timeline?: TimelineEvent[];
  transferHistory?: { from: string; to: string; note: string; timestamp: string }[];
  auditLog?: AuditEntry[];
  requestedDiscountOverride?: {
    amount: number;
    isPercent: boolean;
    requestedBy: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
  };
  payments?: { paymentType: string; amount: number; method: string; timestamp: string }[];
  approvedAt?: string;
  acceptedAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  updatedAt?: string;
  version?: number;
  deletedAt?: string;
  deletedBy?: string;
  createdBy?: string;
  updatedBy?: string;
};

type OrderContextType = {
  orders: Order[];
  updateOrderStatus: (id: string, status: OrderStatus, updateProductionTime?: boolean, assignedChef?: string, payload?: any) => Promise<void>;
  assignDriverToOrder: (orderId: string, driverId: string, driverName: string) => Promise<void>;
  // Mock implementations for remaining functions to satisfy TypeScript temporarily
  updateVendorTaskStatus: (orderId: string, vendorType: VendorType, status: VendorTask["status"], vendorId?: string, vendorName?: string, taskId?: string) => void;
  addVendorNote: (orderId: string, vendorType: VendorType, noteText: string, vendorName?: string, taskId?: string) => void;
  reportIssue: (id: string, issueType: string, severity: "normal" | "urgent", notes: string) => void;
  addIngredientRequest: (orderId: string, itemName: string, qty: number, unit: string) => Promise<void>;
  updateIngredientRequestStatus: (orderId: string, requestId: string, status: "pending" | "fulfilled" | "cancelled" | "resolved", supplierName?: string) => Promise<void>;
  updateOrderFields: (orderId: string, fields: Partial<Order>) => Promise<void>;
  transitionOrderAction: (id: string, action: string, note?: string) => Promise<void>;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize Socket and fetch initial orders
  useEffect(() => {
    // Connect to custom Socket.IO server
    const newSocket = io(window.location.origin);
    
    const refetchOrders = () => {
      fetch("/api/v1/orders?limit=50").then(res => res.json()).then(data => {
        if (data && data.success && data.data) {
          setOrders(data.data);
        }
      }).catch(console.error);
    };

    fetch('/api/auth/session').then(res => res.json()).then(session => {
      const branchId = session?.user?.branchId;
      
      // Re-join rooms and fetch authoritative state on EVERY connection (handles server restart/disconnect recovery)
      newSocket.on('connect', () => {
        if (branchId) newSocket.emit("join_branch", branchId);
        if (session?.user?.role === 'ADMIN') newSocket.emit("join_admin");
        refetchOrders();
      });

      // Also join immediately if it's already connected by the time this fetch completes
      if (newSocket.connected) {
        if (branchId) newSocket.emit("join_branch", branchId);
        if (session?.user?.role === 'ADMIN') newSocket.emit("join_admin");
      }
    }).catch(console.error);
    
    newSocket.on("order_updated", refetchOrders);
    newSocket.on("order_created", refetchOrders);


    setSocket(newSocket);

    // Real-time synchronization handled via Socket.IO events (order_created, order_updated)

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const transitionOrderAction = async (id: string, action: string, note?: string) => {
    try {
      const response = await fetch(`/api/v1/orders/${id}/actions/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      const data = await response.json();
      
      if (!data.success) {
        alert(data.message || data.error?.message || "Failed to transition order.");
      }
      
      // Always refetch to sync state
      const refresh = await fetch("/api/v1/orders?limit=50");
      const refreshData = await refresh.json();
      if (refreshData.success && refreshData.data) setOrders(refreshData.data);
    } catch (e) {
      console.error(e);
      alert("Error transitioning order.");
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus, updateProductionTime?: boolean, assignedChef?: string, payload?: any) => {
    try {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          actorId: assignedChef, 
          actorName: assignedChef, 
          ...(updateProductionTime ? { productionStartTime: new Date().toISOString() } : {}),
          ...payload 
        })
      });
      const data = await response.json();
      
      if (!data.success && data.error?.httpStatus === 409) {
        alert(data.error.message || "Conflict: This order state was recently changed by someone else.");
        // Refetch to sync state
        const refresh = await fetch("/api/orders");
        const refreshData = await refresh.json();
        if (refreshData.success) setOrders(refreshData.orders);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const assignDriverToOrder = async (orderId: string, driverId: string, driverName: string) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "ASSIGNED_TO_DRIVER", assignedDriverId: driverId, assignedDriverName: driverName } : o));
    try {
      const response = await fetch(`/api/v1/admin/drivers/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, driverId, driverName })
      });
      const data = await response.json();

      if (!data.success) {
        if (data.error?.httpStatus === 409) {
          alert("409 Conflict: " + (data.error.message || "Order already assigned."));
        } else {
          alert("Assignment failed.");
        }
        // Refetch to sync state
        const refresh = await fetch("/api/orders");
        const refreshData = await refresh.json();
        if (refreshData.success) setOrders(refreshData.orders);
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateVendorTaskStatus = async (orderId: string, vendorType: VendorType, status: VendorTask["status"], vendorId?: string, vendorName?: string, taskId?: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/vendor-task`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status, vendorType, vendorName })
      });
      const data = await response.json();
      if (!data.success) alert("Failed to update vendor task");
      else setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
    } catch (e) { console.error(e); }
  };
  
  const addVendorNote = async (orderId: string, vendorType: VendorType, noteText: string, vendorName?: string, taskId?: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/vendor-task`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, vendorType, vendorName, noteText })
      });
      const data = await response.json();
      if (!data.success) alert("Failed to add vendor note");
      else setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
    } catch (e) { console.error(e); }
  };
  
  const reportIssue = (id: string, issueType: string, severity: "normal" | "urgent", notes: string) => {};
  const addIngredientRequest = async (orderId: string, item: string, qty?: number, unit?: string, ) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/ingredient-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, qty, unit })
      });
      const data = await response.json();
      if (!data.success) {
        alert("Failed to add ingredient request: " + (data.error?.message || "Unknown error"));
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
      }
    } catch (e) {
      console.error(e);
      alert("Error adding ingredient request");
    }
  };
  const updateIngredientRequestStatus = async (orderId: string, requestId: string, status: "pending" | "fulfilled" | "cancelled" | "resolved", supplierName?: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/ingredient-request`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status, supplierName })
      });
      const data = await response.json();
      if (!data.success) {
        alert("Failed to update request: " + (data.error?.message || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert("Error updating ingredient request");
    }
  };

  const updateOrderFields = async (orderId: string, fields: Partial<Order>) => {
    // Optimistically update local state
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...fields } as Order : o));
    
    try {
      const response = await fetch(`/api/v1/orders/${orderId}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      const data = await response.json();
      
      if (!data.success) {
        alert(data.error || data.message || "Failed to update order fields");
        // Revert on failure by refetching
        const refresh = await fetch("/api/v1/orders?limit=50");
        const refreshData = await refresh.json();
        if (refreshData.success && refreshData.data) setOrders(refreshData.data);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update order fields");
      // Revert on failure by refetching
      const refresh = await fetch("/api/v1/orders?limit=50");
      const refreshData = await refresh.json();
      if (refreshData.success && refreshData.data) setOrders(refreshData.data);
    }
  };

  return (
    <OrderContext.Provider value={{ 
      orders, 
      updateOrderStatus, 
      assignDriverToOrder,
      updateVendorTaskStatus,
      addVendorNote,
      reportIssue,
      addIngredientRequest,
      updateIngredientRequestStatus,
      updateOrderFields,
      transitionOrderAction
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
}
