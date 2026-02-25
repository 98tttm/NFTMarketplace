import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p
        className="text-8xl font-black"
        style={{
          background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-text-primary">Page Not Found</h1>
      <p className="mt-2 max-w-md text-sm text-text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
        >
          <Home size={16} /> Go Home
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface"
        >
          <Search size={16} /> Explore
        </Link>
      </div>
    </div>
  );
}
