export default function NFTDetailLoading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 animate-pulse">
        {/* Left: large square image */}
        <div className="space-y-5">
          <div className="aspect-square rounded-2xl border border-border bg-card overflow-hidden">
            <div className="relative h-full w-full bg-surface">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 rounded-xl border border-border bg-surface" />
            <div className="h-9 w-24 rounded-xl border border-border bg-surface" />
            <div className="h-9 w-24 rounded-xl border border-border bg-surface ml-auto" />
          </div>
        </div>

        {/* Right: text bars + price bar */}
        <div className="space-y-6">
          <div className="h-3 w-48 rounded bg-surface" />
          <div className="space-y-2">
            <div className="h-8 w-3/4 rounded bg-surface" />
            <div className="h-4 w-32 rounded bg-surface" />
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-surface" />
              <div className="space-y-1">
                <div className="h-2.5 w-14 rounded bg-surface" />
                <div className="h-3 w-20 rounded bg-surface" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-surface" />
              <div className="space-y-1">
                <div className="h-2.5 w-14 rounded bg-surface" />
                <div className="h-3 w-20 rounded bg-surface" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="h-3 w-20 rounded bg-surface" />
            <div className="h-8 w-24 rounded bg-surface" />
            <div className="h-3 w-16 rounded bg-surface" />
            <div className="h-11 w-full rounded-xl bg-surface" />
            <div className="h-10 w-full rounded-xl border border-border bg-surface" />
          </div>
        </div>
      </div>
    </section>
  );
}
