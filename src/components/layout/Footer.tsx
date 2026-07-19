"use client";

import Link from "next/link";
import { Location } from "iconsax-react";


const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const BRANCHES = [
  { name: "Alkapuri", address: "Near Baroda Club, Alkapuri", phone: "+91 99090 12345" },
  { name: "Manjalpur", address: "Near Manjalpur Circle", phone: "+91 99090 12346" },
  { name: "Sayajigunj", address: "Near Lakshmi Vilas Palace Rd", phone: "+91 99090 12347" },
  { name: "Fatehganj", address: "Near Fatehganj, Main Road", phone: "+91 99090 12348" },
];

const NAV_GROUPS = [
  {
    heading: "Order",
    links: [
      { name: "Our Menu", href: "/menu" },
      { name: "Custom Cakes", href: "/custom" },
      { name: "Wedding Cakes", href: "/menu?category=wedding" },
      { name: "Photo Cakes", href: "/menu?category=photo" },
      { name: "Bento Cakes", href: "/menu?category=bento" },
    ],
  },
  {
    heading: "Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/about#careers" },
      { name: "Contact", href: "/about#contact" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
    ],
  },
];

const SOCIAL = [
  { Icon: InstagramIcon, label: "Instagram", href: "#" },
  { Icon: FacebookIcon, label: "Facebook", href: "#" },
  { Icon: YoutubeIcon, label: "YouTube", href: "#" },
];

export function Footer() {
  return (
    <footer style={{ background: "var(--brand-chocolate)" }} className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[300px] rounded-full blur-[160px] pointer-events-none"
        style={{ background: "rgba(200,169,126,0.04)" }} />

      {/* Gold top rule */}
      <div className="h-px w-full" style={{
        background: "linear-gradient(90deg, transparent, rgba(200,169,126,0.5), transparent)"
      }} />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 pt-20 pb-10 relative z-10">

        {/* ── Top: Brand + Newsletter ── */}
        <div className="flex flex-col lg:flex-row justify-between gap-12 pb-16 border-b border-white/10">
          {/* Brand */}
          <div className="max-w-sm">
            <Link href="/" className="flex items-baseline gap-1 mb-6">
              <span className="font-display italic font-bold text-3xl text-white">Gopal</span>
              <span className="font-display italic font-light text-2xl text-[var(--brand-champagne)] ml-2">Cakes</span>
            </Link>
            <p className="font-editorial italic text-white/40 text-base leading-relaxed mb-8 max-w-[280px]">
              Handcrafted cakes for every celebration. 100% eggless. Baked fresh daily since 1995.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2">
              {SOCIAL.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-[var(--brand-champagne)]/60 hover:bg-[var(--brand-champagne)]/10 transition-all duration-300 hover:scale-110"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="max-w-md">
            <h3 className="font-ui text-[10px] tracking-[0.3em] uppercase text-[var(--brand-champagne)] font-semibold mb-3">
              Stay in the loop
            </h3>
            <p className="font-editorial italic text-white/40 text-sm mb-5">
              Get notified of new flavours, seasonal specials and exclusive offers.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-full px-5 py-3 text-sm font-sans focus:outline-none focus:border-[var(--brand-champagne)]/40 focus:bg-white/8 transition-all"
              />
              <button className="btn-primary px-5 py-3 text-[10px] whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* ── Middle: Branches + Nav ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-14 border-b border-white/10">
          {/* Branches */}
          <div className="md:col-span-1">
            <h3 className="font-ui text-[10px] tracking-[0.3em] uppercase text-[var(--brand-champagne)] font-semibold mb-6">
              Our Branches
            </h3>
            <div className="space-y-5">
              {BRANCHES.map((branch) => (
                <div key={branch.name} className="flex gap-3 group">
                  <Location variant="TwoTone" className="w-4 h-4 text-[var(--brand-champagne)]/50 mt-0.5 flex-shrink-0 group-hover:text-[var(--brand-champagne)] transition-colors" />
                  <div>
                    <p className="font-ui font-semibold text-sm text-white/80 group-hover:text-white transition-colors">
                      {branch.name}
                    </p>
                    <p className="font-editorial italic text-white/35 text-[12px] leading-snug mt-0.5">
                      {branch.address}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nav groups */}
          {NAV_GROUPS.map((group) => (
            <div key={group.heading}>
              <h3 className="font-ui text-[10px] tracking-[0.3em] uppercase text-[var(--brand-champagne)] font-semibold mb-6">
                {group.heading}
              </h3>
              <ul className="space-y-3.5">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="font-editorial text-white/45 text-sm hover:text-white/80 transition-colors duration-250 leading-none"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom: Copyright + Brand statement ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
          <p className="font-ui text-[11px] text-white/25 tracking-wide">
            © {new Date().getFullYear()} Gopal Cakes & Sweets. All rights reserved.
          </p>

          <p className="font-display italic text-white/15 text-sm">
            Made with love in Vadodara, Gujarat 🇮🇳
          </p>

          <div className="flex items-center gap-1 font-ui text-[10px] text-white/20 tracking-wide">
            <span>Built by</span>
            <span className="text-[var(--brand-champagne)]/40 ml-1">Gopal Digital Team</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
