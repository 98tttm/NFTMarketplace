interface TraitBadgeProps {
  traitType: string;
  value: string;
  /** Rarity percentage 0-100 */
  rarity?: number;
  className?: string;
}

function rarityColor(pct: number): { color: string; label: string } {
  if (pct <= 1) return { color: "#FFD700", label: "Legendary" };
  if (pct <= 5) return { color: "#A855F7", label: "Rare" };
  if (pct <= 20) return { color: "#3B82F6", label: "Uncommon" };
  return { color: "#10B981", label: "Common" };
}

export function TraitBadge({ traitType, value, rarity, className = "" }: TraitBadgeProps) {
  const r = rarity !== undefined ? rarityColor(rarity) : null;

  return (
    <div
      className={`rounded-xl border border-border p-3 ${className}`}
      style={{
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(8px)",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
        {traitType}
      </p>
      <p className="mt-0.5 text-sm font-bold text-text-primary truncate">{value}</p>
      {r && rarity !== undefined && (
        <p className="mt-1 text-[10px] font-medium" style={{ color: r.color }}>
          {rarity.toFixed(1)}% · {r.label}
        </p>
      )}
    </div>
  );
}
