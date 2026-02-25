"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { fadeInUp, staggerContainer, staggerContainerFast } from "@/lib/animations";

const TIME_FILTERS = ["24h", "7d", "30d"];

const MOCK_COLLECTIONS = [
  { rank: 1, name: "Bored Ape Club", emoji: "🐵", floor: "32.5", volume: "1,245", change: 12.4 },
  { rank: 2, name: "CryptoPunks OG", emoji: "👾", floor: "28.2", volume: "987", change: -3.2 },
  { rank: 3, name: "Azuki Dreams", emoji: "🌸", floor: "15.8", volume: "756", change: 8.7 },
  { rank: 4, name: "Doodles World", emoji: "🎨", floor: "8.4", volume: "543", change: -1.5 },
  { rank: 5, name: "CloneX Remix", emoji: "🧬", floor: "6.2", volume: "432", change: 22.1 },
  { rank: 6, name: "Moonbirds Nest", emoji: "🦉", floor: "5.1", volume: "321", change: 5.6 },
  { rank: 7, name: "World of Women", emoji: "👩‍🎨", floor: "4.3", volume: "289", change: -8.3 },
  { rank: 8, name: "Cool Cats Gang", emoji: "😺", floor: "3.8", volume: "198", change: 3.2 },
  { rank: 9, name: "Pudgy Penguins", emoji: "🐧", floor: "3.2", volume: "167", change: 15.8 },
  { rank: 10, name: "Art Blocks Curated", emoji: "🖼️", floor: "2.9", volume: "145", change: -2.1 },
];

export function TopCollections() {
  const [period, setPeriod] = useState("7d");
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Top Collections</h2>
            <div className="flex rounded-xl border border-border overflow-hidden">
              {TIME_FILTERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setPeriod(t)}
                  className="px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    background: period === t ? "#8B5CF6" : "transparent",
                    color: period === t ? "white" : "#9CA3AF",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={staggerContainerFast} initial="hidden" animate={inView ? "visible" : "hidden"} className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 text-xs uppercase tracking-wider text-text-muted border-b border-border">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Collection</div>
              <div className="col-span-2 text-right">Floor Price</div>
              <div className="col-span-3 text-right">Volume</div>
              <div className="col-span-2 text-right">Change</div>
            </div>

            {MOCK_COLLECTIONS.map((c) => (
              <motion.div
                key={c.rank}
                variants={fadeInUp}
                className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-border/50 last:border-0 transition-colors hover:bg-surface/50 cursor-pointer"
              >
                <div className="col-span-1">
                  <span className={`text-sm font-bold ${c.rank <= 3 ? "text-accent" : "text-text-muted"}`}>
                    {c.rank}
                  </span>
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-xl">
                    {c.emoji}
                  </div>
                  <span className="font-semibold text-text-primary text-sm truncate">{c.name}</span>
                </div>
                <div className="col-span-2 text-right text-sm font-medium text-text-primary">
                  {c.floor} ETH
                </div>
                <div className="col-span-3 text-right text-sm text-text-secondary">
                  {c.volume} ETH
                </div>
                <div className="col-span-2 text-right">
                  <span className={`inline-flex items-center gap-1 text-sm font-medium ${c.change >= 0 ? "text-success" : "text-danger"}`}>
                    {c.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {c.change >= 0 ? "+" : ""}{c.change}%
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
