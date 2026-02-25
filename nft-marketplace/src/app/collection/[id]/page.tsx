"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  ExternalLink,
  ChevronDown,
  LayoutGrid,
  List,
  Search,
  Globe,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

import { shortenAddress, getEtherscanUrl } from "@/lib/contracts";
import { fadeInUp, staggerContainer, staggerContainerFast } from "@/lib/animations";
import { NFTCard, NFTCardSkeleton, type NFTCardProps } from "@/components/nft/NFTCard";

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_COLLECTION = {
  id: "bored-ape",
  name: "Bored Ape Club",
  description:
    "The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs — unique digital collectibles living on the Ethereum blockchain. Your Bored Ape doubles as your Yacht Club membership card, and grants access to members-only benefits.",
  bannerImage: "",
  logoImage: "",
  verified: true,
  creator: { address: "0x1234567890abcdef1234567890abcdef12345678", username: "yuga_labs" },
  discord: "https://discord.gg/boredape",
  twitter: "https://twitter.com/BoredApeYC",
  website: "https://boredapeyachtclub.com",
  stats: {
    items: 10000,
    owners: 6400,
    floorPrice: "32.5",
    totalVolume: "1,245,890",
    volume24h: "234.5",
    listedPercent: 12,
  },
};

const MOCK_NFTS: NFTCardProps[] = Array.from({ length: 12 }, (_, i) => ({
  id: `bored-ape-${i}`,
  tokenId: i + 1,
  name: `Bored Ape #${i + 1}`,
  image: "/placeholder-nft.svg",
  price: (Math.random() * 50 + 20).toFixed(2),
  creator: { address: "0x1234", username: "yuga_labs", avatar: "" },
  collection: { name: "Bored Ape Club", verified: true },
  liked: i % 4 === 0,
  likeCount: Math.floor(Math.random() * 500),
  variant: "marketplace" as const,
}));

const MOCK_ACTIVITY = [
  { type: "sale", icon: "💰", nft: "Bored Ape #4231", price: "35.2", from: "0xabc...1234", to: "0xdef...5678", date: "2 min ago", tx: "0xabc1" },
  { type: "list", icon: "📋", nft: "Bored Ape #1892", price: "42.0", from: "0x123...abcd", to: "", date: "15 min ago", tx: "0xabc2" },
  { type: "sale", icon: "💰", nft: "Bored Ape #7744", price: "28.5", from: "0xfed...9876", to: "0x456...dcba", date: "1 hour ago", tx: "0xabc3" },
  { type: "list", icon: "📋", nft: "Bored Ape #3001", price: "55.0", from: "0x789...efgh", to: "", date: "3 hours ago", tx: "0xabc4" },
  { type: "transfer", icon: "↗️", nft: "Bored Ape #9999", price: "", from: "0xaaa...1111", to: "0xbbb...2222", date: "5 hours ago", tx: "0xabc5" },
];

const MOCK_FLOOR_HISTORY = [
  { date: "Jan", price: 28 }, { date: "Feb", price: 25 }, { date: "Mar", price: 30 },
  { date: "Apr", price: 35 }, { date: "May", price: 32 }, { date: "Jun", price: 38 },
  { date: "Jul", price: 33 }, { date: "Aug", price: 36 }, { date: "Sep", price: 31 },
  { date: "Oct", price: 34 }, { date: "Nov", price: 30 }, { date: "Dec", price: 32.5 },
];

const MOCK_VOLUME_HISTORY = [
  { date: "Jan", volume: 1200 }, { date: "Feb", volume: 980 }, { date: "Mar", volume: 1500 },
  { date: "Apr", volume: 1100 }, { date: "May", volume: 800 }, { date: "Jun", volume: 1400 },
  { date: "Jul", volume: 900 }, { date: "Aug", volume: 1300 }, { date: "Sep", volume: 1100 },
  { date: "Oct", volume: 1600 }, { date: "Nov", volume: 1000 }, { date: "Dec", volume: 1245 },
];

const MOCK_TRAITS = [
  { name: "Background", values: [{ value: "Aqua", count: 1200, pct: 12 }, { value: "Orange", count: 980, pct: 9.8 }, { value: "Purple", count: 850, pct: 8.5 }, { value: "Blue", count: 750, pct: 7.5 }] },
  { name: "Fur", values: [{ value: "Brown", count: 1500, pct: 15 }, { value: "Golden", count: 450, pct: 4.5 }, { value: "Zombie", count: 300, pct: 3 }, { value: "Robot", count: 200, pct: 2 }] },
  { name: "Eyes", values: [{ value: "Bored", count: 1700, pct: 17 }, { value: "Laser", count: 650, pct: 6.5 }, { value: "3D", count: 500, pct: 5 }, { value: "Heart", count: 350, pct: 3.5 }] },
];

const RARITY_DIST = [
  { range: "Top 1%", count: 100 }, { range: "Top 5%", count: 400 },
  { range: "Top 10%", count: 500 }, { range: "Top 25%", count: 1500 },
  { range: "Top 50%", count: 2500 }, { range: "Bottom 50%", count: 5000 },
];

const BAR_COLORS = ["#8B5CF6", "#06B6D4", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"];

type Tab = "items" | "activity" | "analytics";

const SORT_OPTIONS = [
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "recent", label: "Recently Listed" },
  { value: "liked", label: "Most Liked" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CollectionDetailPage() {
  const params = useParams();
  const _id = params.id as string;
  const col = MOCK_COLLECTION;

  const [tab, setTab] = useState<Tab>("items");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("price_asc");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [expanded, setExpanded] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("All");

  const filteredNFTs = useMemo(() => {
    let items = [...MOCK_NFTS];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((n) => n.name.toLowerCase().includes(q));
    }
    if (sort === "price_asc") items.sort((a, b) => parseFloat(a.price ?? "0") - parseFloat(b.price ?? "0"));
    if (sort === "price_desc") items.sort((a, b) => parseFloat(b.price ?? "0") - parseFloat(a.price ?? "0"));
    if (sort === "liked") items.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    return items;
  }, [search, sort]);

  return (
    <div>
      {/* ============================================================ */}
      {/*  Banner                                                       */}
      {/* ============================================================ */}
      <div className="relative h-48 sm:h-[320px] bg-gradient-to-br from-primary/20 via-surface to-secondary/20 overflow-hidden">
        {col.bannerImage && (
          <img src={col.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* ============================================================ */}
      {/*  Collection Info                                              */}
      {/* ============================================================ */}
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeInUp} className="relative -mt-14 flex flex-col sm:flex-row gap-5 pb-6 border-b border-border">
            {/* Logo */}
            <div className="h-[100px] w-[100px] shrink-0 rounded-2xl overflow-hidden bg-card" style={{ border: "4px solid #8B5CF6" }}>
              {col.logoImage ? (
                <img src={col.logoImage} alt={col.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-3xl">
                  🐵
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary">{col.name}</h1>
                {col.verified && (
                  <BadgeCheck size={22} className="text-primary fill-primary stroke-background shrink-0" />
                )}
              </div>
              <p className="text-sm text-text-muted mb-2">
                by{" "}
                <Link href={`/profile/${col.creator.address}`} className="text-primary hover:underline">
                  @{col.creator.username}
                </Link>
              </p>

              {/* Description (expandable) */}
              <p className={`text-sm text-text-secondary leading-relaxed max-w-2xl ${expanded ? "" : "line-clamp-2"}`}>
                {col.description}
              </p>
              {col.description.length > 150 && (
                <button onClick={() => setExpanded((p) => !p)} className="text-xs text-primary mt-1 hover:underline">
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}

              {/* Social links */}
              <div className="flex items-center gap-3 mt-3">
                {col.discord && (
                  <a href={col.discord} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors text-xs flex items-center gap-1">
                    Discord
                  </a>
                )}
                {col.twitter && (
                  <a href={col.twitter} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors text-xs flex items-center gap-1">
                    𝕏 Twitter
                  </a>
                )}
                {col.website && (
                  <a href={col.website} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors text-xs flex items-center gap-1">
                    <Globe size={12} /> Website
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div variants={fadeInUp} className="flex flex-wrap gap-6 py-4 border-b border-border">
            {[
              { label: "Items", value: col.stats.items.toLocaleString() },
              { label: "Owners", value: col.stats.owners.toLocaleString() },
              { label: "Floor Price", value: `${col.stats.floorPrice} ETH` },
              { label: "Total Volume", value: `${col.stats.totalVolume} ETH` },
              { label: "24h Volume", value: `${col.stats.volume24h} ETH` },
              { label: "Listed", value: `${col.stats.listedPercent}%` },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-text-primary">{s.value}</p>
                <p className="text-xs text-text-muted">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ============================================================ */}
        {/*  Tabs                                                        */}
        {/* ============================================================ */}
        <div className="flex gap-1 border-b border-border py-2 mb-6">
          {([
            { id: "items" as Tab, label: "Items", icon: LayoutGrid },
            { id: "activity" as Tab, label: "Activity", icon: List },
            { id: "analytics" as Tab, label: "Analytics", icon: BarChart3 },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: tab === t.id ? "#A855F7" : "#6B7280",
                background: tab === t.id ? "rgba(139,92,246,0.1)" : "transparent",
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* ============================================================ */}
        {/*  Tab: Items                                                   */}
        {/* ============================================================ */}
        {tab === "items" && (
          <div className="pb-12">
            {/* Filter/sort bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search in collection..."
                  className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex-1" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary transition-colors"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="flex rounded-xl border border-border overflow-hidden">
                {(["grid", "list"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className="p-2 transition-colors"
                    style={{ background: view === v ? "#8B5CF6" : "transparent", color: view === v ? "white" : "#6B7280" }}
                  >
                    {v === "grid" ? <LayoutGrid size={16} /> : <List size={16} />}
                  </button>
                ))}
              </div>
            </div>

            <motion.div
              variants={staggerContainerFast}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 justify-items-center"
            >
              {filteredNFTs.map((nft) => (
                <NFTCard key={nft.id} {...nft} />
              ))}
            </motion.div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  Tab: Activity                                                */}
        {/* ============================================================ */}
        {tab === "activity" && (
          <motion.div variants={staggerContainerFast} initial="hidden" animate="visible" className="space-y-3 pb-12">
            {MOCK_ACTIVITY.map((a, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3 text-sm"
              >
                <span className="text-lg">{a.icon}</span>
                <span className="capitalize font-medium text-text-primary w-14">{a.type}</span>
                <span className="text-primary font-medium truncate flex-1">{a.nft}</span>
                {a.price && <span className="font-bold gradient-text shrink-0">{a.price} ETH</span>}
                <span className="text-xs text-text-muted shrink-0 hidden sm:block">
                  {a.from}{a.to ? ` → ${a.to}` : ""}
                </span>
                <span className="text-xs text-text-muted shrink-0">{a.date}</span>
                <a href={getEtherscanUrl(a.tx)} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors shrink-0">
                  <ExternalLink size={12} />
                </a>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ============================================================ */}
        {/*  Tab: Analytics                                               */}
        {/* ============================================================ */}
        {tab === "analytics" && (
          <div className="space-y-8 pb-12">
            {/* Trait distribution */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-bold text-text-primary mb-5">Trait Distribution</h3>
              <div className="space-y-6">
                {MOCK_TRAITS.map((trait) => (
                  <div key={trait.name}>
                    <p className="text-xs font-semibold text-text-secondary mb-2">{trait.name}</p>
                    <div className="space-y-1.5">
                      {trait.values.map((v) => (
                        <div key={v.value} className="flex items-center gap-3">
                          <span className="text-xs text-text-primary w-20 truncate">{v.value}</span>
                          <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${v.pct}%`, background: "linear-gradient(90deg, #8B5CF6, #06B6D4)" }}
                            />
                          </div>
                          <span className="text-[10px] text-text-muted w-10 text-right">{v.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floor price chart */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-text-primary">Floor Price History</h3>
                <div className="flex gap-1">
                  {["7D", "30D", "3M", "All"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setChartPeriod(p)}
                      className="rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors"
                      style={{
                        background: chartPeriod === p ? "rgba(139,92,246,0.15)" : "transparent",
                        color: chartPeriod === p ? "#A855F7" : "#6B7280",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_FLOOR_HISTORY}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
                    <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ background: "#13131A", border: "1px solid #1E1E2E", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "#9CA3AF" }} />
                    <Line type="monotone" dataKey="price" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: "#8B5CF6", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#A855F7", strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales volume bar chart */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-bold text-text-primary mb-4">Sales Volume</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_VOLUME_HISTORY}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
                    <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={{ background: "#13131A", border: "1px solid #1E1E2E", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "#9CA3AF" }} />
                    <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                      {MOCK_VOLUME_HISTORY.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Rarity distribution */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-bold text-text-primary mb-4">Rarity Distribution</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={RARITY_DIST} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
                    <XAxis type="number" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="range" type="category" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip contentStyle={{ background: "#13131A", border: "1px solid #1E1E2E", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "#9CA3AF" }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {RARITY_DIST.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
