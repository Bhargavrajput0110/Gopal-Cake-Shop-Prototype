"use client";

export function PageColorWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen relative bg-[var(--brand-cream)] text-[var(--foreground)]">
      {children}
    </div>
  );
}
