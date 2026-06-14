import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SmoothScroller } from "@/components/layout/SmoothScroller";
import { HeaderFooterWrapper } from "@/components/layout/HeaderFooterWrapper";
import { OrderProvider } from "@/context/OrderContext";
import { Preloader } from "@/components/layout/Preloader";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { Noise } from "@/components/layout/Noise";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gopal Bakery ERP",
  description: "Enterprise Dashboard",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#38251E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} antialiased`}
    >
      <body suppressHydrationWarning className="flex flex-col bg-background text-foreground relative selection:bg-[#D4AF37] selection:text-black min-h-screen">
        <Noise />
        <Preloader />
        <CustomCursor />
        <OrderProvider>
          <SmoothScroller>
            <HeaderFooterWrapper>{children}</HeaderFooterWrapper>
          </SmoothScroller>
        </OrderProvider>
      </body>
    </html>
  );
}
