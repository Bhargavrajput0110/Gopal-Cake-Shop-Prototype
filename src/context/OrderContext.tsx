"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type OrderStatus = 
  | "new" 
  | "accepted_by_chef" 
  | "preparing" 
  | "decorating" 
  | "ready_for_pickup" 
  | "pending_assignment" 
  | "assigned_to_driver" 
  | "picked_up_by_driver" 
  | "on_the_way" 
  | "delivered" 
  | "failed"
  | "cancelled";

export type Order = {
  id: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  branch: string;
  items: { name: string; qty: number; notes?: string }[];
  totalAmount: number;
  advancePaid: number;
  pendingBalance: number;
  isPriority: boolean;
  isSurprise: boolean;
  vip: boolean;
  timeTarget: string; // ISO String for exact time diff calculations
  createdAt: string;
  productionStartTime?: string; // Tracks exactly when the chef clicked "Start Baking"
  delayLevel?: "none" | "warning" | "delayed";
  assignedChef?: string; // e.g., "CHEF-101"
};

// Generate 10 Fake Orders with varying times
const now = Date.now();
const INITIAL_ORDERS: Order[] = [
  {
    id: "101001", status: "accepted_by_chef", customerName: "Aarav Patel", customerPhone: "+91 9999911111", deliveryAddress: "Store Pickup", branch: "Khanderao Market Branch",
    items: [{ name: "Pineapple Pastry", qty: 4 }], totalAmount: 400, advancePaid: 400, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 15 * 60000).toISOString(), createdAt: new Date(now - 30 * 60000).toISOString(), delayLevel: "none"
  },
  {
    id: "101002", status: "accepted_by_chef", customerName: "Priya Shah", customerPhone: "+91 9999922222", deliveryAddress: "12 MG Road", branch: "Khanderao Market Branch",
    items: [{ name: "Chocolate Truffle Cake (1kg)", qty: 1, notes: "Eggless. Happy Birthday Mom" }], totalAmount: 1200, advancePaid: 500, pendingBalance: 700,
    isPriority: true, isSurprise: true, vip: false, timeTarget: new Date(now + 45 * 60000).toISOString(), createdAt: new Date(now - 60 * 60000).toISOString(), delayLevel: "none"
  },
  {
    id: "101003", status: "preparing", customerName: "Rahul Desai", customerPhone: "+91 9999933333", deliveryAddress: "Store Pickup", branch: "Khanderao Market Branch",
    items: [{ name: "Red Velvet Anniversary Cake", qty: 1, notes: "Heart shape. Photo Cake." }], totalAmount: 1800, advancePaid: 1800, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 90 * 60000).toISOString(), createdAt: new Date(now - 120 * 60000).toISOString(), delayLevel: "none",
    assignedChef: "CHEF-101", productionStartTime: new Date(now - 15 * 60000).toISOString()
  },
  {
    id: "101004", status: "accepted_by_chef", customerName: "Sneha Joshi", customerPhone: "+91 9999944444", deliveryAddress: "44 Ring Road", branch: "Khanderao Market Branch",
    items: [{ name: "Black Forest Cake (500g)", qty: 1 }], totalAmount: 600, advancePaid: 600, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 120 * 60000).toISOString(), createdAt: new Date(now - 10 * 60000).toISOString(), delayLevel: "none"
  },
  {
    id: "101005", status: "accepted_by_chef", customerName: "VIP Client Demo", customerPhone: "+91 9999955555", deliveryAddress: "123 Premium Villa", branch: "Khanderao Market Branch",
    items: [{ name: "3-Tier Wedding Cake", qty: 1, notes: "Pure Veg. Requires Acrylic Topper" }], totalAmount: 4500, advancePaid: 2000, pendingBalance: 2500,
    isPriority: true, isSurprise: true, vip: true, timeTarget: new Date(now + 240 * 60000).toISOString(), createdAt: new Date(now - 200 * 60000).toISOString(), delayLevel: "warning"
  },
  {
    id: "101006", status: "decorating", customerName: "Amit Kumar", customerPhone: "+91 9999966666", deliveryAddress: "Store Pickup", branch: "Khanderao Market Branch",
    items: [{ name: "Mango Cheesecake", qty: 1 }], totalAmount: 1500, advancePaid: 1500, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 30 * 60000).toISOString(), createdAt: new Date(now - 240 * 60000).toISOString(), delayLevel: "delayed",
    assignedChef: "CHEF-101", productionStartTime: new Date(now - 60 * 60000).toISOString()
  },
  {
    id: "101007", status: "accepted_by_chef", customerName: "Neha Gupta", customerPhone: "+91 9999977777", deliveryAddress: "Store Pickup", branch: "Khanderao Market Branch",
    items: [{ name: "Butterscotch Cake", qty: 2 }], totalAmount: 1000, advancePaid: 0, pendingBalance: 1000,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 180 * 60000).toISOString(), createdAt: new Date().toISOString(), delayLevel: "none"
  },
  {
    id: "101008", status: "ready_for_pickup", customerName: "Vikram Singh", customerPhone: "+91 9999988888", deliveryAddress: "88 Station Road", branch: "Khanderao Market Branch",
    items: [{ name: "Custom Fondant Cake", qty: 1 }], totalAmount: 2500, advancePaid: 2500, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now - 10 * 60000).toISOString(), createdAt: new Date(now - 300 * 60000).toISOString(), delayLevel: "none"
  },
  {
    id: "101009", status: "accepted_by_chef", customerName: "Meera Reddy", customerPhone: "+91 9999999999", deliveryAddress: "Store Pickup", branch: "Khanderao Market Branch",
    items: [{ name: "Fruit Tart", qty: 6 }], totalAmount: 900, advancePaid: 900, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 300 * 60000).toISOString(), createdAt: new Date().toISOString(), delayLevel: "none"
  },
  {
    id: "101010", status: "accepted_by_chef", customerName: "Rohan Mehta", customerPhone: "+91 9999900000", deliveryAddress: "55 Park Street", branch: "Khanderao Market Branch",
    items: [{ name: "Vanilla Cupcakes", qty: 12 }], totalAmount: 600, advancePaid: 0, pendingBalance: 600,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 360 * 60000).toISOString(), createdAt: new Date().toISOString(), delayLevel: "none"
  },
  {
    id: "102001", status: "pending_assignment", customerName: "Rajesh Sharma", customerPhone: "+91 9876543210", deliveryAddress: "401 Galaxy Apartments, Ring Road", branch: "Khanderao Market Branch",
    items: [{ name: "Dutch Truffle Cake (1kg)", qty: 1 }], totalAmount: 1100, advancePaid: 0, pendingBalance: 1100,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 10 * 60000).toISOString(), createdAt: new Date(now - 120 * 60000).toISOString(), delayLevel: "none"
  },
  {
    id: "102002", status: "pending_assignment", customerName: "Ananya Patel", customerPhone: "+91 9876543211", deliveryAddress: "B-12, Green Park Society, VVIP Road", branch: "Khanderao Market Branch",
    items: [{ name: "Red Velvet Heart Cake", qty: 1, notes: "Anniversary Surprise!" }], totalAmount: 1800, advancePaid: 1000, pendingBalance: 800,
    isPriority: true, isSurprise: true, vip: false, timeTarget: new Date(now + 25 * 60000).toISOString(), createdAt: new Date(now - 90 * 60000).toISOString(), delayLevel: "warning"
  },
  {
    id: "102003", status: "pending_assignment", customerName: "Sunil Verma", customerPhone: "+91 9876543212", deliveryAddress: "Office 303, Tech Park, IT Road", branch: "Khanderao Market Branch",
    items: [{ name: "Assorted Pastries Box", qty: 3 }], totalAmount: 900, advancePaid: 900, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 45 * 60000).toISOString(), createdAt: new Date(now - 60 * 60000).toISOString(), delayLevel: "none"
  },
  {
    id: "102004", status: "pending_assignment", customerName: "Kavita Singh", customerPhone: "+91 9876543213", deliveryAddress: "Villa 9, Palm Groves", branch: "Khanderao Market Branch",
    items: [{ name: "Custom Spiderman Theme Cake (2kg)", qty: 1 }], totalAmount: 3200, advancePaid: 1000, pendingBalance: 2200,
    isPriority: false, isSurprise: false, vip: true, timeTarget: new Date(now + 60 * 60000).toISOString(), createdAt: new Date(now - 300 * 60000).toISOString(), delayLevel: "none"
  },
  {
    id: "102005", status: "pending_assignment", customerName: "Deepak Joshi", customerPhone: "+91 9876543214", deliveryAddress: "Hostel Block A, Univ Campus", branch: "Khanderao Market Branch",
    items: [{ name: "Choco Lava Cakes", qty: 6 }], totalAmount: 720, advancePaid: 0, pendingBalance: 720,
    isPriority: true, isSurprise: false, vip: false, timeTarget: new Date(now + 5 * 60000).toISOString(), createdAt: new Date(now - 45 * 60000).toISOString(), delayLevel: "delayed"
  },
  {
    id: "102006", status: "pending_assignment", customerName: "Nisha Reddy", customerPhone: "+91 9876543215", deliveryAddress: "77 Sunset Boulevard", branch: "Khanderao Market Branch",
    items: [{ name: "Strawberry Shortcake", qty: 1 }], totalAmount: 850, advancePaid: 850, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 90 * 60000).toISOString(), createdAt: new Date(now - 120 * 60000).toISOString(), delayLevel: "none"
  }
];

type OrderContextType = {
  orders: Order[];
  updateOrderStatus: (id: string, status: OrderStatus, updateProductionTime?: boolean, assignedChef?: string) => void;
  reportIssue: (id: string, issueType: string, severity: "normal" | "urgent", notes: string) => void;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Generate initial orders on the client side only to prevent SSR Hydration Mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrders(INITIAL_ORDERS);
  }, []);

  const updateOrderStatus = (id: string, status: OrderStatus, updateProductionTime?: boolean, assignedChef?: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === id) {
          const updates: Partial<Order> = { status };
          if (updateProductionTime && status === "preparing" && !order.productionStartTime) {
            updates.productionStartTime = new Date().toISOString();
          }
          if (assignedChef) {
            updates.assignedChef = assignedChef;
          }
          return { ...order, ...updates };
        }
        return order;
      })
    );
  };

  const reportIssue = (id: string, issueType: string, severity: "normal" | "urgent", notes: string) => {
    console.log(`Issue Reported [${severity.toUpperCase()}] for ${id}: ${issueType} - ${notes}`);
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        if (severity === "urgent") return { ...o, delayLevel: "delayed" };
        return { ...o, delayLevel: "warning" };
      }
      return o;
    }));
  };

  return (
    <OrderContext.Provider value={{ orders, updateOrderStatus, reportIssue }}>
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
