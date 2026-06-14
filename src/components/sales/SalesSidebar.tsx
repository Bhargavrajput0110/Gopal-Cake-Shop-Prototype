"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ClipboardList,
  ArrowLeftRight,
  Store,
  Bike,
  CreditCard,
  PlusCircle,
  LogOut,
  Activity
} from "lucide-react";

export const navItems = [
  { name: "Command Center", href: "/sales", icon: Activity },
  { name: "Orders", href: "/sales/orders", icon: ClipboardList, badge: 12 },
  { name: "Branch Transfers", href: "/sales/transfers", icon: ArrowLeftRight, badge: 2 },
  { name: "Vendor Dispatch", href: "/sales/vendors", icon: Store },
  { name: "Delivery Assignment", href: "/sales/delivery", icon: Bike },
  { name: "Payments", href: "/sales/payments", icon: CreditCard },
  { name: "Manual / Priority POS", href: "/sales/manual", icon: PlusCircle },
];

export function SalesSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#38251E] text-[#FAFAF8] shadow-2xl flex flex-col hidden md:flex z-50">
      <div className="h-16 flex items-center px-6 shrink-0 relative overflow-hidden">
        {/* Subtle gold glow behind logo */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#C8A97E]/20 to-transparent blur-xl"></div>
        <h1 className="text-xl font-black text-[#C8A97E] font-serif tracking-widest relative z-10">GOPAL BAKERY</h1>
      </div>
      <div className="px-6 py-5 bg-black/20 border-b border-[#C8A97E]/10 shrink-0">
        <p className="text-[10px] font-black text-[#C8A97E]/70 uppercase tracking-[0.2em]">Salesperson Desk</p>
        <p className="text-sm font-bold text-[#FAFAF8] mt-1 tracking-wide">Khanderao Branch</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className={`group flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-300 text-sm font-medium ${
                isActive 
                  ? "bg-[#C8A97E] text-[#38251E] shadow-[0_4px_20px_rgba(200,169,126,0.3)]" 
                  : "text-[#FAFAF8]/70 hover:bg-white/5 hover:text-[#C8A97E]"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="tracking-wide">{item.name}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 shadow-sm transition-colors duration-300 ${isActive ? "bg-[#38251E] text-[#C8A97E]" : "bg-[#C8A97E]/20 text-[#C8A97E]"}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#C8A97E]/10 shrink-0">
        <button 
          onClick={() => { document.cookie = 'gopal_dummy_role=; path=/; max-age=0'; window.location.href='/login'; }}
          className="flex items-center gap-3 text-sm font-bold text-[#FAFAF8]/50 hover:text-rose-400 transition-colors w-full px-3 py-2 rounded-lg hover:bg-white/5 uppercase tracking-wider"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
