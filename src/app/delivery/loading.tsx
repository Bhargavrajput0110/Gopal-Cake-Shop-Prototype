// Delivery loading skeleton
// Renders inside <main className="w-full">
// Layout provides: topbar (no sidebar) + fixed bottom nav (pb-20 on wrapper).
// This loading content just fills the scrollable body area.

export default function DeliveryLoading() {
  return (
    <div className="px-4 pt-4 pb-4 space-y-4 animate-in fade-in duration-300">

      {/* Driver status card skeleton */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-32 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-20 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>

      {/* Section label */}
      <div className="h-5 w-36 rounded-lg bg-muted animate-pulse" />

      {/* Delivery order cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card p-4 space-y-4"
        >
          {/* Header: order ID + distance badge */}
          <div className="flex items-center justify-between">
            <div className="h-5 w-28 rounded-lg bg-muted animate-pulse" />
            <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
          </div>

          {/* Customer name + phone */}
          <div className="space-y-1.5">
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="h-3 w-28 rounded bg-muted animate-pulse" />
          </div>

          {/* Address line */}
          <div className="flex items-start gap-2">
            <div className="h-4 w-4 rounded bg-muted animate-pulse flex-shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
            </div>
          </div>

          {/* Action button */}
          <div className="h-11 w-full rounded-xl bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  )
}
