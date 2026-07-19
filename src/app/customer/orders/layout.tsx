import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders",
  description: "View your order history, track active orders, and get delivery updates from Gopal Bakery.",
  robots: { index: false, follow: false }, // Private page — exclude from search
};

export default function CustomerOrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
