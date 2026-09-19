"use client";

import { useState, useEffect } from "react";
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

  // Local optimistic state for instant UI responsiveness on touch devices
  const [status, setStatus] = useState(currentStatus);
  const [date, setDate] = useState(currentDate);
  const [customDate, setCustomDate] = useState(currentCustomDate);
  const [localSearch, setLocalSearch] = useState(currentSearch);

  // Sync state when URL searchParams change
  useEffect(() => {
    setStatus(searchParams.get("status") || "All");
    setDate(searchParams.get("date") || "all");
    setCustomDate(searchParams.get("customDate") || "");
  }, [searchParams]);

  // Debounce sync of search input to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== currentSearch) {
        updateUrlParams({ search: localSearch, page: "1" });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, currentSearch]);

  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const newUrl = `${pathname}?${params.toString()}`;
    // Push state to browser history for immediate response on mobile
    window.history.pushState({}, "", newUrl);
    // Dispatch popstate so listener components reload
    window.dispatchEvent(new Event("popstate"));
    // Trigger Next.js router navigation
    router.push(newUrl, { scroll: false });
  };

  const handleStatusChange = (newStatus: string) => {
    const s = newStatus === "All" ? "All" : newStatus;
    setStatus(s);
    updateUrlParams({ status: s === "All" ? null : s, page: "1" });
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setCustomDate("");
    updateUrlParams({ date: newDate === "all" ? null : newDate, customDate: null, page: "1" });
  };

  const handleCustomDateChange = (val: string) => {
    setCustomDate(val);
    if (!val) {
      setDate("all");
      updateUrlParams({ date: "all", customDate: null, page: "1" });
      return;
    }
    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    if (val === todayStr) {
      setDate("today");
      updateUrlParams({ date: "today", customDate: null, page: "1" });
    } else if (val === tomorrowStr) {
      setDate("tomorrow");
      updateUrlParams({ date: "tomorrow", customDate: null, page: "1" });
    } else {
      setDate("custom");
      updateUrlParams({ date: "custom", customDate: val, page: "1" });
    }
  };

  return (
    <div className="relative z-30 bg-white/90 backdrop-blur-md pb-3 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 space-y-3 border-b border-black/5 sm:border-none">
      {/* Search Bar - iOS Style */}
      <div className="relative shrink-0">
        <SearchNormal1 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
        <input 
          value={localSearch} 
          onChange={e => setLocalSearch(e.target.value)} 
          type="text"
          placeholder="Search by Order ID, Customer Name, Phone..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/[0.04] text-[15px] font-medium focus:outline-none focus:bg-black/[0.06] transition-colors placeholder:text-muted-foreground/70" 
        />
        {localSearch && (
          <button onClick={() => setLocalSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors p-1">
            <CloseSquare className="w-4 h-4" variant="Bold" />
          </button>
        )}
      </div>

      {/* Status Filters - Smooth Horizontal Scroll */}
      <div className="flex overflow-x-auto gap-2 pb-1 shrink-0 hide-scrollbar snap-x snap-mandatory px-0.5">
        {SALES_FILTERS.map(f => {
          const isActive = status === f || (f === "All" && status === "All");
          return (
            <button 
              key={f} 
              type="button"
              onClick={() => handleStatusChange(f)}
              className={`snap-start px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-200 active:scale-95 touch-manipulation ${
                isActive
                  ? "bg-[#3E2723] text-white shadow-md shadow-[#3E2723]/20 scale-100 ring-1 ring-[#3E2723]"
                  : "bg-black/[0.05] text-muted-foreground hover:bg-black/[0.08] hover:text-foreground"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Calendar Date Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 hide-scrollbar snap-x snap-mandatory px-0.5">
        <button 
          type="button"
          onClick={() => handleDateChange("all")}
          className={`snap-start px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-200 active:scale-95 touch-manipulation ${
            (date === "all" || !date) && !customDate
              ? "bg-[#C5A059] text-[#3E2723] shadow-md shadow-[#C5A059]/30 scale-100 ring-1 ring-[#C5A059]" 
              : "bg-black/[0.05] text-muted-foreground hover:bg-black/[0.08] hover:text-foreground"
          }`}
        >
          All Dates
        </button>

        <button 
          type="button"
          onClick={() => handleDateChange("today")}
          className={`snap-start px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-200 active:scale-95 touch-manipulation ${
            date === "today" && !customDate
              ? "bg-[#C5A059] text-[#3E2723] shadow-md shadow-[#C5A059]/30 scale-100 ring-1 ring-[#C5A059]" 
              : "bg-black/[0.05] text-muted-foreground hover:bg-black/[0.08] hover:text-foreground"
          }`}
        >
          Today
        </button>

        <button 
          type="button"
          onClick={() => handleDateChange("tomorrow")}
          className={`snap-start px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-200 active:scale-95 touch-manipulation ${
            date === "tomorrow" && !customDate
              ? "bg-[#C5A059] text-[#3E2723] shadow-md shadow-[#C5A059]/30 scale-100 ring-1 ring-[#C5A059]" 
              : "bg-black/[0.05] text-muted-foreground hover:bg-black/[0.08] hover:text-foreground"
          }`}
        >
          Tomorrow
        </button>

        {/* Native Label Pick Date element — placed right after Tomorrow */}
        <label 
          className={`flex items-center gap-2 snap-start rounded-full px-3.5 py-2 border shrink-0 cursor-pointer transition-all active:scale-95 touch-manipulation ${
            date === "custom" || customDate
              ? "bg-[#C5A059] text-[#3E2723] border-[#C5A059] shadow-md shadow-[#C5A059]/30 font-bold"
              : "bg-black/[0.05] text-muted-foreground border-black/5 hover:bg-black/[0.08]"
          }`}
        >
          <span className="text-[12px] font-bold whitespace-nowrap uppercase tracking-wider pointer-events-none select-none">📅 Pick Date:</span>
          <input 
            type="date" 
            value={customDate} 
            onChange={(e) => handleCustomDateChange(e.target.value)}
            className="bg-transparent text-[13px] font-bold text-foreground focus:outline-none cursor-pointer"
          />
        </label>

        <button 
          type="button"
          onClick={() => handleDateChange("next3days")}
          className={`snap-start px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-200 active:scale-95 touch-manipulation ${
            date === "next3days" && !customDate
              ? "bg-[#C5A059] text-[#3E2723] shadow-md shadow-[#C5A059]/30 scale-100 ring-1 ring-[#C5A059]" 
              : "bg-black/[0.05] text-muted-foreground hover:bg-black/[0.08] hover:text-foreground"
          }`}
        >
          Next 3 Days
        </button>

        <button 
          type="button"
          onClick={() => handleDateChange("next15days")}
          className={`snap-start px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-200 active:scale-95 touch-manipulation ${
            date === "next15days" && !customDate
              ? "bg-[#C5A059] text-[#3E2723] shadow-md shadow-[#C5A059]/30 scale-100 ring-1 ring-[#C5A059]" 
              : "bg-black/[0.05] text-muted-foreground hover:bg-black/[0.08] hover:text-foreground"
          }`}
        >
          Next 15 Days
        </button>
      </div>
    </div>
  );
}
