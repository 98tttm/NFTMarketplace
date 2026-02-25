"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{ background: "rgba(239, 68, 68, 0.1)" }}
      >
        <AlertTriangle size={36} className="text-danger" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-text-muted">
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-text-muted">Error ID: {error.digest}</p>
      )}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
        >
          <RotateCcw size={16} /> Try Again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface"
        >
          <Home size={16} /> Go Home
        </Link>
      </div>
    </div>
  );
}
