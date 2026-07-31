"use client"
import { RoleErrorUI } from "@/components/ui/RoleErrorUI"
export default function SalesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RoleErrorUI error={error} reset={reset} role="Sales" homeHref="/sales" />
}
