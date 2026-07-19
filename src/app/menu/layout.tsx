import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cake Menu",
  description: "Explore Gopal Bakery's full collection of premium cakes — birthday, wedding, photo, designer & custom cakes handcrafted in Vadodara.",
  openGraph: {
    title: "Cake Menu | Gopal Bakery",
    description: "Browse our stunning collection of handcrafted cakes. Birthday, wedding, anniversary & photo cakes — all made fresh in Vadodara.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
