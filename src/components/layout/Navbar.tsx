"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, User, Home, LayoutGrid, Cake } from "lucide-react";
import { PremiumMenu } from "./PremiumMenu";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Desktop & Top Mobile Header */}
      <header className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled 
          ? "bg-background/95 border-b border-border/40 py-2" 
          : "bg-transparent border-transparent py-6"
      }`}>
        <div className="container mx-auto flex h-14 md:h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <span className={`font-heading text-xl md:text-2xl font-bold tracking-tight transition-colors duration-500 ${scrolled ? "text-primary" : "text-white"}`}>
                Gopal Cake Shop
              </span>
            </Link>
            <nav className="hidden md:flex gap-8">
              <Link href="/menu" className={`text-sm font-medium transition-colors hover:text-[#D4AF37] ${scrolled ? "text-foreground/80" : "text-white/80"}`}>Menu</Link>
              <Link href="/custom" className={`text-sm font-medium transition-colors hover:text-[#D4AF37] ${scrolled ? "text-foreground/80" : "text-white/80"}`}>Custom Cakes</Link>
              <Link href="/about" className={`text-sm font-medium transition-colors hover:text-[#D4AF37] ${scrolled ? "text-foreground/80" : "text-white/80"}`}>Our Story</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/login" className="hidden md:block">
              <Button variant="ghost" size="icon" className={`transition-colors hover:text-[#D4AF37] ${scrolled ? "text-foreground/80" : "text-white"}`}>
                <User className="h-5 w-5" />
                <span className="sr-only">Account</span>
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="ghost" size="icon" className={`relative transition-colors hover:text-[#D4AF37] ${scrolled ? "text-foreground/80" : "text-white"}`}>
                <ShoppingBag className="h-5 w-5 md:h-6 md:w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#D4AF37]" />
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
            <div className={`transition-colors ${scrolled ? "text-foreground" : "text-white"}`}>
              <PremiumMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 border-t border-border/40 pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors">
            <Home className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/menu" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors">
            <LayoutGrid className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Menu</span>
          </Link>
          <Link href="/custom" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors">
            <Cake className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Custom</span>
          </Link>
          <Link href="/login" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors">
            <User className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Account</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
