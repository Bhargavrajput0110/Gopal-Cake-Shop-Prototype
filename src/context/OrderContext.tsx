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
  id?: string;
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
  status: "pending" | "resolved" | "fulfilled" | "cancelled";
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
  orderNumber?: string;
};

type OrderContextType = {
  orders: Order[];
  updateOrderStatus: (id: string, status: OrderStatus, updateProductionTime?: boolean, assignedChef?: string, payload?: any) => Promise<void>;
  assignDriverToOrder: (orderId: string, driverId: string, driverName: string) => Promise<void>;
  // Mock implementations for remaining functions to satisfy TypeScript temporarily
  updateVendorTaskStatus: (orderId: string, vendorType: VendorType, status: VendorTask["status"], vendorId?: string, vendorName?: string, taskId?: string) => void;
  addVendorNote: (orderId: string, vendorType: VendorType, noteText: string, vendorName?: string, taskId?: string) => void;
  reportIssue: (id: string, issueType: string, severity: "normal" | "urgent", notes: string) => void;
  addIngredientRequest: (orderId: string, itemName: string, qty?: number, unit?: string) => Promise<void>;
  updateIngredientRequestStatus: (orderId: string, requestId: string, status: "pending" | "fulfilled" | "cancelled" | "resolved", supplierName?: string) => Promise<void>;
  updateOrderFields: (orderId: string, fields: Partial<Order>) => Promise<void>;
  transitionOrderAction: (id: string, action: string, note?: string) => Promise<void>;
  socket: Socket | null;
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
      fetch("/api/v1/orders?limit=500").then(res => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
          return null;
        }
        return res.json();
      }).then(data => {
        if (data && data.success && data.data) {
          setOrders(data.data);
        }
      }).catch((err) => {
        console.warn("Could not fetch orders (server might be restarting):", err);
      });
    };

    // Fetch orders immediately on component mount
    refetchOrders();

    fetch('/api/auth/session').then(res => {
      if (!res.ok) return null;
      return res.json();
    }).then(session => {
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
    }).catch((err) => {
      console.warn("Could not fetch session (server might be restarting):", err);
    });
    
    newSocket.on("order_updated", refetchOrders);
    newSocket.on("order_created", refetchOrders);


    setSocket(newSocket);

    // Real-time synchronization handled via Socket.IO events (order_created, order_updated)

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const transitionOrderAction = async (id: string, action: string, note?: string) => {
    const optimisticStatusMap: Record<string, OrderStatus> = {
      "approve": "WAITING_FOR_CHEF",
      "chef-accept": "CHEF_ACCEPTED",
      "start-making": "MAKING",
      "start-decorating": "DECORATING",
      "ready": "READY_FOR_PICKUP",
      "assign-driver": "ASSIGNED_TO_DRIVER",
      "pick-up": "PICKED_UP",
      "on-the-way": "ON_THE_WAY",
      "deliver": "DELIVERED",
      "complete": "COMPLETED",
      "cancel": "CANCELLED"
    };
    if (optimisticStatusMap[action]) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: optimisticStatusMap[action] } : o));
    }

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
      const refresh = await fetch("/api/v1/orders?limit=500");
      const refreshData = await refresh.json();
      if (refreshData.success && refreshData.data) setOrders(refreshData.data);
    } catch (e) {
      console.error(e);
      alert("Error transitioning order.");
      const refresh = await fetch("/api/v1/orders?limit=500");
      const refreshData = await refresh.json();
      if (refreshData.success && refreshData.data) setOrders(refreshData.data);
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus, updateProductionTime?: boolean, assignedChef?: string, payload?: any) => {
    // Map status enum to the correct action verb for the verified actions endpoint.
    // Ref: src/app/api/v1/orders/[id]/actions/[action]/route.ts
    const statusToAction: Partial<Record<OrderStatus, string>> = {
      WAITING_FOR_CHEF: 'approve',
      CHEF_ACCEPTED:    'chef-accept',
      MAKING:           'start-making',
      DECORATING:       'start-decorating',
      READY_FOR_PICKUP: 'ready',
      ASSIGNED_TO_DRIVER: 'assign-driver',
      PICKED_UP:        'pick-up',
      ON_THE_WAY:       'on-the-way',
      DELIVERED:        'deliver',
      COMPLETED:        'complete',
      CANCELLED:        'cancel',
    };
    const action = statusToAction[status];
    if (!action) {
      console.warn(`[OrderContext] updateOrderStatus: no action mapping for status '${status}'. Skipping.`);
      return;
    }
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    try {
      const response = await fetch(`/api/v1/orders/${id}/actions/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: payload?.note })
      });
      const data = await response.json();
      if (!data.success) {
        if (data.error?.httpStatus === 409 || response.status === 409) {
          alert(data.error?.message || data.message || 'Conflict: This order was recently changed by someone else.');
        } else {
          alert(data.error?.message || data.message || 'Failed to update order status.');
        }
      }
      // Always refetch to sync authoritative state
      const refresh = await fetch('/api/v1/orders?limit=500');
      const refreshData = await refresh.json();
      if (refreshData.success && refreshData.data) setOrders(refreshData.data);
    } catch (e) {
      console.error('[OrderContext] updateOrderStatus error:', e);
      alert('Network error updating order status. Please refresh.');
      const refresh = await fetch('/api/v1/orders?limit=500');
      const refreshData = await refresh.json();
      if (refreshData.success && refreshData.data) setOrders(refreshData.data);
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
        const refresh = await fetch("/api/v1/orders?limit=500");
        const refreshData = await refresh.json();
        if (refreshData.success && refreshData.data) setOrders(refreshData.data);
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateVendorTaskStatus = async (orderId: string, vendorType: VendorType, status: VendorTask["status"], vendorId?: string, vendorName?: string, taskId?: string) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updatedTasks = (o.vendorTasks || []).map(t =>
        (taskId ? t.id === taskId : t.vendorType === vendorType) 
          ? { ...t, status, ...(vendorId ? { vendorId } : {}), ...(vendorName ? { vendorName } : {}) } 
          : t
      );
      return { ...o, vendorTasks: updatedTasks };
    }));

    try {
      if (taskId) {
        const response = await fetch(`/api/v1/orders/${orderId}/vendor-tasks`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, status, vendorId })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
      }
      // If we don't have a taskId, we might be creating it, but UI uses VendorAssignModal for creation
    } catch (e) {
      console.error(e);
      const refresh = await fetch("/api/v1/orders?limit=500");
      const refreshData = await refresh.json();
      if (refreshData.success && refreshData.data) setOrders(refreshData.data);
    }
  };

  const addVendorNote = async (orderId: string, vendorType: VendorType, noteText: string, vendorName?: string, taskId?: string) => {
    if (!taskId) return;
    const newNote = { text: noteText, timestamp: new Date().toISOString(), read: false };
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updatedTasks = (o.vendorTasks || []).map(t =>
        t.id === taskId ? { ...t, notes: [...(t.notes || []), newNote] } : t
      );
      return { ...o, vendorTasks: updatedTasks };
    }));

    try {
      const response = await fetch(`/api/v1/orders/${orderId}/vendor-tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, note: noteText })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
    } catch (e) {
      console.error(e);
      const refresh = await fetch("/api/v1/orders?limit=500");
      const refreshData = await refresh.json();
      if (refreshData.success && refreshData.data) setOrders(refreshData.data);
    }
  };
  
  const reportIssue = (id: string, issueType: string, severity: "normal" | "urgent", notes: string) => {};

  const addIngredientRequest = async (orderId: string, item: string, qty?: number, unit?: string) => {
    const optimisticReq: IngredientRequest = {
      id: `tmp-${Date.now()}`,
      itemCode: item.toUpperCase().replace(/\s+/g, '_'),
      itemName: item,
      qty,
      unit,
      requestedBy: 'Chef',
      status: 'pending' as const,
      timestamp: new Date().toISOString()
    };
    
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, ingredientRequests: [...(o.ingredientRequests || []), optimisticReq], delayLevel: 'warning' }
        : o
    ));

    try {
      const response = await fetch(`/api/v1/orders/${orderId}/ingredient-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemCode: optimisticReq.itemCode, itemName: optimisticReq.itemName, qty, unit })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Re-fetch to get the true database ID
      const refresh = await fetch("/api/v1/orders?limit=500");
      const refreshData = await refresh.json();
      if (refreshData.success && refreshData.data) setOrders(refreshData.data);
    } catch (e) {
      console.error(e);
      alert("Failed to submit ingredient request.");
      const refresh = await fetch("/api/v1/orders?limit=500");
      const refreshData = await refresh.json();
      if (refreshData.success && refreshData.data) setOrders(refreshData.data);
    }
  };

  const updateIngredientRequestStatus = async (orderId: string, requestId: string, status: 'pending' | 'fulfilled' | 'cancelled' | 'resolved', supplierName?: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updated = (o.ingredientRequests || []).map(r =>
        r.id === requestId ? { ...r, status } : r
      );
      return { ...o, ingredientRequests: updated };
    }));

    try {
      const response = await fetch(`/api/v1/orders/${orderId}/ingredient-requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: status.toUpperCase() })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
    } catch (e) {
      console.error(e);
      const refresh = await fetch("/api/v1/orders?limit=500");
      const refreshData = await refresh.json();
      if (refreshData.success && refreshData.data) setOrders(refreshData.data);
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
        const refresh = await fetch("/api/v1/orders?limit=500");
        const refreshData = await refresh.json();
        if (refreshData.success && refreshData.data) setOrders(refreshData.data);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update order fields");
      // Revert on failure by refetching
      const refresh = await fetch("/api/v1/orders?limit=500");
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
      transitionOrderAction,
      socket
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
