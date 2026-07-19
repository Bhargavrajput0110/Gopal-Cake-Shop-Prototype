import CustomerLoginClient from "./CustomerLoginClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Login | Gopal Cake Shop",
  description: "Access your order history and manage your account",
};

export const dynamic = "force-dynamic";

export default function CustomerLoginPage() {
  return <CustomerLoginClient />;
}
