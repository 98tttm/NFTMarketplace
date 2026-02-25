"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Send } from "lucide-react";
import { fadeInUp } from "@/lib/animations";

export function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
      setTimeout(() => setSubmitted(false), 3000);
    }
  }

  return (
    <section ref={ref} className="py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="relative overflow-hidden rounded-3xl p-10 sm:p-16 text-center"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #3B82F6, #EC4899)" }}
        >
          {/* Decorative blurs */}
          <div className="absolute top-0 left-0 h-40 w-40 rounded-full bg-white/10 blur-[80px]" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-white/10 blur-[80px]" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Join the NFT Revolution
            </h2>
            <p className="text-white/80 max-w-md mx-auto mb-8">
              Subscribe to our newsletter for the latest drops, marketplace updates, and exclusive creator spotlights.
            </p>

            {submitted ? (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white font-semibold text-lg"
              >
                ✓ Thanks for subscribing!
              </motion.p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-6 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/40"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
                >
                  Subscribe <Send size={14} />
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
