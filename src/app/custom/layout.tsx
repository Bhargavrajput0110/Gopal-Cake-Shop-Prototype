import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order a Custom Cake",
  description: "Design your perfect custom cake with Gopal Bakery. Choose weight, flavour, message & delivery option. Fresh, handcrafted cakes delivered in Vadodara.",
  openGraph: {
    title: "Order a Custom Cake | Gopal Bakery",
    description: "Build your dream cake in minutes. Pick your flavour, size, message & delivery. Handcrafted fresh every day in Vadodara.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function CustomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
