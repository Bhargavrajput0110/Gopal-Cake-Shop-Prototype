import { redirect } from "next/navigation"

export default function OverridesPage() {
  // DEPRECATED: Manager Overrides mock workflow.
  // Redirect to Orders until properly implemented for RC2.
  redirect("/admin/orders")
}
