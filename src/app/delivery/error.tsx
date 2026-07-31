"use client"
import { RoleErrorUI } from "@/components/ui/RoleErrorUI"
export default function DeliveryError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RoleErrorUI error={error} reset={reset} role="Delivery" homeHref="/delivery" />
}
