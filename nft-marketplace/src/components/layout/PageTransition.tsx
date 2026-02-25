"use client";

import { motion, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

const variants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      variants={variants}
      initial="initial"
      animate="animate"
      className="flex-1"
    >
      {children}
    </motion.div>
  );
}
