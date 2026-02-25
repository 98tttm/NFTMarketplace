"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  STATUS_OPTIONS,
  CATEGORIES,
  CHAINS,
  type MarketplaceFilters,
} from "@/hooks/useMarketplaceFilters";

interface ActiveFiltersProps {
  filters: MarketplaceFilters;
  setFilters: (u: Partial<MarketplaceFilters>) => void;
  toggleArrayItem: (key: "collections" | "categories" | "chains", id: string) => void;
  clearAll: () => void;
  count: number;
}

interface Chip {
  key: string;
  label: string;
  remove: () => void;
}

export function ActiveFilters({
  filters,
  setFilters,
  toggleArrayItem,
  clearAll,
  count,
}: ActiveFiltersProps) {
  if (count === 0) return null;

  const chips: Chip[] = [];

  if (filters.status !== "all") {
    const opt = STATUS_OPTIONS.find((s) => s.value === filters.status);
    chips.push({
      key: "status",
      label: opt?.label ?? filters.status,
      remove: () => setFilters({ status: "all" }),
    });
  }

  if (filters.minPrice || filters.maxPrice) {
    const lbl =
      filters.minPrice && filters.maxPrice
        ? `${filters.minPrice} – ${filters.maxPrice} ETH`
        : filters.minPrice
          ? `≥ ${filters.minPrice} ETH`
          : `≤ ${filters.maxPrice} ETH`;
    chips.push({
      key: "price",
      label: lbl,
      remove: () => setFilters({ minPrice: "", maxPrice: "" }),
    });
  }

  for (const id of filters.collections) {
    chips.push({
      key: `col-${id}`,
      label: id,
      remove: () => toggleArrayItem("collections", id),
    });
  }

  for (const id of filters.categories) {
    const cat = CATEGORIES.find((c) => c.id === id);
    chips.push({
      key: `cat-${id}`,
      label: cat ? `${cat.icon} ${cat.label}` : id,
      remove: () => toggleArrayItem("categories", id),
    });
  }

  for (const id of filters.chains) {
    const ch = CHAINS.find((c) => c.id === id);
    chips.push({
      key: `chain-${id}`,
      label: ch ? `${ch.icon} ${ch.label}` : id,
      remove: () => toggleArrayItem("chains", id),
    });
  }

  if (filters.search) {
    chips.push({
      key: "search",
      label: `"${filters.search}"`,
      remove: () => setFilters({ search: "" }),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence mode="popLayout">
        {chips.map((chip) => (
          <motion.button
            key={chip.key}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={chip.remove}
            className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary transition-colors hover:bg-primary/10"
          >
            {chip.label}
            <X size={12} />
          </motion.button>
        ))}
      </AnimatePresence>

      {chips.length > 1 && (
        <button
          onClick={clearAll}
          className="text-xs text-text-muted hover:text-danger transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
