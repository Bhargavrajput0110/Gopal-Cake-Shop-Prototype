// Vendor loading skeleton
// Renders inside <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
// Layout provides: topbar only (no sidebar, no bottom nav). Full-width flex.

export default function VendorLoading() {
  return (
    <div className="flex-1 flex flex-col p-4 gap-4 animate-in fade-in duration-300">

      {/* Branch filter tabs skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
        {[90, 110, 100, 95].map((w, i) => (
          <div
            key={i}
            className="h-9 rounded-xl bg-muted animate-pulse flex-shrink-0"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Task cards grid */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            {/* Cake image placeholder */}
            <div
              className="w-full bg-muted animate-pulse"
              style={{ height: 180 - ((i * 11) % 40) }}
            />

            <div className="p-4 space-y-3">
              {/* Task type badge */}
              <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
              {/* Order ID */}
              <div className="h-5 w-28 rounded-lg bg-muted animate-pulse" />
              {/* Instructions */}
              <div className="space-y-1">
                <div className="h-3 w-full rounded bg-muted animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              </div>
              {/* Action button */}
              <div className="h-10 w-full rounded-xl bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
