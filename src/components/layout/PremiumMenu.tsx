"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const menuLinks = [
  { title: "Home", href: "/" },
  { title: "Our Catalog", href: "/menu" },
  { title: "Design Custom", href: "/custom" },
  { title: "About The Bakery", href: "/about" },
  { title: "Track Order", href: "/login" },
];

export function PremiumMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-foreground/80 hover:text-foreground transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#2D1E17] flex flex-col items-center justify-center overflow-y-auto"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 hover:text-[#D4AF37] transition-all"
            >
              <X className="h-8 w-8" />
            </button>

            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center gap-10 text-center w-full px-4 py-10"
            >
              <h2 className="font-heading text-3xl md:text-4xl text-[#D4AF37] font-bold mb-6 italic tracking-wider">
                Gopal Cake Shop
              </h2>
              
              <div className="flex flex-col gap-8 w-full items-center">
                {menuLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    className="w-full max-w-sm"
                  >
                    <Link 
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="block text-3xl md:text-5xl font-heading font-semibold text-white hover:text-[#D4AF37] transition-all duration-300 hover:italic py-2"
                    >
                      {link.title}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
