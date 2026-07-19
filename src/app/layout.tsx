import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SmoothScroller } from "@/components/layout/SmoothScroller";
import { HeaderFooterWrapper } from "@/components/layout/HeaderFooterWrapper";
import { CartProvider } from "@/context/CartContext";
import { OrderProvider } from "@/context/OrderContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import { Preloader } from "@/components/layout/Preloader";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { Noise } from "@/components/layout/Noise";
import { PWARegistration } from "@/components/PWARegistration";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-heading",
  style: ["normal", "italic"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  style: ["normal", "italic"],
  display: "swap",
});


export const metadata: Metadata = {
  title: {
    default: "Gopal Bakery — Premium Custom Cakes in Vadodara",
    template: "%s | Gopal Bakery",
  },
  description: "Gopal Bakery crafts premium custom cakes for every celebration in Vadodara. Order birthday cakes, wedding cakes, photo cakes & more with same-day delivery.",
  keywords: ["custom cakes Vadodara", "birthday cakes Vadodara", "wedding cakes", "photo cakes", "Gopal Bakery", "cake shop Vadodara", "designer cakes", "order cake online"],
  authors: [{ name: "Gopal Bakery" }],
  creator: "Gopal Bakery",
  publisher: "Gopal Bakery",
  manifest: "/manifest.json",
  metadataBase: new URL("https://gopalbakery.in"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://gopalbakery.in",
    siteName: "Gopal Bakery",
    title: "Gopal Bakery — Premium Custom Cakes in Vadodara",
    description: "Order premium custom cakes for birthdays, weddings & special occasions. Fresh, handcrafted with love. Delivery across Vadodara.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Gopal Bakery — Premium Custom Cakes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gopal Bakery — Premium Custom Cakes in Vadodara",
    description: "Order premium custom cakes for birthdays, weddings & special occasions.",
    images: ["/og-image.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gopal Bakery",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
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
      className={`antialiased ${inter.variable} ${cormorant.variable} ${playfair.variable}`}
    >
      <body suppressHydrationWarning className="flex flex-col bg-background text-foreground relative selection:bg-[#B67A7E] selection:text-white min-h-screen font-sans">
        <PWARegistration />
        <Noise />
        <Preloader />
        <CustomCursor />
        <ReactQueryProvider>
          <CustomerAuthProvider>
            <CartProvider>
              <OrderProvider>
                <SmoothScroller>
                  <HeaderFooterWrapper>
                    {children}
                  </HeaderFooterWrapper>
                </SmoothScroller>
              </OrderProvider>
            </CartProvider>
          </CustomerAuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
