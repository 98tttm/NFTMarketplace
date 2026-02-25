"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteGridProps {
  children: ReactNode;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  /** Trigger distance from bottom in pixels. Default 200. */
  threshold?: number;
  className?: string;
}

export function InfiniteGrid({
  children,
  loading,
  hasMore,
  onLoadMore,
  threshold = 200,
  className = "",
}: InfiniteGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: `0px 0px ${threshold}px 0px` }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore, threshold]);

  return (
    <div className={className}>
      {children}

      <div ref={sentinelRef} className="w-full py-8 flex items-center justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 size={18} className="animate-spin text-primary" />
            Loading more...
          </div>
        )}
        {!loading && !hasMore && (
          <p className="text-sm text-text-muted">All items loaded</p>
        )}
      </div>
    </div>
  );
}
