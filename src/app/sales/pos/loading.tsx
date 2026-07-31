// POS loading skeleton
// Renders inside CartProvider > <main> in the POS layout
// POS is a split-panel layout: left = product grid, right = cart panel

export default function POSLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 overflow-hidden animate-in fade-in duration-300">

      {/* LEFT — Product grid panel */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden border-r border-border">
        {/* Search + filter bar */}
        <div className="flex gap-3 flex-shrink-0">
          <div className="h-10 flex-1 rounded-xl bg-muted animate-pulse" />
          <div className="h-10 w-28 rounded-xl bg-muted animate-pulse" />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-shrink-0 overflow-x-hidden">
          {[72, 96, 80, 88, 76].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-full bg-muted animate-pulse flex-shrink-0"
              style={{ width: w }}
            />
          ))}
        </div>

        {/* Product cards grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              {/* Product image */}
              <div
                className="w-full bg-muted animate-pulse"
                style={{ height: 120 - ((i * 5) % 20) }}
              />
              <div className="p-3 space-y-2">
                <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
                <div className="h-5 w-2/5 rounded-lg bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Cart panel */}
      <div className="w-80 flex-shrink-0 flex flex-col p-4 gap-4 bg-card">
        {/* Cart header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="h-6 w-24 rounded-lg bg-muted animate-pulse" />
          <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
        </div>

        {/* Cart items */}
        <div className="flex-1 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl border border-border">
              <div className="h-12 w-12 rounded-lg bg-muted animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-5 w-14 rounded-lg bg-muted animate-pulse" />
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="space-y-2 border-t border-border pt-4 flex-shrink-0">
          {[["Subtotal", 60], ["Delivery", 40], ["Total", 80]].map(([label, w]) => (
            <div key={label as string} className="flex justify-between">
              <div className="h-4 rounded bg-muted animate-pulse" style={{ width: w as number }} />
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>

        {/* Checkout button */}
        <div className="h-12 w-full rounded-xl bg-muted animate-pulse flex-shrink-0" />
      </div>
    </div>
  )
}
