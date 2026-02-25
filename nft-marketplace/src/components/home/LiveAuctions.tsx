"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const MOCK_AUCTIONS = [
  { id: 1, name: "Cosmic Dreams #12", image: "🌌", bid: "1.25", endIn: "02h 14m", artist: "@cosmic_art" },
  { id: 2, name: "Neon Genesis #07", image: "🎆", bid: "0.85", endIn: "05h 32m", artist: "@neon_creator" },
  { id: 3, name: "Digital Oasis #31", image: "🏝️", bid: "2.10", endIn: "01h 08m", artist: "@oasis_lab" },
  { id: 4, name: "Meta World #55", image: "🌐", bid: "3.40", endIn: "08h 45m", artist: "@meta_artist" },
  { id: 5, name: "Pixel Kingdom #03", image: "👾", bid: "0.55", endIn: "12h 20m", artist: "@pixel_king" },
  { id: 6, name: "Synthwave #88", image: "🎵", bid: "1.80", endIn: "03h 50m", artist: "@synth_wave" },
];

export function LiveAuctions() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <section ref={sectionRef} className="py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Live Auctions</h2>
              <span className="flex items-center gap-1.5 text-sm text-danger font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
                </span>
                Live
              </span>
            </div>
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
            className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {MOCK_AUCTIONS.map((a) => (
              <div
                key={a.id}
                className="min-w-[260px] snap-start rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-surface to-card flex items-center justify-center text-5xl">
                  {a.image}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-text-primary truncate">{a.name}</h3>
                  <p className="text-xs text-text-muted mb-3">{a.artist}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted">Current Bid</p>
                      <p className="text-sm font-bold gradient-text">{a.bid} ETH</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-accent">
                      <Clock size={12} /> {a.endIn}
                    </div>
                  </div>
                  <button className="mt-3 w-full rounded-xl border border-primary/30 bg-primary/5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
                    Place Bid
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
