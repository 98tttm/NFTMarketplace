"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const MOCK_CREATORS = [
  { id: 1, name: "CryptoArtist", emoji: "🎨", volume: "245.8", verified: true },
  { id: 2, name: "NeonDreamer", emoji: "🌟", volume: "189.3", verified: true },
  { id: 3, name: "PixelMaster", emoji: "👾", volume: "156.7", verified: false },
  { id: 4, name: "DigitalSoul", emoji: "🔮", volume: "134.2", verified: true },
  { id: 5, name: "ArtBlock", emoji: "🧊", volume: "112.5", verified: true },
  { id: 6, name: "VoxelKing", emoji: "🏰", volume: "98.1", verified: false },
  { id: 7, name: "WaveStudio", emoji: "🌊", volume: "87.4", verified: true },
  { id: 8, name: "MintLab", emoji: "🧪", volume: "76.9", verified: true },
];

export function FeaturedArtists() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  }

  return (
    <section ref={sectionRef} className="py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Top Creators</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => scroll("left")} className="flex h-10 w-10 items-center justify-center rounded-xl glassmorphism text-text-secondary hover:text-text-primary transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => scroll("right")} className="flex h-10 w-10 items-center justify-center rounded-xl glassmorphism text-text-secondary hover:text-text-primary transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {MOCK_CREATORS.map((c) => (
              <div
                key={c.id}
                className="min-w-[200px] snap-start flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center transition-all hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="relative mb-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-3xl">
                    {c.emoji}
                  </div>
                  {c.verified && (
                    <BadgeCheck size={18} className="absolute -bottom-0.5 -right-0.5 text-primary fill-primary stroke-background" />
                  )}
                </div>
                <h3 className="font-semibold text-text-primary text-sm">@{c.name}</h3>
                <p className="text-xs text-text-muted mt-1 mb-4">{c.volume} ETH volume</p>
                <button className="w-full rounded-xl border border-border py-2 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary">
                  Follow
                </button>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
