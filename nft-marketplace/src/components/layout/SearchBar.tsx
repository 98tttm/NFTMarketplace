"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ArrowRight,
  Image as ImageIcon,
  FolderOpen,
  User,
  TrendingUp,
  Clock,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export interface SearchResult {
  id: string;
  type: "nft" | "collection" | "user";
  name: string;
  image?: string;
  subtitle?: string;
  extra?: string;
}

interface GroupedResults {
  nfts: SearchResult[];
  collections: SearchResult[];
  users: SearchResult[];
}

const TRENDING_SEARCHES = ["Bored Ape", "CryptoPunks", "Art Blocks", "Azuki", "Doodles"];

const MOCK_NFT_POOL: SearchResult[] = [
  { id: "1", type: "nft", name: "Bored Ape #1234", subtitle: "Bored Ape Yacht Club", extra: "32.5 ETH" },
  { id: "2", type: "nft", name: "CryptoPunk #456", subtitle: "CryptoPunks", extra: "Listed" },
  { id: "3", type: "nft", name: "Art Blocks Fidenza #78", subtitle: "Art Blocks Curated", extra: "12 ETH" },
  { id: "4", type: "nft", name: "Azuki #9012", subtitle: "Azuki", extra: "8.2 ETH" },
  { id: "5", type: "nft", name: "Doodle #3456", subtitle: "Doodles", extra: "5.4 ETH" },
  { id: "6", type: "nft", name: "Abstract Dimension #42", subtitle: "Abstract Dimension", extra: "2.45 ETH" },
  { id: "7", type: "nft", name: "Moonbird #789", subtitle: "Moonbirds", extra: "4.1 ETH" },
  { id: "8", type: "nft", name: "Clone X #5555", subtitle: "Clone X", extra: "3.8 ETH" },
];

const MOCK_COLLECTION_POOL: SearchResult[] = [
  { id: "bayc", type: "collection", name: "Bored Ape Yacht Club", subtitle: "Floor: 30 ETH", extra: "10K items" },
  { id: "punks", type: "collection", name: "CryptoPunks", subtitle: "Floor: 48 ETH", extra: "10K items" },
  { id: "artblocks", type: "collection", name: "Art Blocks Curated", subtitle: "Floor: 1.2 ETH", extra: "25K items" },
  { id: "azuki", type: "collection", name: "Azuki", subtitle: "Floor: 6.5 ETH", extra: "10K items" },
  { id: "doodles", type: "collection", name: "Doodles", subtitle: "Floor: 3.2 ETH", extra: "10K items" },
];

const MOCK_USER_POOL: SearchResult[] = [
  { id: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045", type: "user", name: "@vitalik.eth", subtitle: "0xd8dA...6045" },
  { id: "0x1234567890abcdef1234567890abcdef12345678", type: "user", name: "@cosmic_art", subtitle: "0x1234...5678" },
  { id: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", type: "user", name: "@nft_whale", subtitle: "0xabcd...abcd" },
];

const RECENT_KEY = "nft-marketplace-recent-searches";

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, 5);
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  const list = getRecent().filter((s) => s !== q);
  list.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
}

function mockSearch(q: string): GroupedResults {
  const lower = q.toLowerCase();
  return {
    nfts: MOCK_NFT_POOL.filter(
      (r) => r.name.toLowerCase().includes(lower) || r.subtitle?.toLowerCase().includes(lower)
    ).slice(0, 5),
    collections: MOCK_COLLECTION_POOL.filter(
      (r) => r.name.toLowerCase().includes(lower)
    ).slice(0, 3),
    users: MOCK_USER_POOL.filter(
      (r) => r.name.toLowerCase().includes(lower) || r.subtitle?.toLowerCase().includes(lower)
    ).slice(0, 3),
  };
}

const TYPE_ICON: Record<string, typeof ImageIcon> = {
  nft: ImageIcon,
  collection: FolderOpen,
  user: User,
};

const TYPE_LABEL: Record<string, string> = {
  nft: "NFTs",
  collection: "Collections",
  user: "Users",
};

export function SearchBar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-2 text-sm text-text-muted transition-all hover:border-primary/40 hover:text-text-secondary"
        style={{ minWidth: 180 }}
      >
        <Search size={15} className="shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-mono">
          ⌘K
        </kbd>
      </button>

      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [grouped, setGrouped] = useState<GroupedResults>({ nfts: [], collections: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRecentSearches(getRecent());
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const flatResults = useMemo(
    () => [...grouped.nfts, ...grouped.collections, ...grouped.users],
    [grouped]
  );

  const doSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setGrouped({ nfts: [], collections: [], users: [] });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setGrouped(mockSearch(q));
      setLoading(false);
    }, 150);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function goToResult(r: SearchResult) {
    saveRecent(r.name);
    onClose();
    if (r.type === "nft") router.push(`/nft/${r.id}`);
    else if (r.type === "collection") router.push(`/collection/${r.id}`);
    else if (r.type === "user") router.push(`/profile/${r.id}`);
  }

  function goToSearch(q: string) {
    if (!q.trim()) return;
    saveRecent(q);
    onClose();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && flatResults[activeIndex]) {
        goToResult(flatResults[activeIndex]);
      } else {
        goToSearch(query);
      }
    }
  }

  const hasResults = flatResults.length > 0;
  const showEmpty = !loading && !hasResults && query.trim().length > 0;
  const showIdle = !query.trim();

  if (!mounted) return null;

  const modal = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[10vh] sm:pt-[15vh] px-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-primary/10"
        >
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <Search size={20} className="shrink-0 text-primary" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search NFTs, collections, or users..."
              className="flex-1 bg-transparent text-base text-text-primary placeholder:text-text-muted outline-none"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setGrouped({ nfts: [], collections: [], users: [] });
                }}
                className="rounded-lg p-1 text-text-muted hover:text-text-primary"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-2 py-1 text-xs text-text-muted hover:text-text-primary"
            >
              ESC
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
            {/* Loading */}
            {loading && (
              <div className="px-5 py-8">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="h-10 w-10 rounded-xl bg-surface" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-32 rounded bg-surface" />
                        <div className="h-3 w-20 rounded bg-surface" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Idle — show recent + trending */}
            {showIdle && !loading && (
              <div className="px-5 py-4 space-y-5">
                {recentSearches.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Recent Searches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setQuery(s);
                            setActiveIndex(-1);
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface/50 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-primary/40 hover:text-text-primary"
                        >
                          <Clock size={12} /> {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Trending Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setQuery(s);
                          setActiveIndex(-1);
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface/50 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-primary/40 hover:text-text-primary"
                      >
                        <TrendingUp size={12} className="text-primary" /> {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No results */}
            {showEmpty && (
              <div className="flex flex-col items-center py-12 text-center">
                <Search size={32} className="mb-3 text-text-muted" />
                <p className="text-sm font-medium text-text-primary">
                  No results for &ldquo;{query}&rdquo;
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Try different keywords or check for typos
                </p>
              </div>
            )}

            {/* Grouped results */}
            {!loading && hasResults && (
              <div className="py-2">
                {(["nfts", "collections", "users"] as const).map((group) => {
                  const items = grouped[group];
                  if (items.length === 0) return null;
                  const typeKey = items[0].type;
                  const Icon = TYPE_ICON[typeKey];
                  return (
                    <div key={group} className="mb-1">
                      <div className="flex items-center gap-2 px-5 py-2">
                        <Icon size={14} className="text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                          {TYPE_LABEL[typeKey]} ({items.length})
                        </span>
                      </div>
                      {items.map((r) => {
                        const globalIdx = flatResults.indexOf(r);
                        const isActive = globalIdx === activeIndex;
                        return (
                          <button
                            key={`${r.type}-${r.id}`}
                            onClick={() => goToResult(r)}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                            className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors"
                            style={{
                              background: isActive ? "rgba(139,92,246,0.08)" : "transparent",
                            }}
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-text-muted overflow-hidden">
                              {r.image ? (
                                <img
                                  src={r.image}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Icon size={18} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-text-primary">
                                {r.name}
                              </p>
                              {r.subtitle && (
                                <p className="truncate text-xs text-text-muted">
                                  {r.subtitle}
                                </p>
                              )}
                            </div>
                            {r.extra && (
                              <span className="shrink-0 text-xs font-medium text-text-secondary">
                                {r.extra}
                              </span>
                            )}
                            {isActive && (
                              <CornerDownLeft
                                size={14}
                                className="shrink-0 text-primary"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <ArrowUp size={12} />
                <ArrowDown size={12} />
                navigate
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft size={12} />
                select
              </span>
              <span className="flex items-center gap-1">
                <span className="rounded border border-border px-1 text-[10px]">esc</span>
                close
              </span>
            </div>
            {query.trim() && (
              <button
                onClick={() => goToSearch(query)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all results <ArrowRight size={12} />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
