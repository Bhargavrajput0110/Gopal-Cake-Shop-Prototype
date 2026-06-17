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

export type VendorType = "flower" | "photo" | "acrylic";
export type VendorTask = {
  vendorType: VendorType;
  status: "pending" | "ready";
  instructions: string;
  referenceImage?: string;
};

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
  vendorTasks?: VendorTask[];
};

// Generate Fake Orders with new branch ID format
const now = Date.now();
const INITIAL_ORDERS: Order[] = [
  {
    id: "KHM-10201", status: "accepted_by_chef", customerName: "Aarav Patel", customerPhone: "+91 9999911111", deliveryAddress: "Store Pickup", branch: "Khanderao Branch",
    items: [{ name: "Pineapple Pastry", qty: 4 }], totalAmount: 400, advancePaid: 400, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 15 * 60000).toISOString(), createdAt: new Date(now - 30 * 60000).toISOString(), delayLevel: "none"
  },
  {
    id: "KHM-10202", status: "accepted_by_chef", customerName: "Priya Shah", customerPhone: "+91 9999922222", deliveryAddress: "12 MG Road", branch: "Khanderao Branch",
    items: [{ name: "Chocolate Truffle Cake (1kg)", qty: 1, notes: "Eggless. Happy Birthday Mom" }], totalAmount: 1200, advancePaid: 500, pendingBalance: 700,
    isPriority: true, isSurprise: true, vip: false, timeTarget: new Date(now + 45 * 60000).toISOString(), createdAt: new Date(now - 60 * 60000).toISOString(), delayLevel: "none",
    vendorTasks: [{ vendorType: "flower", status: "pending", instructions: "Requires a bouquet of 12 red roses attached to delivery." }]
  },
  {
    id: "UMA-10203", status: "preparing", customerName: "Rahul Desai", customerPhone: "+91 9999933333", deliveryAddress: "Store Pickup", branch: "Uma Branch",
    items: [{ name: "Red Velvet Anniversary Cake", qty: 1, notes: "Heart shape. Photo Cake." }], totalAmount: 1800, advancePaid: 1800, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 90 * 60000).toISOString(), createdAt: new Date(now - 120 * 60000).toISOString(), delayLevel: "none",
    assignedChef: "CHEF-101", productionStartTime: new Date(now - 15 * 60000).toISOString(),
    vendorTasks: [{ vendorType: "photo", status: "pending", instructions: "Print anniversary photo on A4 sugar sheet. Keep colors vibrant.", referenceImage: "https://images.unsplash.com/photo-1518199266791-5375a8316d4d?auto=format&fit=crop&q=80&w=300&h=300" }]
  },
  {
    id: "WAS-10204", status: "accepted_by_chef", customerName: "Sneha Joshi", customerPhone: "+91 9999944444", deliveryAddress: "44 Ring Road", branch: "Varasiya Factory Outlet",
    items: [{ name: "Black Forest Cake (500g)", qty: 1 }], totalAmount: 600, advancePaid: 600, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 120 * 60000).toISOString(), createdAt: new Date(now - 10 * 60000).toISOString(), delayLevel: "none"
  },
  {
    id: "ELR-10205", status: "accepted_by_chef", customerName: "VIP Client Demo", customerPhone: "+91 9999955555", deliveryAddress: "123 Premium Villa", branch: "Elora Park Branch",
    items: [{ name: "3-Tier Wedding Cake", qty: 1, notes: "Pure Veg. Requires Acrylic Topper" }], totalAmount: 4500, advancePaid: 2000, pendingBalance: 2500,
    isPriority: true, isSurprise: true, vip: true, timeTarget: new Date(now + 240 * 60000).toISOString(), createdAt: new Date(now - 200 * 60000).toISOString(), delayLevel: "warning",
    vendorTasks: [
      { vendorType: "acrylic", status: "pending", instructions: "Gold mirror acrylic topper reading 'Mr & Mrs Sharma'." },
      { vendorType: "flower", status: "pending", instructions: "Fresh white lilies for the 3-tier cake arrangement." }
    ]
  },
  {
    id: "KHM-10206", status: "decorating", customerName: "Amit Kumar", customerPhone: "+91 9999966666", deliveryAddress: "Store Pickup", branch: "Khanderao Branch",
    items: [{ name: "Mango Cheesecake", qty: 1 }], totalAmount: 1500, advancePaid: 1500, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 30 * 60000).toISOString(), createdAt: new Date(now - 240 * 60000).toISOString(), delayLevel: "delayed",
    assignedChef: "CHEF-101", productionStartTime: new Date(now - 60 * 60000).toISOString()
  },
  {
    id: "UMA-10207", status: "accepted_by_chef", customerName: "Neha Gupta", customerPhone: "+91 9999977777", deliveryAddress: "Store Pickup", branch: "Uma Branch",
    items: [{ name: "Butterscotch Cake", qty: 2 }], totalAmount: 1000, advancePaid: 0, pendingBalance: 1000,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 180 * 60000).toISOString(), createdAt: new Date().toISOString(), delayLevel: "none"
  },
  {
    id: "WAS-10208", status: "ready_for_pickup", customerName: "Vikram Singh", customerPhone: "+91 9999988888", deliveryAddress: "88 Station Road", branch: "Varasiya Factory Outlet",
    items: [{ name: "Custom Fondant Cake", qty: 1 }], totalAmount: 2500, advancePaid: 2500, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now - 10 * 60000).toISOString(), createdAt: new Date(now - 300 * 60000).toISOString(), delayLevel: "none",
    vendorTasks: [{ vendorType: "photo", status: "ready", instructions: "Printed photo sheet for fondant.", referenceImage: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=300&h=300" }]
  },
  {
    id: "ELR-10209", status: "accepted_by_chef", customerName: "Meera Reddy", customerPhone: "+91 9999999999", deliveryAddress: "Store Pickup", branch: "Elora Park Branch",
    items: [{ name: "Fruit Tart", qty: 6 }], totalAmount: 900, advancePaid: 900, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 300 * 60000).toISOString(), createdAt: new Date().toISOString(), delayLevel: "none"
  },
  {
    id: "KHM-10210", status: "new", customerName: "Rohan Mehta", customerPhone: "+91 9999900000", deliveryAddress: "55 Park Street", branch: "Khanderao Branch",
    items: [{ name: "Vanilla Cupcakes", qty: 12 }], totalAmount: 600, advancePaid: 0, pendingBalance: 600,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 360 * 60000).toISOString(), createdAt: new Date().toISOString(), delayLevel: "none"
  },
  {
    id: "UMA-10211", status: "pending_assignment", customerName: "Rajesh Sharma", customerPhone: "+91 9876543210", deliveryAddress: "401 Galaxy Apartments, Ring Road", branch: "Uma Branch",
    items: [{ name: "Dutch Truffle Cake (1kg)", qty: 1 }], totalAmount: 1100, advancePaid: 0, pendingBalance: 1100,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 10 * 60000).toISOString(), createdAt: new Date(now - 120 * 60000).toISOString(), delayLevel: "none"
  },
  {
    id: "WAS-10212", status: "pending_assignment", customerName: "Ananya Patel", customerPhone: "+91 9876543211", deliveryAddress: "B-12, Green Park Society, VVIP Road", branch: "Varasiya Factory Outlet",
    items: [{ name: "Red Velvet Heart Cake", qty: 1, notes: "Anniversary Surprise!" }], totalAmount: 1800, advancePaid: 1000, pendingBalance: 800,
    isPriority: true, isSurprise: true, vip: false, timeTarget: new Date(now + 25 * 60000).toISOString(), createdAt: new Date(now - 90 * 60000).toISOString(), delayLevel: "warning"
  },
  {
    id: "ELR-10213", status: "pending_assignment", customerName: "Sunil Verma", customerPhone: "+91 9876543212", deliveryAddress: "Office 303, Tech Park, IT Road", branch: "Elora Park Branch",
    items: [{ name: "Assorted Pastries Box", qty: 3 }], totalAmount: 900, advancePaid: 900, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 45 * 60000).toISOString(), createdAt: new Date(now - 60 * 60000).toISOString(), delayLevel: "none"
  },
  {
    id: "KHM-10214", status: "pending_assignment", customerName: "Kavita Singh", customerPhone: "+91 9876543213", deliveryAddress: "Villa 9, Palm Groves", branch: "Khanderao Branch",
    items: [{ name: "Custom Spiderman Theme Cake (2kg)", qty: 1 }], totalAmount: 3200, advancePaid: 1000, pendingBalance: 2200,
    isPriority: false, isSurprise: false, vip: true, timeTarget: new Date(now + 60 * 60000).toISOString(), createdAt: new Date(now - 300 * 60000).toISOString(), delayLevel: "none",
    vendorTasks: [{ vendorType: "acrylic", status: "pending", instructions: "Spiderman shaped acrylic cutout piece." }]
  },
  {
    id: "UMA-10215", status: "pending_assignment", customerName: "Deepak Joshi", customerPhone: "+91 9876543214", deliveryAddress: "Hostel Block A, Univ Campus", branch: "Uma Branch",
    items: [{ name: "Choco Lava Cakes", qty: 6 }], totalAmount: 720, advancePaid: 0, pendingBalance: 720,
    isPriority: true, isSurprise: false, vip: false, timeTarget: new Date(now + 5 * 60000).toISOString(), createdAt: new Date(now - 45 * 60000).toISOString(), delayLevel: "delayed"
  },
  {
    id: "WAS-10216", status: "pending_assignment", customerName: "Nisha Reddy", customerPhone: "+91 9876543215", deliveryAddress: "77 Sunset Boulevard", branch: "Varasiya Factory Outlet",
    items: [{ name: "Strawberry Shortcake", qty: 1 }], totalAmount: 850, advancePaid: 850, pendingBalance: 0,
    isPriority: false, isSurprise: false, vip: false, timeTarget: new Date(now + 90 * 60000).toISOString(), createdAt: new Date(now - 120 * 60000).toISOString(), delayLevel: "none"
  }
];

type OrderContextType = {
  orders: Order[];
  updateOrderStatus: (id: string, status: OrderStatus, updateProductionTime?: boolean, assignedChef?: string) => void;
  updateVendorTaskStatus: (orderId: string, vendorType: VendorType, status: "pending" | "ready") => void;
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

  const updateVendorTaskStatus = (orderId: string, vendorType: VendorType, status: "pending" | "ready") => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId && order.vendorTasks) {
          const updatedTasks = order.vendorTasks.map(vt => 
            vt.vendorType === vendorType ? { ...vt, status } : vt
          );
          return { ...order, vendorTasks: updatedTasks };
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
    <OrderContext.Provider value={{ orders, updateOrderStatus, updateVendorTaskStatus, reportIssue }}>
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
