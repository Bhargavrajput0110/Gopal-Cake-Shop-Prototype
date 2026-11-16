"use client";

import { SessionProvider } from "next-auth/react";

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchInterval={300} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
