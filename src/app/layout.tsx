import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { SmoothScroller } from "@/components/layout/SmoothScroller";
import { HeaderFooterWrapper } from "@/components/layout/HeaderFooterWrapper";
import { CartProvider } from "@/context/CartContext";
import { OrderProvider } from "@/context/OrderContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import { Preloader } from "@/components/layout/Preloader";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { GlobalScrollDisabler } from "@/components/layout/GlobalScrollDisabler";
import { Noise } from "@/components/layout/Noise";
import { PWARegistration } from "@/components/PWARegistration";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import Script from "next/script";


// Fonts — self-hosted via next/font (no external requests, auto-optimized)
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Gopal Cake Shop — Premium Custom Cakes in Vadodara",
    template: "%s | Gopal Cake Shop",
  },
  description:
    "Gopal Cake Shop crafts premium custom cakes for every celebration in Vadodara. Order birthday cakes, wedding cakes, photo cakes & more with same-day delivery. 100% eggless. Est. 1990.",
  keywords: [
    "custom cakes Vadodara",
    "birthday cakes Vadodara",
    "wedding cakes Vadodara",
    "photo cakes Vadodara",
    "Gopal Cake Shop",
    "Gopal Cake Shop Vadodara",
    "eggless cakes Vadodara",
    "cake shop Vadodara",
    "designer cakes",
    "order cake online Vadodara",
    "bento cake Vadodara",
    "anniversary cake Vadodara",
    "same day cake delivery Vadodara",
    "cake delivery Vadodara",
  ],
  authors: [{ name: "Gopal Cake Shop" }],
  creator: "Gopal Cake Shop",
  publisher: "Gopal Cake Shop",
  manifest: "/manifest.json",
  metadataBase: new URL("https://gopalcakeshop.com"),
  alternates: {
    canonical: "https://gopalcakeshop.com",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://gopalcakeshop.com",
    siteName: "Gopal Cake Shop",
    title: "Gopal Cake Shop — Premium Custom Cakes in Vadodara",
    description:
      "Order premium custom cakes for birthdays, weddings & special occasions. Fresh, 100% eggless, handcrafted with love. Same-day delivery across Vadodara.",
    images: [
      {
        url: "/logo.png",
        width: 500,
        height: 500,
        alt: "Gopal Cake Shop Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gopal Cake Shop — Premium Custom Cakes in Vadodara",
    description:
      "Order premium custom cakes for birthdays, weddings & special occasions. 100% eggless. Same-day delivery across Vadodara.",
    images: ["/logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gopal Cake Shop",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#38251E",
  width: "device-width",
  initialScale: 1,
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`antialiased font-sans ${playfair.variable} ${dmSans.variable}`}
    >
      <head />
      <body suppressHydrationWarning className="flex flex-col w-full overflow-x-hidden bg-background text-foreground relative selection:bg-[#B67A7E] selection:text-white min-h-screen font-sans">
        <PWARegistration />
        <Noise />
        <Preloader />
        <CustomCursor />
        {/* Google Analytics 4 — loads after interactive, never blocks render */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        <ReactQueryProvider>
          <CustomerAuthProvider>
            <CartProvider>
              <OrderProvider>
                <SmoothScroller>
                  <HeaderFooterWrapper>
                    {children}
                  </HeaderFooterWrapper>
                </SmoothScroller>
                <GlobalScrollDisabler />
              </OrderProvider>
            </CartProvider>
          </CustomerAuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
