// Admin loading skeleton
// Renders ONLY inside <main className="flex-1 p-4 sm:p-6 lg:p-8">
// The sidebar + topbar are already rendered by layout.tsx — no overlap.

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-72 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* KPI stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-8 w-8 rounded-xl bg-muted animate-pulse" />
            </div>
            <div className="h-7 w-24 rounded-lg bg-muted animate-pulse" />
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Table toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="h-9 w-56 rounded-lg bg-muted animate-pulse" />
          <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
          <div className="ml-auto h-9 w-20 rounded-lg bg-muted animate-pulse" />
        </div>

        {/* Table header */}
        <div className="flex gap-4 px-4 py-2.5 border-b border-border bg-muted/40">
          {[100, 160, 120, 100, 80, 60].map((w, i) => (
            <div key={i} className="h-3 rounded bg-muted animate-pulse" style={{ width: w }} />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, ri) => (
          <div
            key={ri}
            className="flex gap-4 px-4 py-3.5 border-b border-border last:border-0"
          >
            {[100, 160, 120, 100, 80, 60].map((w, ci) => (
              <div
                key={ci}
                className="h-4 rounded bg-muted animate-pulse"
                // Deterministic width variation — no random, avoids hydration mismatch
                style={{ width: w - ((ri * 7 + ci * 13) % 24) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
