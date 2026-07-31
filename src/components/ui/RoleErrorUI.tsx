"use client"

import { useEffect } from "react"

// Shared inline error UI for ERP role-level error boundaries.
// Each role-route imports this so the layout shell (sidebar/topbar) stays
// visible while only the main content area shows the error state.

function RoleErrorUI({
  error,
  reset,
  role,
  homeHref,
}: {
  error: Error & { digest?: string }
  reset: () => void
  role: string
  homeHref: string
}) {
  useEffect(() => {
    console.error(`[${role} Error Boundary]`, error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-destructive"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-1">
        This section encountered an unexpected error.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/50 font-mono mb-6">
          ID: {error.digest}
        </p>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
        <a
          href={homeHref}
          className="px-5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-bold hover:bg-muted transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}

// ─── Per-Route Exports ────────────────────────────────────────────────────────
// Each file is tiny — it just re-exports RoleErrorUI with role-specific config.
// Keeping them all in one shared module avoids duplicating the component.

export { RoleErrorUI }
