"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SearchNormal1, ShoppingCart, User } from "iconsax-react";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Order", href: "/menu" },
  { name: "Custom", href: "/custom" },
  { name: "About Us", href: "/about" },
];

const ANNOUNCEMENT_ITEMS = [
  "🎂 Free delivery on orders above ₹999",
  "⭐ 50,000+ happy customers in Vadodara",
  "🍫 100% eggless — always",
  "🚀 Order by 6pm for same-day delivery",
  "🏆 Est. 1995 — 30 Years of Craft",
];

export function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, logout } = useCustomerAuth();
  const [scrolled, setScrolled] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const showScrolledNavbar = scrolled || !isHome;

  const allNavLinks = [
    ...NAV_LINKS,
    ...(user ? [{ name: "My Orders", href: "/customer/orders" }] : []),
  ];

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setAtTop(y < 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cycle announcement
  useEffect(() => {
    const interval = setInterval(() => {
      setAnnouncementIndex((i) => (i + 1) % ANNOUNCEMENT_ITEMS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const closeMobile = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <>
      {/* ── Announcement Bar ── */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-9 bg-[var(--brand-chocolate)] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={announcementIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="font-ui text-[11px] tracking-[0.15em] text-white/80 uppercase text-center"
          >
            {ANNOUNCEMENT_ITEMS[announcementIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ── Main Header ── */}
      <header
        className={`fixed top-9 left-0 right-0 z-50 transition-all duration-500 ${
          showScrolledNavbar
            ? "glass border-b border-[var(--border)]/40 shadow-[0_8px_32px_rgba(28,15,10,0.08)] py-0"
            : "bg-transparent py-0 border-b border-transparent"
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-[72px] md:h-20">

            {/* ── Left: Nav links (desktop) ── */}
            <nav className="hidden md:flex items-center gap-1">
              {allNavLinks.slice(0, 2).map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`font-ui text-[11px] font-semibold uppercase tracking-[0.15em] px-4 py-2 rounded-full transition-all duration-250
                    ${showScrolledNavbar
                      ? "text-[var(--foreground)]/70 hover:text-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/8"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* ── Mobile: Hamburger ── */}
            <button
              className="md:hidden flex flex-col items-center justify-center w-10 h-10 gap-[5px] focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`block w-[22px] h-[1.5px] transition-all duration-300 origin-center ${
                mobileMenuOpen
                  ? "bg-[var(--brand-deep-rose)] rotate-45 translate-y-[6.5px]"
                  : showScrolledNavbar ? "bg-foreground" : "bg-white"
              }`} />
              <span className={`block w-[22px] h-[1.5px] transition-all duration-300 ${
                mobileMenuOpen ? "opacity-0" : showScrolledNavbar ? "bg-foreground" : "bg-white"
              }`} />
              <span className={`block w-[22px] h-[1.5px] transition-all duration-300 origin-center ${
                mobileMenuOpen
                  ? "bg-[var(--brand-deep-rose)] -rotate-45 -translate-y-[6.5px]"
                  : showScrolledNavbar ? "bg-foreground" : "bg-white"
              }`} />
            </button>

            {/* ── Center: Logo ── */}
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center group"
            >
              <div className="flex flex-col items-center">
                {/* Wordmark */}
                <span className={`font-display italic font-bold tracking-wide leading-none transition-colors duration-300 ${
                  showScrolledNavbar ? "text-[var(--foreground)]" : "text-white"
                } text-xl md:text-2xl`}>
                  Gopal
                </span>
                <span className={`font-ui font-bold text-[7px] tracking-[0.35em] uppercase leading-none mt-0.5 transition-colors duration-300 ${
                  showScrolledNavbar ? "text-[var(--brand-deep-rose)]" : "text-[var(--brand-champagne)]"
                }`}>
                  Cakes & Sweets
                </span>
              </div>
              {/* Gold underline on hover */}
              <span className={`block h-px w-0 group-hover:w-full transition-all duration-500 mt-1 ${
                showScrolledNavbar ? "bg-[var(--brand-champagne)]" : "bg-white/60"
              }`} />
            </Link>

            {/* ── Right: Nav links + Actions ── */}
            <div className="hidden md:flex items-center gap-1">
              {allNavLinks.slice(2).map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`font-ui text-[11px] font-semibold uppercase tracking-[0.15em] px-4 py-2 rounded-full transition-all duration-250
                    ${showScrolledNavbar
                      ? "text-[var(--foreground)]/70 hover:text-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/8"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Divider */}
              <span className={`w-px h-4 mx-2 ${showScrolledNavbar ? "bg-border" : "bg-white/20"}`} />

              {/* Search */}
              <button 
                onClick={() => setIsSearchOpen(true)}
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-250 ${
                showScrolledNavbar
                  ? "text-foreground/60 hover:text-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/8"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}>
                <SearchNormal1 variant="TwoTone" className="h-[18px] w-[18px]" />
              </button>

              {/* User */}
              {user ? (
                <button
                  onClick={() => logout()}
                  className={`font-ui text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-2 rounded-full transition-all duration-250 ${
                    showScrolledNavbar
                      ? "text-foreground/60 hover:text-[var(--brand-deep-rose)]"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/customer/login"
                  className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-250 ${
                    showScrolledNavbar
                      ? "text-foreground/60 hover:text-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/8"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <User variant="TwoTone" className="h-[18px] w-[18px]" />
                </Link>
              )}

              {/* Cart */}
              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center w-10 h-10 transition-all duration-200 hover:opacity-80"
              >
                <ShoppingCart size="30" color={showScrolledNavbar ? "#8b3a52" : "#ffffff"} variant="Bold" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-[18px] w-[18px] rounded-full bg-[var(--brand-deep-rose)] text-white text-[9px] font-bold flex items-center justify-center border border-white shadow-sm">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Order CTA */}
              <Link href="/custom" className="btn-primary px-5 py-2.5 text-[10px] ml-2">
                Customize
              </Link>
            </div>

            {/* ── Mobile: Cart & Search ── */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all ${
                  showScrolledNavbar ? "text-foreground/70" : "text-white/80"
                }`}
              >
                <SearchNormal1 variant="TwoTone" className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center w-10 h-10 transition-all duration-200 hover:opacity-80"
              >
                <ShoppingCart size="30" color={showScrolledNavbar ? "#8b3a52" : "#ffffff"} variant="Bold" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-[18px] w-[18px] rounded-full bg-[var(--brand-deep-rose)] text-white text-[9px] font-bold flex items-center justify-center border border-white shadow-sm">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Gold rule visible when scrolled ── */}
        {showScrolledNavbar && (
          <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, var(--brand-champagne)/30, transparent)" }} />
        )}
      </header>

      {/* ── Fullscreen Search Overlay ── */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex flex-col glass-dark"
          >
            <div className="flex-1 w-full max-w-[1000px] mx-auto px-6 pt-24 md:pt-32">
              <div className="flex justify-between items-center mb-12">
                <h2 className="font-display italic text-4xl md:text-5xl text-white">Search</h2>
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="relative">
                <SearchNormal1 className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  autoFocus
                  className="w-full bg-white/5 border border-white/20 rounded-full py-5 pl-16 pr-8 text-white font-ui text-lg focus:outline-none focus:border-[var(--brand-champagne)]/60 focus:bg-white/10 transition-all placeholder:text-white/30"
                />
              </div>

              <div className="mt-12">
                <span className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 block mb-6">Popular Searches</span>
                <div className="flex flex-wrap gap-3">
                  {["Belgian Chocolate", "Wedding Cakes", "Bento", "Anniversary", "Eggless Truffle"].map(term => (
                    <button key={term} className="px-5 py-2.5 rounded-full border border-white/15 text-white/70 font-editorial text-sm hover:text-white hover:border-[var(--brand-champagne)]/50 hover:bg-white/5 transition-all">
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── Mobile Menu Drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-[var(--brand-chocolate)]/60 backdrop-blur-sm"
              onClick={closeMobile}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[min(85vw,340px)] bg-[var(--brand-cream)] shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 pt-12 pb-8 border-b border-[var(--border)]">
                <div className="flex flex-col">
                  <span className="font-display italic font-bold text-2xl text-[var(--foreground)]">Gopal</span>
                  <span className="font-ui text-[9px] tracking-[0.35em] uppercase text-[var(--brand-deep-rose)] font-bold mt-0.5">
                    Cakes & Sweets
                  </span>
                </div>
                <button
                  onClick={closeMobile}
                  className="w-9 h-9 flex items-center justify-center text-foreground/60 hover:text-foreground rounded-full hover:bg-muted transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="1" y1="1" x2="17" y2="17" />
                    <line x1="17" y1="1" x2="1" y2="17" />
                  </svg>
                </button>
              </div>

              {/* Nav Links */}
              <nav className="flex flex-col gap-1 px-4 pt-6 flex-1">
                {allNavLinks.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i + 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={closeMobile}
                      className="flex items-center justify-between px-4 py-4 rounded-xl text-foreground/80 hover:text-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/6 transition-all group"
                    >
                      <span className="font-ui font-semibold text-base tracking-wide">{link.name}</span>
                      <svg
                        className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Bottom CTA */}
              <div className="px-6 pb-10 pt-6 border-t border-[var(--border)]">
                <Link href="/custom" onClick={closeMobile} className="btn-primary w-full justify-center py-4 text-[11px]">
                  Customize Your Cake
                </Link>
                {!user ? (
                  <Link href="/customer/login" onClick={closeMobile} className="block mt-3">
                    <button className="w-full py-3.5 text-center font-ui text-[11px] font-bold uppercase tracking-[0.15em] text-foreground/60 hover:text-foreground transition-colors">
                      Login to Account
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={() => { logout(); closeMobile(); }}
                    className="block w-full mt-3 py-3.5 text-center font-ui text-[11px] font-bold uppercase tracking-[0.15em] text-foreground/60 hover:text-foreground transition-colors"
                  >
                    Logout
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
