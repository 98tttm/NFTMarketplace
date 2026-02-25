"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export type StatusFilter = "all" | "buy_now" | "auction" | "new" | "has_offers";
export type SortOption = "price_asc" | "price_desc" | "recent" | "liked" | "ending";
export type ViewMode = "grid" | "list";

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "buy_now", label: "Buy Now" },
  { value: "auction", label: "On Auction" },
  { value: "new", label: "New" },
  { value: "has_offers", label: "Has Offers" },
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "recent", label: "Recently Listed" },
  { value: "liked", label: "Most Liked" },
  { value: "ending", label: "Ending Soon" },
];

export const CATEGORIES = [
  { id: "art", label: "Art", icon: "🎨" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "photography", label: "Photography", icon: "📸" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "virtual_worlds", label: "Virtual Worlds", icon: "🌐" },
  { id: "utility", label: "Utility", icon: "🔧" },
] as const;

export const CHAINS = [
  { id: "ethereum", label: "Ethereum", icon: "⟠" },
  { id: "polygon", label: "Polygon", icon: "⬡" },
  { id: "solana", label: "Solana", icon: "◎" },
] as const;

export interface MarketplaceFilters {
  status: StatusFilter;
  minPrice: string;
  maxPrice: string;
  collections: string[];
  categories: string[];
  chains: string[];
  sort: SortOption;
  view: ViewMode;
  search: string;
}

const DEFAULTS: MarketplaceFilters = {
  status: "all",
  minPrice: "",
  maxPrice: "",
  collections: [],
  categories: [],
  chains: [],
  sort: "recent",
  view: "grid",
  search: "",
};

function splitParam(val: string | null): string[] {
  return val ? val.split(",").filter(Boolean) : [];
}

export function useMarketplaceFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: MarketplaceFilters = useMemo(
    () => ({
      status: (searchParams.get("status") as StatusFilter) || DEFAULTS.status,
      minPrice: searchParams.get("minPrice") || DEFAULTS.minPrice,
      maxPrice: searchParams.get("maxPrice") || DEFAULTS.maxPrice,
      collections: splitParam(searchParams.get("collections")),
      categories: splitParam(searchParams.get("categories")),
      chains: splitParam(searchParams.get("chains")),
      sort: (searchParams.get("sort") as SortOption) || DEFAULTS.sort,
      view: (searchParams.get("view") as ViewMode) || DEFAULTS.view,
      search: searchParams.get("search") || DEFAULTS.search,
    }),
    [searchParams],
  );

  const setFilters = useCallback(
    (updates: Partial<MarketplaceFilters>) => {
      const params = new URLSearchParams(searchParams.toString());
      const merged = { ...filters, ...updates };

      for (const [key, val] of Object.entries(merged)) {
        if (Array.isArray(val)) {
          val.length > 0 ? params.set(key, val.join(",")) : params.delete(key);
        } else if (val && val !== DEFAULTS[key as keyof MarketplaceFilters]) {
          params.set(key, val);
        } else {
          params.delete(key);
        }
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, filters, router, pathname],
  );

  const clearAll = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const toggleArrayItem = useCallback(
    (key: "collections" | "categories" | "chains", id: string) => {
      const current = filters[key];
      const next = current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id];
      setFilters({ [key]: next });
    },
    [filters, setFilters],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.minPrice || filters.maxPrice) count++;
    count += filters.collections.length;
    count += filters.categories.length;
    count += filters.chains.length;
    if (filters.search) count++;
    return count;
  }, [filters]);

  return { filters, setFilters, clearAll, toggleArrayItem, activeFilterCount };
}
