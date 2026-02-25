"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";
import { fadeInUp } from "@/lib/animations";

interface ScrollRevealProps {
  children: ReactNode;
  variants?: Variants;
  className?: string;
  /** Fraction of element visible to trigger. Default 0.15 */
  threshold?: number;
  /** Only animate once. Default true */
  once?: boolean;
}

export function ScrollReveal({
  children,
  variants = fadeInUp,
  className = "",
  threshold = 0.15,
  once = true,
}: ScrollRevealProps) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
