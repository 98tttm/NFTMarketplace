"use client";

import { useState, useEffect } from "react";

interface PriceDisplayProps {
  eth: string;
  showUSD?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

let cachedPrice: { usd: number; ts: number } | null = null;

async function fetchEthPrice(): Promise<number> {
  if (cachedPrice && Date.now() - cachedPrice.ts < 60_000) return cachedPrice.usd;
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    const data = await res.json();
    const usd = data?.ethereum?.usd ?? 0;
    cachedPrice = { usd, ts: Date.now() };
    return usd;
  } catch {
    return cachedPrice?.usd ?? 0;
  }
}

const SIZE_MAP = {
  sm: { eth: "text-sm", usd: "text-xs", icon: 14 },
  md: { eth: "text-lg", usd: "text-xs", icon: 18 },
  lg: { eth: "text-2xl", usd: "text-sm", icon: 22 },
};

function EthIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 1.5L4.5 12.75L12 9.75L19.5 12.75L12 1.5Z" fill="#8B5CF6" fillOpacity="0.6" />
      <path d="M12 9.75L4.5 12.75L12 17.25L19.5 12.75L12 9.75Z" fill="#8B5CF6" />
      <path d="M12 18.75L4.5 14.25L12 22.5L19.5 14.25L12 18.75Z" fill="#A78BFA" />
    </svg>
  );
}

export function PriceDisplay({
  eth,
  showUSD = true,
  size = "md",
  className = "",
}: PriceDisplayProps) {
  const [usdPrice, setUsdPrice] = useState<number | null>(cachedPrice?.usd ?? null);
  const s = SIZE_MAP[size];

  useEffect(() => {
    if (!showUSD) return;
    fetchEthPrice().then(setUsdPrice);
  }, [showUSD]);

  const ethNum = parseFloat(eth || "0");
  const usdValue = usdPrice !== null ? ethNum * usdPrice : null;

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-1.5">
        <EthIcon size={s.icon} />
        <span
          className={`font-bold tabular-nums ${s.eth} ${size === "lg" ? "gradient-text" : "text-text-primary"}`}
        >
          {eth} ETH
        </span>
      </div>
      {showUSD && usdValue !== null && (
        <span className={`${s.usd} text-text-muted ml-[${s.icon + 6}px]`}>
          ≈ ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
        </span>
      )}
    </div>
  );
}
