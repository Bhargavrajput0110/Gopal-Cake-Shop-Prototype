"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SearchNormal1, CloseSquare } from "iconsax-react";

export const SALES_FILTERS = ["All", "Pending Verification", "Due Soon", "Issues", "Waiting for Chef", "In Kitchen", "Ready", "Delivery"];
export const DATE_FILTERS = [
  { id: "all", label: "All Dates" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "next3days", label: "Next 3 Days" },
  { id: "next15days", label: "Next 15 Days" },
];

export function SalesFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read current state from URL
  const currentStatus = searchParams.get("status") || "All";
  const currentSearch = searchParams.get("search") || "";
  const currentDate = searchParams.get("date") || "all";
  const currentCustomDate = searchParams.get("customDate") || "";

  // Local state for search input to allow typing immediately
  const [localSearch, setLocalSearch] = useState(currentSearch);

  // Debounce sync of search input to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== currentSearch) {
        updateUrlParams({ search: localSearch, page: "1" });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, currentSearch]);

  const updateUrlParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const handleCustomDateChange = (val: string) => {
    if (!val) {
      updateUrlParams({ date: "all", customDate: null, page: "1" });
      return;
    }
    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    if (val === todayStr) {
      updateUrlParams({ date: "today", customDate: null, page: "1" });
    } else if (val === tomorrowStr) {
      updateUrlParams({ date: "tomorrow", customDate: null, page: "1" });
    } else {
      updateUrlParams({ date: "custom", customDate: val, page: "1" });
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-[var(--background)]/90 backdrop-blur-md pb-2 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:shadow-none border-b border-border/50 sm:border-none rounded-b-2xl sm:rounded-none">
      {/* Search */}
      <div className="relative shrink-0">
        <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          value={localSearch} 
          onChange={e => setLocalSearch(e.target.value)} 
          type="text"
          placeholder="Search by Order ID, Customer Name, Phone, or Cake..."
          className="w-full pl-9 pr-4 py-3 sm:py-2.5 rounded-xl border border-[#C5A059]/30 bg-white/80 backdrop-blur-md text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 shadow-sm" 
        />
        {localSearch && <button onClick={() => setLocalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><CloseSquare className="w-4 h-4" /></button>}
      </div>

      {/* Status Filters */}
      <div className="flex overflow-x-auto gap-2 pb-2 shrink-0 hide-scrollbar">
        {SALES_FILTERS.map(f => (
          <button 
            key={f} 
            onClick={() => updateUrlParams({ status: f === "All" ? null : f, page: "1" })}
            className={`px-4 py-2 sm:py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              (currentStatus === f || (f === "All" && currentStatus === "All")) 
                ? "bg-[#C5A059] text-[#3E2723] shadow-sm"
                : "bg-secondary text-muted-foreground hover:bg-[#C5A059]/20 hover:text-[#3E2723]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Calendar Date Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0 hide-scrollbar">
        {DATE_FILTERS.map(df => (
          <button 
            key={df.id}
            onClick={() => updateUrlParams({ date: df.id === "all" ? null : df.id, customDate: null, page: "1" })}
            className={`px-3.5 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all ${
              (currentDate === df.id || (df.id === "all" && currentDate === "all"))
                ? "bg-[#3E2723] text-white" 
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {df.label}
          </button>
        ))}
        
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] sm:text-xs text-muted-foreground font-bold whitespace-nowrap">Pick Date:</span>
          <input 
            type="date" 
            value={currentCustomDate} 
            onChange={(e) => handleCustomDateChange(e.target.value)}
            className="p-1.5 sm:p-1 rounded-lg border border-border text-xs bg-white text-foreground focus:ring-2 focus:ring-[#C5A059]/50"
          />
        </div>
      </div>
    </div>
  );
}
