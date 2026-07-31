// Chef KDS loading skeleton
// Renders inside <main className="flex-1 flex flex-col min-h-0 overflow-y-auto relative">
// Layout provides: topbar only (no sidebar). Full-width columns layout.

export default function ChefLoading() {
  // 3 KDS columns: Incoming | Making | Ready
  const columns = ["Incoming", "Making", "Ready"]

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
      {/* Column header strip — matches KDS column headers */}
      <div className="grid grid-cols-3 gap-0 border-b border-border bg-muted/30 flex-shrink-0">
        {columns.map((col) => (
          <div
            key={col}
            className="px-4 py-3 flex items-center justify-between border-r border-border last:border-r-0"
          >
            <div className="h-5 w-20 rounded-lg bg-muted animate-pulse" />
            <div className="h-6 w-8 rounded-full bg-muted animate-pulse" />
          </div>
        ))}
      </div>

      {/* KDS card columns */}
      <div className="flex-1 grid grid-cols-3 gap-0 min-h-0 overflow-hidden">
        {columns.map((col, ci) => (
          <div
            key={col}
            className="flex flex-col gap-3 p-3 overflow-y-auto border-r border-border last:border-r-0"
          >
            {/* Each column gets a different number of skeleton cards for visual variety */}
            {Array.from({ length: ci === 0 ? 4 : ci === 1 ? 3 : 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4 space-y-3 flex-shrink-0"
              >
                {/* Order ID + elapsed time */}
                <div className="flex items-center justify-between">
                  <div className="h-5 w-24 rounded-lg bg-muted animate-pulse" />
                  <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
                </div>
                {/* Cake name */}
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                {/* Details: weight + flavor */}
                <div className="flex gap-2">
                  <div className="h-3 w-14 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                </div>
                {/* Divider */}
                <div className="h-px bg-border" />
                {/* Action button */}
                <div className="h-9 w-full rounded-lg bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
