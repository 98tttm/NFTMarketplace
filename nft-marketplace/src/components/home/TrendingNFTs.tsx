"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Heart } from "lucide-react";
import { fadeInUp, staggerContainer, staggerContainerFast } from "@/lib/animations";

const TABS = ["All", "Art", "Music", "Photography", "Gaming", "Sports"];

const MOCK_NFTS = [
  { id: 1, name: "Aurora Borealis", price: "1.20", cat: "Art", emoji: "🌈", creator: "@aurora_art", likes: 234 },
  { id: 2, name: "Beat Machine #4", price: "0.65", cat: "Music", emoji: "🎹", creator: "@beat_lab", likes: 189 },
  { id: 3, name: "Golden Hour", price: "2.50", cat: "Photography", emoji: "📸", creator: "@golden_lens", likes: 412 },
  { id: 4, name: "Galaxy Rider", price: "0.90", cat: "Gaming", emoji: "🚀", creator: "@galaxy_games", likes: 156 },
  { id: 5, name: "Sunset Canvas", price: "1.75", cat: "Art", emoji: "🎨", creator: "@sunset_studio", likes: 367 },
  { id: 6, name: "Vinyl Echoes", price: "0.45", cat: "Music", emoji: "🎵", creator: "@vinyl_echo", likes: 98 },
  { id: 7, name: "Mountain Peak", price: "3.10", cat: "Photography", emoji: "🏔️", creator: "@peak_photo", likes: 521 },
  { id: 8, name: "Cyber Arena #9", price: "1.05", cat: "Gaming", emoji: "🎮", creator: "@cyber_arena", likes: 273 },
];

export function TrendingNFTs() {
  const [activeTab, setActiveTab] = useState("All");
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const filtered = activeTab === "All" ? MOCK_NFTS : MOCK_NFTS.filter((n) => n.cat === activeTab);

  return (
    <section ref={ref} className="py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Trending Now</h2>
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab ? "linear-gradient(135deg, #8B5CF6, #06B6D4)" : "transparent",
                    color: activeTab === tab ? "white" : "#9CA3AF",
                    border: activeTab === tab ? "none" : "1px solid #1E1E2E",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={staggerContainerFast} initial="hidden" animate={inView ? "visible" : "hidden"} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filtered.map((nft) => (
              <motion.div
                key={nft.id}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className="group rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40"
              >
                <div className="relative aspect-square bg-gradient-to-br from-surface to-card flex items-center justify-center text-6xl">
                  {nft.emoji}
                  <button className="absolute top-3 right-3 flex items-center gap-1 rounded-full glassmorphism px-2.5 py-1 text-xs text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart size={12} /> {nft.likes}
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-text-primary truncate">{nft.name}</h3>
                  <p className="text-xs text-text-muted mb-3">{nft.creator}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted">Price</p>
                      <p className="text-sm font-bold gradient-text">{nft.price} ETH</p>
                    </div>
                    <button className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20">
                      Buy Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
