"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Wallet, Upload, ShoppingBag } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const STEPS = [
  {
    icon: Wallet,
    number: "01",
    title: "Connect Wallet",
    description: "Link your MetaMask, WalletConnect, or Coinbase Wallet to get started in seconds.",
  },
  {
    icon: Upload,
    number: "02",
    title: "Create & Upload",
    description: "Upload your artwork, set royalties, and mint your NFT directly to the Ethereum blockchain.",
  },
  {
    icon: ShoppingBag,
    number: "03",
    title: "Sell or Collect",
    description: "List your NFTs for sale, set auctions, or browse and collect extraordinary digital art.",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">How It Works</h2>
            <p className="text-text-secondary max-w-lg mx-auto">Get started in just three simple steps and join the NFT revolution.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <motion.div
                key={step.number}
                variants={fadeInUp}
                whileHover={{ y: -6 }}
                className="relative rounded-2xl p-8 text-center transition-shadow hover:shadow-xl hover:shadow-primary/5 glassmorphism"
              >
                <div className="absolute top-6 right-6 text-5xl font-black text-primary/10">{step.number}</div>
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))" }}>
                  <step.icon size={26} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
