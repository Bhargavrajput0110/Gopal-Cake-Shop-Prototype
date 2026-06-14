"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, ListOrdered, User } from "lucide-react";

export function DeliveryBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-card border-t border-border pb-safe flex items-center justify-around z-50">
      <Link href="/delivery" className={`flex flex-col items-center p-3 w-20 transition-colors ${pathname === "/delivery" ? "text-primary" : "text-muted-foreground"}`}>
        <ListOrdered className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Orders</span>
      </Link>
      
      <Link href="/delivery/map" className={`flex flex-col items-center p-3 w-20 transition-colors ${pathname === "/delivery/map" ? "text-primary" : "text-muted-foreground"}`}>
        <Map className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Map</span>
      </Link>
      
      <Link href="/delivery/profile" className={`flex flex-col items-center p-3 w-20 transition-colors ${pathname === "/delivery/profile" ? "text-primary" : "text-muted-foreground"}`}>
        <User className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Profile</span>
      </Link>
    </nav>
  );
}
