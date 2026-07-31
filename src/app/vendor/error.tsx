"use client"
import { RoleErrorUI } from "@/components/ui/RoleErrorUI"
export default function VendorError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RoleErrorUI error={error} reset={reset} role="Vendor" homeHref="/vendor" />
}
