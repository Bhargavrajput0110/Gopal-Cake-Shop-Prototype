import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story",
  description: "Learn about Gopal Bakery's journey — crafting premium cakes in Vadodara since 1992. Four branches, one passion: making every celebration sweeter.",
  openGraph: {
    title: "Our Story | Gopal Bakery",
    description: "From a small kitchen in Khanderao Market to four branches across Vadodara. Discover the story behind every cake we bake.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
