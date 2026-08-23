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
    <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl pb-3 pt-3 -mx-4 px-4 sm:mx-0 sm:px-0 space-y-4 border-b border-black/5 sm:border-none">
      {/* Search Bar - iOS Style */}
      <div className="relative shrink-0">
        <SearchNormal1 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
        <input 
          value={localSearch} 
          onChange={e => setLocalSearch(e.target.value)} 
          type="text"
          placeholder="Search by Order ID, Customer Name, Phone..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/[0.04] text-[15px] font-medium focus:outline-none focus:bg-black/[0.06] transition-colors placeholder:text-muted-foreground/70" 
        />
        {localSearch && (
          <button onClick={() => setLocalSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors">
            <CloseSquare className="w-4 h-4" variant="Bold" />
          </button>
        )}
      </div>

      {/* Status Filters - Smooth Horizontal Scroll */}
      <div className="flex overflow-x-auto gap-2 pb-1 shrink-0 hide-scrollbar snap-x snap-mandatory px-0.5">
        {SALES_FILTERS.map(f => {
          const isActive = (currentStatus === f || (f === "All" && currentStatus === "All"));
          return (
            <button 
              key={f} 
              onClick={() => updateUrlParams({ status: f === "All" ? null : f, page: "1" })}
              className={`snap-start px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? "bg-[#3E2723] text-white shadow-md shadow-[#3E2723]/20 scale-100"
                  : "bg-black/[0.04] text-muted-foreground hover:bg-black/[0.08] hover:text-foreground scale-95 hover:scale-100"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Calendar Date Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 hide-scrollbar snap-x snap-mandatory px-0.5">
        {DATE_FILTERS.map(df => {
          const isActive = (currentDate === df.id || (df.id === "all" && currentDate === "all"));
          return (
            <button 
              key={df.id}
              onClick={() => updateUrlParams({ date: df.id === "all" ? null : df.id, customDate: null, page: "1" })}
              className={`snap-start px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? "bg-[#C5A059] text-[#3E2723] shadow-md shadow-[#C5A059]/30 scale-100" 
                  : "bg-black/[0.04] text-muted-foreground hover:bg-black/[0.08] hover:text-foreground scale-95 hover:scale-100"
              }`}
            >
              {df.label}
            </button>
          );
        })}
        
        <div className="flex items-center gap-2 ml-auto snap-start bg-black/[0.04] rounded-full px-3 py-1.5 border border-black/5">
          <span className="text-[11px] text-muted-foreground font-bold whitespace-nowrap uppercase tracking-wider">Pick Date:</span>
          <input 
            type="date" 
            value={currentCustomDate} 
            onChange={(e) => handleCustomDateChange(e.target.value)}
            className="bg-transparent text-[13px] font-bold text-foreground focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
