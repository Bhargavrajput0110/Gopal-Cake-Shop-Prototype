import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cake Menu",
  description: "Explore Gopal Cake Shop's full collection of premium cakes — birthday, wedding, photo, designer & custom cakes handcrafted in Vadodara. 100% eggless.",
  openGraph: {
    title: "Cake Menu | Gopal Cake Shop",
    description: "Browse our stunning collection of handcrafted cakes. Birthday, wedding, anniversary & photo cakes — all made fresh in Vadodara. 100% eggless.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
