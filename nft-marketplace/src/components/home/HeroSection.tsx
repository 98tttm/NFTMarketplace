"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ArrowRight, Flame } from "lucide-react";
import { fadeInUp, staggerContainer, slideInRight } from "@/lib/animations";

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

const STATS = [
  { label: "Artworks", value: 120, suffix: "K+" },
  { label: "Artists", value: 45, suffix: "K+" },
  { label: "Users", value: 220, suffix: "K+" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 h-80 w-80 rounded-full bg-secondary/20 blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-neon-pink/10 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
                <Flame size={14} className="text-accent" /> #1 NFT Marketplace
              </span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Discover, Collect &amp; Sell{" "}
              <span className="gradient-text">Extraordinary</span>{" "}
              NFTs
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg text-text-secondary max-w-lg leading-relaxed">
              The premier marketplace for unique digital assets. Explore collections from world-class artists, musicians, and creators on Ethereum.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-xl hover:shadow-primary/20"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
              >
                Explore Marketplace <ArrowRight size={16} />
              </Link>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-all hover:bg-surface"
                style={{ border: "1px solid #1E1E2E", color: "#F9FAFB" }}
              >
                Create NFT
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex items-center gap-8 pt-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-2xl font-bold text-text-primary">
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  </span>
                  <span className="text-sm text-text-muted">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right side — Featured NFT Card */}
          <motion.div
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            className="relative hidden lg:flex items-center justify-center"
          >
            {/* Floating bg cards */}
            <div className="absolute -top-8 -left-8 h-56 w-44 rounded-2xl bg-surface border border-border rotate-[-12deg] opacity-40" style={{ perspective: "800px", transform: "rotate(-12deg) translateZ(-40px)" }} />
            <div className="absolute -bottom-8 -right-4 h-48 w-40 rounded-2xl bg-surface border border-border rotate-[8deg] opacity-30" style={{ perspective: "800px", transform: "rotate(8deg) translateZ(-60px)" }} />

            {/* Main Featured Card */}
            <motion.div
              whileHover={{ y: -8, rotateY: 4, rotateX: -2 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative w-80 rounded-3xl border border-border bg-card overflow-hidden shadow-2xl shadow-primary/10"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="aspect-square bg-gradient-to-br from-primary/30 via-secondary/20 to-neon-pink/30 flex items-center justify-center">
                <div className="text-6xl">🎨</div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">Featured Collection</span>
                  <span className="text-xs text-success">● Live</span>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-1">Abstract Dimension #42</h3>
                <p className="text-sm text-text-secondary mb-4">by @artist_xyz</p>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-xs text-text-muted">Highest Bid</p>
                    <p className="text-lg font-bold gradient-text">2.45 ETH</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">Ends in</p>
                    <p className="text-sm font-semibold text-accent">05h 23m 12s</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
