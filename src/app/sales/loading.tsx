// Sales loading skeleton
// Renders ONLY inside <main className="flex-1 p-4 sm:p-6 lg:p-8">
// Layout provides: sidebar (md:pl-64), topbar, mobile bottom nav (pb-16 md:pb-0)
// None of those are re-rendered here.

export default function SalesLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">

      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-64 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="hidden sm:flex gap-2">
          <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
          <div className="h-9 w-28 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      {/* Status filter tabs skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[80, 100, 96, 72, 88, 80].map((w, i) => (
          <div
            key={i}
            className="h-9 rounded-xl bg-muted animate-pulse flex-shrink-0"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Order cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 space-y-4"
          >
            {/* Card header: order ID + badge */}
            <div className="flex items-center justify-between">
              <div className="h-5 w-28 rounded-lg bg-muted animate-pulse" />
              <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
            </div>
            {/* Customer name */}
            <div className="h-4 w-36 rounded bg-muted animate-pulse" />
            {/* Details row */}
            <div className="flex gap-3">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            </div>
            {/* Divider */}
            <div className="h-px bg-border" />
            {/* Action buttons */}
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded-lg bg-muted animate-pulse" />
              <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
              <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
