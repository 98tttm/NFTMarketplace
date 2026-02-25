"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Search, ChevronDown } from "lucide-react";
import {
  STATUS_OPTIONS,
  CATEGORIES,
  CHAINS,
  type MarketplaceFilters,
} from "@/hooks/useMarketplaceFilters";

const PRICE_PRESETS = [
  { label: "< 0.1 ETH", min: "", max: "0.1" },
  { label: "0.1 – 1 ETH", min: "0.1", max: "1" },
  { label: "1 – 10 ETH", min: "1", max: "10" },
  { label: "> 10 ETH", min: "10", max: "" },
];

const MOCK_COLLECTIONS = [
  { id: "bored-ape", name: "Bored Ape Club", count: 234 },
  { id: "cryptopunks", name: "CryptoPunks", count: 189 },
  { id: "azuki", name: "Azuki Dreams", count: 156 },
  { id: "doodles", name: "Doodles World", count: 98 },
  { id: "clonex", name: "CloneX Remix", count: 76 },
  { id: "moonbirds", name: "Moonbirds", count: 54 },
];

interface FilterSidebarProps {
  filters: MarketplaceFilters;
  setFilters: (u: Partial<MarketplaceFilters>) => void;
  clearAll: () => void;
  toggleArrayItem: (key: "collections" | "categories" | "chains", id: string) => void;
  open: boolean;
  onClose: () => void;
}

export function FilterSidebar({
  filters,
  setFilters,
  clearAll,
  toggleArrayItem,
  open,
  onClose,
}: FilterSidebarProps) {
  const [collectionSearch, setCollectionSearch] = useState("");
  const [localMin, setLocalMin] = useState(filters.minPrice);
  const [localMax, setLocalMax] = useState(filters.maxPrice);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    status: true,
    price: true,
    collections: true,
    categories: true,
    chains: false,
    traits: false,
  });

  const toggle = (key: string) =>
    setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const filteredCollections = MOCK_COLLECTIONS.filter((c) =>
    c.name.toLowerCase().includes(collectionSearch.toLowerCase()),
  );

  const applyPrice = () => setFilters({ minPrice: localMin, maxPrice: localMax });

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2 text-text-primary font-semibold">
          <SlidersHorizontal size={18} /> Filters
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={clearAll}
            className="text-xs text-primary hover:text-primary-dark transition-colors"
          >
            Clear All
          </button>
          <button onClick={onClose} className="lg:hidden text-text-muted hover:text-text-primary">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Scrollable filters */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* ── Status ── */}
        <FilterSection title="Status" expanded={expanded.status} toggle={() => toggle("status")}>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilters({ status: opt.value })}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background:
                    filters.status === opt.value
                      ? "linear-gradient(135deg, #8B5CF6, #06B6D4)"
                      : "transparent",
                  color: filters.status === opt.value ? "white" : "#9CA3AF",
                  border:
                    filters.status === opt.value ? "none" : "1px solid #1E1E2E",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* ── Price Range ── */}
        <FilterSection title="Price Range" expanded={expanded.price} toggle={() => toggle("price")}>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              placeholder="Min"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary"
            />
            <span className="text-text-muted text-xs shrink-0">to</span>
            <input
              type="number"
              placeholder="Max"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary"
            />
            <button
              onClick={applyPrice}
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
            >
              Apply
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setLocalMin(p.min);
                  setLocalMax(p.max);
                  setFilters({ minPrice: p.min, maxPrice: p.max });
                }}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] text-text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                {p.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* ── Collections ── */}
        <FilterSection title="Collections" expanded={expanded.collections} toggle={() => toggle("collections")}>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search collections"
              value={collectionSearch}
              onChange={(e) => setCollectionSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface pl-8 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {filteredCollections.map((c) => (
              <label
                key={c.id}
                className="flex items-center justify-between cursor-pointer rounded-lg px-2 py-1.5 transition-colors hover:bg-surface"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.collections.includes(c.id)}
                    onChange={() => toggleArrayItem("collections", c.id)}
                    className="h-3.5 w-3.5 rounded border-border bg-surface accent-primary"
                  />
                  <span className="text-xs text-text-primary">{c.name}</span>
                </div>
                <span className="text-[10px] text-text-muted">{c.count}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* ── Categories ── */}
        <FilterSection title="Categories" expanded={expanded.categories} toggle={() => toggle("categories")}>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 transition-colors hover:bg-surface"
              >
                <input
                  type="checkbox"
                  checked={filters.categories.includes(cat.id)}
                  onChange={() => toggleArrayItem("categories", cat.id)}
                  className="h-3.5 w-3.5 rounded border-border bg-surface accent-primary"
                />
                <span className="text-sm">{cat.icon}</span>
                <span className="text-xs text-text-primary">{cat.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* ── Chains ── */}
        <FilterSection title="Chains" expanded={expanded.chains} toggle={() => toggle("chains")}>
          <div className="flex flex-wrap gap-2">
            {CHAINS.map((ch) => {
              const active = filters.chains.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  onClick={() => toggleArrayItem("chains", ch.id)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                  style={{
                    background: active ? "rgba(139,92,246,0.15)" : "transparent",
                    color: active ? "#A855F7" : "#9CA3AF",
                    border: active ? "1px solid rgba(139,92,246,0.4)" : "1px solid #1E1E2E",
                  }}
                >
                  <span className="text-sm">{ch.icon}</span> {ch.label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* ── Traits / Properties (placeholder) ── */}
        <FilterSection title="Traits / Properties" expanded={expanded.traits} toggle={() => toggle("traits")}>
          <p className="text-xs text-text-muted italic">
            Select a collection to see available traits.
          </p>
        </FilterSection>
      </div>

      {/* Sticky apply button */}
      <div className="border-t border-border px-5 py-4">
        <button
          onClick={onClose}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 lg:hidden"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-20 h-[calc(100vh-5rem)] rounded-2xl border border-border bg-card overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-[300px] bg-card border-r border-border lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsible filter section                                         */
/* ------------------------------------------------------------------ */

function FilterSection({
  title,
  expanded,
  toggle,
  children,
}: {
  title: string;
  expanded: boolean;
  toggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between py-1 text-sm font-semibold text-text-primary"
      >
        {title}
        <ChevronDown
          size={16}
          className={`text-text-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
