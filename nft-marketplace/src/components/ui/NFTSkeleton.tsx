/** Animated shimmer skeleton matching NFTCard dimensions. */
export function NFTSkeleton() {
  return (
    <div
      className="w-full overflow-hidden rounded-2xl border border-border bg-card"
      style={{ boxShadow: "0 4px 24px rgba(139, 92, 246, 0.05)" }}
    >
      <div className="relative aspect-square overflow-hidden bg-surface">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-surface" />
          <div className="h-3 w-24 rounded bg-surface" />
        </div>
        <div className="h-4 w-3/4 rounded bg-surface" />
        <div className="flex items-center justify-between pt-1">
          <div className="space-y-1">
            <div className="h-2.5 w-12 rounded bg-surface" />
            <div className="h-4 w-20 rounded bg-surface" />
          </div>
          <div className="space-y-1">
            <div className="h-2.5 w-14 rounded bg-surface" />
            <div className="h-4 w-16 rounded bg-surface" />
          </div>
        </div>
        <div className="h-9 w-full rounded-xl bg-surface" />
      </div>
    </div>
  );
}

export function NFTSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <NFTSkeleton key={i} />
      ))}
    </div>
  );
}
