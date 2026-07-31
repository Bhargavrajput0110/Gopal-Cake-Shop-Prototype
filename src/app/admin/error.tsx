"use client"
import { RoleErrorUI } from "@/components/ui/RoleErrorUI"
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RoleErrorUI error={error} reset={reset} role="Admin" homeHref="/admin" />
}
