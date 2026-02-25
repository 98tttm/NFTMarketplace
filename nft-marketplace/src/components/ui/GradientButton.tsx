"use client";

import { useState, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

interface GradientButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const VARIANT_STYLES: Record<Variant, { bg: string; hover: string; border?: string; text: string }> = {
  primary: {
    bg: "linear-gradient(135deg, #8B5CF6, #3B82F6)",
    hover: "linear-gradient(135deg, #7C3AED, #2563EB)",
    text: "text-white",
  },
  secondary: {
    bg: "transparent",
    hover: "rgba(139,92,246,0.08)",
    border: "linear-gradient(135deg, #8B5CF6, #3B82F6)",
    text: "text-primary",
  },
  danger: {
    bg: "linear-gradient(135deg, #EF4444, #DC2626)",
    hover: "linear-gradient(135deg, #DC2626, #B91C1C)",
    text: "text-white",
  },
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2",
  xl: "px-8 py-4 text-lg rounded-2xl gap-2.5",
};

const SPINNER_SIZE: Record<Size, number> = { sm: 12, md: 16, lg: 18, xl: 20 };

export function GradientButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  onClick,
  ...rest
}: GradientButtonProps) {
  const v = VARIANT_STYLES[variant];
  const btnRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (loading || disabled) return;

    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const id = Date.now();
      setRipples((prev) => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    }

    onClick?.(e);
  }

  const isDisabled = disabled || loading;

  if (variant === "secondary") {
    return (
      <div className="relative inline-block rounded-xl p-[1px]" style={{ background: v.border }}>
        <button
          ref={btnRef}
          onClick={handleClick}
          disabled={isDisabled}
          className={`relative flex items-center justify-center overflow-hidden font-semibold transition-all bg-card ${v.text} ${SIZE_STYLES[size]} ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-surface"} ${className}`}
          {...rest}
        >
          {loading ? <Loader2 size={SPINNER_SIZE[size]} className="animate-spin" /> : children}
          <Ripples ripples={ripples} />
        </button>
      </div>
    );
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      disabled={isDisabled}
      className={`group relative flex items-center justify-center overflow-hidden font-semibold transition-all ${v.text} ${SIZE_STYLES[size]} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      style={{ background: v.bg }}
      {...rest}
    >
      <span className="relative z-10 flex items-center gap-inherit">
        {loading ? <Loader2 size={SPINNER_SIZE[size]} className="animate-spin" /> : children}
      </span>

      {/* Shimmer on hover */}
      {!isDisabled && (
        <span className="pointer-events-none absolute inset-0 z-0 -translate-x-full opacity-0 transition-all duration-500 group-hover:translate-x-full group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      )}

      <Ripples ripples={ripples} />
    </button>
  );
}

function Ripples({ ripples }: { ripples: { x: number; y: number; id: number }[] }) {
  return (
    <>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute z-20 animate-[ripple_0.6s_ease-out_forwards] rounded-full bg-white/20"
          style={{ left: r.x, top: r.y, width: 0, height: 0, transform: "translate(-50%,-50%)" }}
        />
      ))}
    </>
  );
}
