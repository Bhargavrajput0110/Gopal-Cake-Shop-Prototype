import { SalesSidebar } from "@/components/sales/SalesSidebar";
import { SalesMobileNav } from "@/components/sales/SalesMobileNav";
import { Search, Bell, UserCircle } from "lucide-react";

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#EAE0D5] to-[#C6AC8F] animate-mesh">
      <SalesSidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        
        {/* Premium Glassmorphism Header with Global Search */}
        <header className="sticky top-0 z-30 h-16 border-b border-primary/10 bg-background/95 shadow-sm">
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            
            <SalesMobileNav />

            {/* Global Search */}
            <div className="flex-1 max-w-lg ml-2 md:ml-0">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Global Search... (Try 108922)" 
                  className="w-full bg-card/50 border border-primary/20 text-sm pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-card transition-all placeholder:text-muted-foreground/60 shadow-inner"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">Ctrl</span>
                  <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">K</span>
                </div>
              </div>
            </div>

            {/* Topbar Actions */}
            <div className="flex items-center gap-4 ml-4">
              <button className="relative p-2 rounded-full hover:bg-primary/10 transition-colors text-primary">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background"></span>
              </button>
              <div className="h-8 w-px bg-primary/20"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-foreground">Sneha D.</p>
                  <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Khanderao Branch</p>
                </div>
                <button className="text-primary hover:text-primary/80 transition-colors">
                  <UserCircle className="w-8 h-8" />
                </button>
              </div>
            </div>

          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
