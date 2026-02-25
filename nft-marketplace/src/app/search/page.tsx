"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Image as ImageIcon,
  FolderOpen,
  User,
  ArrowUpDown,
  SlidersHorizontal,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";

interface SearchItem {
  id: string;
  type: "nft" | "collection" | "user";
  name: string;
  image?: string;
  subtitle?: string;
  extra?: string;
}

const MOCK_NFTS: SearchItem[] = Array.from({ length: 24 }, (_, i) => ({
  id: `nft-${i + 1}`,
  type: "nft" as const,
  name: `NFT Artwork #${1000 + i}`,
  subtitle: ["Abstract Dimension", "Cosmic Collection", "Pixel Art"][i % 3],
  extra: `${(Math.random() * 10 + 0.5).toFixed(2)} ETH`,
}));

const MOCK_COLLECTIONS: SearchItem[] = Array.from({ length: 9 }, (_, i) => ({
  id: `col-${i + 1}`,
  type: "collection" as const,
  name: ["Bored Ape Yacht Club", "CryptoPunks", "Art Blocks", "Azuki", "Doodles", "Moonbirds", "Clone X", "Cool Cats", "World of Women"][i],
  subtitle: `Floor: ${(Math.random() * 50 + 1).toFixed(1)} ETH`,
  extra: `${Math.floor(Math.random() * 20 + 5)}K items`,
}));

const MOCK_USERS: SearchItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: `0x${(i + 1).toString().padStart(40, "abcdef0123456789")}`,
  type: "user" as const,
  name: ["@vitalik.eth", "@punk_collector", "@nft_whale", "@crypto_artist", "@defi_guru", "@meta_builder"][i],
  subtitle: `0x${(i + 1).toString(16).padStart(4, "0")}...${(i * 1111).toString(16).padStart(4, "0")}`,
}));

const TABS = [
  { key: "all", label: "All", icon: Search },
  { key: "nfts", label: "NFTs", icon: ImageIcon },
  { key: "collections", label: "Collections", icon: FolderOpen },
  { key: "users", label: "Users", icon: User },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

const ITEMS_PER_PAGE = 12;

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";

  const [tab, setTab] = useState<TabKey>("all");
  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(1);
  const [inputValue, setInputValue] = useState(q);

  useEffect(() => {
    setInputValue(q);
    setPage(1);
  }, [q]);

  const filtered = useMemo(() => {
    const lower = q.toLowerCase();
    if (!lower) return { nfts: [], collections: [], users: [] };

    const nfts = MOCK_NFTS.filter(
      (n) => n.name.toLowerCase().includes(lower) || n.subtitle?.toLowerCase().includes(lower)
    );
    const collections = MOCK_COLLECTIONS.filter((c) =>
      c.name.toLowerCase().includes(lower)
    );
    const users = MOCK_USERS.filter(
      (u) => u.name.toLowerCase().includes(lower) || u.subtitle?.toLowerCase().includes(lower)
    );
    return { nfts, collections, users };
  }, [q]);

  const currentItems = useMemo(() => {
    let items: SearchItem[] = [];
    if (tab === "all" || tab === "nfts") items = [...items, ...filtered.nfts];
    if (tab === "all" || tab === "collections") items = [...items, ...filtered.collections];
    if (tab === "all" || tab === "users") items = [...items, ...filtered.users];
    return items;
  }, [tab, filtered]);

  const totalPages = Math.max(1, Math.ceil(currentItems.length / ITEMS_PER_PAGE));
  const paged = currentItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalCount = filtered.nfts.length + filtered.collections.length + filtered.users.length;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  }

  function getLink(item: SearchItem) {
    if (item.type === "nft") return `/nft/${item.id}`;
    if (item.type === "collection") return `/collection/${item.id}`;
    return `/profile/${item.id}`;
  }

  const TypeIcon: Record<string, typeof ImageIcon> = {
    nft: ImageIcon,
    collection: FolderOpen,
    user: User,
  };

  const typeBg: Record<string, string> = {
    nft: "rgba(139,92,246,0.1)",
    collection: "rgba(6,182,212,0.1)",
    user: "rgba(16,185,129,0.1)",
  };

  const typeColor: Record<string, string> = {
    nft: "#8B5CF6",
    collection: "#06B6D4",
    user: "#10B981",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section
        className="relative border-b border-border"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.08), transparent 60%)" }}
      >
        <div className="mx-auto max-w-5xl px-4 pt-12 pb-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-text-primary sm:text-4xl"
          >
            Search Results
          </motion.h1>
          {q && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-2 text-text-muted"
            >
              {totalCount} results for &ldquo;<span className="text-primary font-medium">{q}</span>&rdquo;
            </motion.p>
          )}

          <form onSubmit={handleSearch} className="mx-auto mt-6 max-w-xl">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-4 py-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
              <Search size={18} className="shrink-0 text-text-muted" />
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search NFTs, collections, or users..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              />
              <button
                type="submit"
                className="rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Tabs + Sort */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map((t) => {
              const active = tab === t.key;
              const Icon = t.icon;
              const count =
                t.key === "all"
                  ? totalCount
                  : t.key === "nfts"
                    ? filtered.nfts.length
                    : t.key === "collections"
                      ? filtered.collections.length
                      : filtered.users.length;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setTab(t.key);
                    setPage(1);
                  }}
                  className="relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
                  style={{
                    background: active ? "rgba(139,92,246,0.1)" : "transparent",
                    color: active ? "#A855F7" : "#9CA3AF",
                  }}
                >
                  <Icon size={14} />
                  {t.label}
                  <span
                    className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      background: active ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.05)",
                      color: active ? "#A855F7" : "#6B7280",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-text-muted" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* No query */}
        {!q && (
          <div className="flex flex-col items-center py-20 text-center">
            <Search size={48} className="mb-4 text-text-muted" />
            <p className="text-lg font-medium text-text-primary">Enter a search term</p>
            <p className="mt-1 text-sm text-text-muted">
              Search for NFTs, collections, or users
            </p>
          </div>
        )}

        {/* No results */}
        {q && totalCount === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <Search size={48} className="mb-4 text-text-muted" />
            <p className="text-lg font-medium text-text-primary">
              No results found
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Try different keywords or check for typos
            </p>
          </div>
        )}

        {/* Results grid */}
        {paged.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {paged.map((item) => {
                const Icon = TypeIcon[item.type];
                return (
                  <motion.div key={`${item.type}-${item.id}`} variants={fadeInUp} layout>
                    <Link
                      href={getLink(item)}
                      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                    >
                      <div
                        className="flex h-40 items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${typeBg[item.type]}, rgba(0,0,0,0.2))`,
                        }}
                      >
                        <Icon
                          size={40}
                          style={{ color: typeColor[item.type] }}
                          className="opacity-50 group-hover:opacity-80 transition-opacity"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                              {item.name}
                            </p>
                            {item.subtitle && (
                              <p className="mt-0.5 truncate text-xs text-text-muted">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                            style={{ background: typeBg[item.type], color: typeColor[item.type] }}
                          >
                            {item.type}
                          </span>
                        </div>
                        {item.extra && (
                          <p className="mt-2 text-sm font-medium text-text-secondary">
                            {item.extra}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="h-9 w-9 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: p === page ? "rgba(139,92,246,0.15)" : "transparent",
                  color: p === page ? "#A855F7" : "#6B7280",
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
