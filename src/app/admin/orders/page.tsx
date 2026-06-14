"use client";

import { useState } from "react";
import { Search, Filter, MoreHorizontal, Clock, MapPin, Phone } from "lucide-react";

type OrderStatus = "New" | "Baking" | "Ready" | "Out for Delivery" | "Delivered";

const MOCK_ORDERS = [
  { id: "108921", customer: "Rahul Sharma", phone: "+91 98765 43210", address: "38, Amrutnagar, Manjalpur", items: "Pineapple Cake (1kg)", amount: "₹450", status: "Baking", time: "10:30 AM", branch: "Khanderao Market" },
  { id: "108920", customer: "Priya Patel", phone: "+91 91234 56789", address: "A-12, Surya Flats, Gotri", items: "Truffle Cake + Cupcakes", amount: "₹850", status: "Out for Delivery", time: "09:45 AM", branch: "Ellora Park" },
  { id: "108919", customer: "Amit Shah", phone: "+91 99887 76655", address: "Pickup (Store)", items: "Black Forest (500g)", amount: "₹350", status: "Delivered", time: "09:00 AM", branch: "Uma Char Rasta" },
  { id: "108918", customer: "Neha Desai", phone: "+91 94567 12345", address: "7, Green Park, Akota", items: "Custom Photo Cake", amount: "₹1200", status: "New", time: "11:15 AM", branch: "Factory Warashiya" },
  { id: "108917", customer: "Vikram Singh", phone: "+91 93322 11445", address: "402, Shivam Heights", items: "Red Velvet Jar x3", amount: "₹450", status: "New", time: "11:30 AM", branch: "Khanderao Market" },
  { id: "108916", customer: "Sneha Rao", phone: "+91 97788 55441", address: "Pickup (Store)", items: "Chocolate Truffle (1kg)", amount: "₹750", status: "Ready", time: "11:45 AM", branch: "Ellora Park" },
];

const STATUS_COLORS = {
  "New": "bg-primary/20 text-primary border-primary/30",
  "Baking": "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-500 dark:border-amber-500/30",
  "Ready": "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-500 dark:border-purple-500/30",
  "Out for Delivery": "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-500 dark:border-blue-500/30",
  "Delivered": "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-500 dark:border-emerald-500/30",
};

export default function LiveOrdersPage() {
  const [activeTab, setActiveTab] = useState<"List" | "Board">("Board");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filteredOrders = MOCK_ORDERS.filter(o => statusFilter === "All" || o.status === statusFilter);

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Orders</h2>
          <p className="text-muted-foreground text-sm">Manage and track orders across all branches in real-time.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search ID, Name..." 
              className="pl-9 pr-4 py-2 rounded-lg border border-input bg-card focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          
          <button className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>

          <div className="flex bg-secondary p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab("Board")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "Board" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Board
            </button>
            <button 
              onClick={() => setActiveTab("List")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "List" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "Board" ? (
          <div className="h-full flex gap-4 overflow-x-auto pb-4">
            {["New", "Baking", "Ready", "Out for Delivery"].map((columnStatus) => (
              <div key={columnStatus} className="flex-none w-80 bg-secondary/30 rounded-xl border border-border/50 flex flex-col h-full">
                <div className="p-4 border-b border-border/50 shrink-0 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {columnStatus}
                    <span className="bg-background text-muted-foreground text-xs px-2 py-0.5 rounded-full font-bold border border-border">
                      {MOCK_ORDERS.filter(o => o.status === columnStatus).length}
                    </span>
                  </h3>
                  <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {MOCK_ORDERS.filter(o => o.status === columnStatus).map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-sm h-full overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-4 font-medium">Order ID & Time</th>
                    <th className="px-4 py-4 font-medium">Customer Details</th>
                    <th className="px-4 py-4 font-medium">Items</th>
                    <th className="px-4 py-4 font-medium">Branch</th>
                    <th className="px-4 py-4 font-medium">Status</th>
                    <th className="px-4 py-4 font-medium">Amount</th>
                    <th className="px-4 py-4 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{order.id}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {order.time}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{order.customer}</div>
                        <div className="text-xs text-muted-foreground mt-1">{order.phone}</div>
                      </td>
                      <td className="px-4 py-4 max-w-[200px] truncate">{order.items}</td>
                      <td className="px-4 py-4 text-muted-foreground">{order.branch}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[order.status as OrderStatus]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium">{order.amount}</td>
                      <td className="px-4 py-4 text-right">
                        <button className="text-primary hover:underline font-medium text-sm">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: any }) {
  return (
    <div className="bg-card border border-border p-4 rounded-lg shadow-sm hover:border-primary/30 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between mb-2">
        <span className="font-bold text-foreground text-sm">{order.id}</span>
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {order.time}
        </span>
      </div>
      
      <p className="text-sm font-medium text-foreground truncate">{order.items}</p>
      
      <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/70" />
          <span className="line-clamp-2">{order.address}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Store className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{order.branch}</span>
          </div>
          <span className="font-bold text-sm text-foreground">{order.amount}</span>
        </div>
      </div>
    </div>
  );
}

// Temporary Store Icon Component
function Store(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
    </svg>
  );
}
