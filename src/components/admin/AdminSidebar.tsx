"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Store, 
  Settings,
  LogOut,
  BadgeIndianRupee,
  FileBarChart2,
  UtensilsCrossed
} from "lucide-react";

const navItems = [
  { name: "Command Centre", href: "/admin", icon: LayoutDashboard },
  { name: "All Orders", href: "/admin/orders", icon: ShoppingBag, badge: 3 },
  { name: "Staff & Roles", href: "/admin/staff", icon: Users },
  { name: "Branches", href: "/admin/branches", icon: Store },
  { name: "Menu / Products", href: "/admin/menu", icon: UtensilsCrossed },
  { name: "Reports", href: "/admin/reports", icon: FileBarChart2 },
  { name: "Finances", href: "/admin/finances", icon: BadgeIndianRupee },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col hidden md:flex z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-black text-sm">G</span>
        </div>
        <div>
          <h1 className="text-sm font-black text-foreground tracking-tight leading-none">Gopal Cake Shop</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 mt-1">Management</p>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                {item.name}
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-black text-xs">G</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-foreground truncate">Gopal Bhai</p>
            <p className="text-[10px] text-muted-foreground font-medium">Owner · Admin</p>
          </div>
        </div>
        <button 
          onClick={() => { document.cookie = 'gopal_dummy_role=; path=/; max-age=0'; window.location.href='/login'; }}
          className="flex items-center gap-3 text-sm font-semibold text-muted-foreground hover:text-destructive transition-colors w-full px-3 py-2 rounded-xl hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
