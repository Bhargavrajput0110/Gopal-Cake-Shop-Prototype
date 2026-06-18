"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrders, VendorType } from "@/context/OrderContext";
import { motion, AnimatePresence } from "framer-motion";
import { Flower2, Camera, PenTool, CheckCircle2, MapPin, Clock, FileImage, LogOut } from "lucide-react";

export default function VendorDashboard() {
  const router = useRouter();
  const { orders, updateVendorTaskStatus } = useOrders();
  const [selectedVendor, setSelectedVendor] = useState<VendorType>("flower");
  const [isLocked, setIsLocked] = useState(false);
  const [branchFilter, setBranchFilter] = useState("All");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"pending" | "ready">("pending");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    if (type === "flower" || type === "photo" || type === "acrylic") {
      setSelectedVendor(type);
      setIsLocked(true);
    }
  }, []);

  const handleSignOut = () => {
    document.cookie = "gopal_dummy_role=; path=/; max-age=0";
    router.push("/login");
  };

  const branches = ["All", "Khanderao Branch", "Uma Branch", "Varasiya Factory Outlet", "Elora Park Branch"];

  // Filter orders that have tasks matching the selected vendor and status
  const visibleVendorTasks = orders.filter((o) => {
    if (branchFilter !== "All" && o.branch !== branchFilter) return false;
    
    // Check if there is a task for the selected vendor matching the status
    const task = o.vendorTasks?.find(vt => vt.vendorType === selectedVendor && vt.status === taskStatusFilter);
    return !!task;
  });

  // Sort by time (most urgent first)
  const sortedTasks = [...visibleVendorTasks].sort((a, b) => 
    new Date(a.timeTarget).getTime() - new Date(b.timeTarget).getTime()
  );

  return (
    <div className="min-h-screen bg-[#FCF9F2] pb-24 md:pb-12 text-[#3E2723]">
      {/* Top Navigation / Vendor Switcher */}
      <div className="bg-white/80 backdrop-blur-md border-b border-[#C5A059]/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-black flex items-center gap-2">
                {selectedVendor === "flower" ? "Florist Dashboard" : selectedVendor === "photo" ? "Photo Print Dashboard" : "Acrylic Dashboard"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your tasks across all 4 branches.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start max-w-full">
              {/* Vendor Selector (Hidden if locked by login) */}
              {!isLocked && (
                <div className="flex bg-secondary/50 p-1 rounded-lg overflow-x-auto hide-scrollbar max-w-[85vw]">
                  <button 
                    onClick={() => setSelectedVendor("flower")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold transition-colors ${selectedVendor === "flower" ? "bg-white shadow-sm text-rose-600" : "text-muted-foreground hover:bg-white/50"}`}
                  >
                    <Flower2 className="w-4 h-4" /> Florist
                  </button>
                  <button 
                    onClick={() => setSelectedVendor("photo")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold transition-colors ${selectedVendor === "photo" ? "bg-white shadow-sm text-blue-600" : "text-muted-foreground hover:bg-white/50"}`}
                  >
                    <Camera className="w-4 h-4" /> Photo Print
                  </button>
                  <button 
                    onClick={() => setSelectedVendor("acrylic")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold transition-colors ${selectedVendor === "acrylic" ? "bg-white shadow-sm text-amber-600" : "text-muted-foreground hover:bg-white/50"}`}
                  >
                    <PenTool className="w-4 h-4" /> Acrylic
                  </button>
                </div>
              )}

              {/* Sign Out Button */}
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors shadow-sm"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        
        {/* Status Filter */}
        <div className="mb-4 flex bg-secondary/50 p-1 rounded-lg w-fit">
          <button 
            onClick={() => setTaskStatusFilter("pending")}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${taskStatusFilter === "pending" ? "bg-white shadow-sm text-[#3E2723]" : "text-muted-foreground hover:bg-white/50"}`}
          >
            To Do
          </button>
          <button 
            onClick={() => setTaskStatusFilter("ready")}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${taskStatusFilter === "ready" ? "bg-white shadow-sm text-[#3E2723]" : "text-muted-foreground hover:bg-white/50"}`}
          >
            Completed
          </button>
        </div>

        {/* Branch Filter */}
        <div className="mb-6 flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
          {branches.map(b => (
            <button 
              key={b}
              onClick={() => setBranchFilter(b)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                branchFilter === b 
                  ? "bg-[#C5A059] text-white shadow-sm" 
                  : "bg-white border border-[#C5A059]/20 text-muted-foreground hover:border-[#C5A059] hover:text-[#3E2723]"
              }`}
            >
              {b === "All" ? "All Branches" : b.replace(" Branch", "").replace(" Outlet", "")}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {sortedTasks.map(order => {
              const task = order.vendorTasks?.find(vt => vt.vendorType === selectedVendor);
              if (!task) return null;

              return (
                <motion.div 
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-xl border border-[#C5A059]/20 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-black font-serif text-[#3E2723] tracking-wider">{order.id}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-muted-foreground bg-secondary inline-flex px-2 py-0.5 rounded-md">
                          <MapPin className="w-3 h-3 text-[#C5A059]" /> {order.branch}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Deadline</p>
                        <p className="text-sm font-black text-rose-600 flex items-center gap-1 justify-end mt-0.5" suppressHydrationWarning>
                          <Clock className="w-3.5 h-3.5" /> {new Date(order.timeTarget).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#FCF9F2] p-3 rounded-lg border border-[#C5A059]/10 mb-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Instructions</p>
                      <p className="text-sm font-medium text-[#3E2723]">{task.instructions}</p>
                    </div>

                    {/* Ordered Cake Picture (For all vendors) */}
                    {order.cakeImage && (
                      <div className="mb-4">
                         <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><FileImage className="w-3 h-3" /> Ordered Cake</p>
                         <div className="relative h-48 rounded-lg overflow-hidden border border-[#C5A059]/20 group cursor-pointer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={order.cakeImage} alt="Ordered cake picture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white font-bold text-sm backdrop-blur-md px-3 py-1.5 rounded-full bg-white/20">Click to Enlarge</span>
                            </div>
                         </div>
                      </div>
                    )}

                    {/* Photo Reference Display (Only for Photo Vendor) */}
                    {selectedVendor === "photo" && task.referenceImage && (
                      <div className="mb-4">
                         <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><Camera className="w-3 h-3" /> Image to Print</p>
                         <div className="relative h-48 rounded-lg overflow-hidden border border-[#C5A059]/20 group cursor-pointer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={task.referenceImage} alt="Reference to print" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white font-bold text-sm backdrop-blur-md px-3 py-1.5 rounded-full bg-white/20">Click to Enlarge</span>
                            </div>
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 pt-0">
                    {task.status === "pending" ? (
                      <button 
                        onClick={() => updateVendorTaskStatus(order.id, selectedVendor, "ready")}
                        className="w-full bg-[#3E2723] text-white py-3 rounded-lg font-bold text-sm shadow-[0_4px_14px_0_rgba(62,39,35,0.39)] hover:shadow-[0_6px_20px_rgba(62,39,35,0.23)] hover:bg-[#3E2723]/90 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark Item as Ready
                      </button>
                    ) : (
                      <div className="w-full bg-emerald-50 text-emerald-600 border border-emerald-200 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Item is Ready
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {sortedTasks.length === 0 && (
          <div className="text-center py-24 opacity-50 bg-white/50 rounded-2xl border border-dashed border-[#C5A059]/30 mt-6">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
            <h3 className="font-serif text-xl font-bold text-[#3E2723]">{taskStatusFilter === "pending" ? "You are all caught up!" : "No completed tasks yet."}</h3>
            <p className="text-sm font-medium mt-1">No {taskStatusFilter} tasks for the {selectedVendor} vendor right now.</p>
          </div>
        )}

      </div>
    </div>
  );
}
