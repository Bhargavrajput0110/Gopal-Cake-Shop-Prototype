// Manager loading skeleton
// Renders inside <main className="flex-1 p-4 sm:p-6 lg:p-8">
// Layout provides: sidebar (md:pl-64) + topbar. Same shell as admin.

export default function ManagerLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-60 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* Branch selector pill row */}
      <div className="flex gap-2">
        {[88, 110, 100, 96].map((w, i) => (
          <div
            key={i}
            className="h-8 rounded-full bg-muted animate-pulse"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Operational KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-8 w-8 rounded-xl bg-muted animate-pulse" />
            </div>
            <div className="h-8 w-16 rounded-lg bg-muted animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>

      {/* Two-column charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="h-5 w-40 rounded-lg bg-muted animate-pulse" />
            <div className="h-48 w-full rounded-xl bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
