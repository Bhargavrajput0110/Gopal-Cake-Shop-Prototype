"use client"
import { RoleErrorUI } from "@/components/ui/RoleErrorUI"
export default function ManagerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RoleErrorUI error={error} reset={reset} role="Manager" homeHref="/manager" />
}
