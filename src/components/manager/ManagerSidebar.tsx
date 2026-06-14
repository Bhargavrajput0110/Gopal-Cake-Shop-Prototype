"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ChefHat, 
  PackageCheck, 
  Bike,
  LogOut
} from "lucide-react";

const navItems = [
  { name: "Branch Dashboard", href: "/manager", icon: LayoutDashboard },
  { name: "Kitchen Queue", href: "/manager/kitchen", icon: ChefHat, badge: 5 },
  { name: "Local Inventory", href: "/manager/inventory", icon: PackageCheck },
  { name: "Delivery Boys", href: "/manager/riders", icon: Bike },
];

export function ManagerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col hidden md:flex">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="text-xl font-black text-primary font-serif tracking-tight">Gopal Bakery</h1>
      </div>
      <div className="px-6 py-4 bg-secondary/30 border-b border-border">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch Manager</p>
        <p className="text-sm font-medium text-foreground mt-1">Khanderao Market</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/manager" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                {item.name}
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white text-primary" : "bg-primary text-primary-foreground"}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-border">
        <button 
          onClick={() => { document.cookie = 'gopal_dummy_role=; path=/; max-age=0'; window.location.href='/login'; }}
          className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors w-full px-3 py-2 rounded-lg hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
