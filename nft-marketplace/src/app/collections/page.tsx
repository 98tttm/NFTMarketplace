"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";

export default function CollectionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2 mb-6">
        <Layers size={24} /> Bộ sưu tập
      </h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16 border border-dashed border-border rounded-2xl"
      >
        <Layers size={40} className="mx-auto text-text-muted mb-4" />
        <p className="text-text-muted mb-2">Tính năng đang phát triển</p>
        <p className="text-xs text-text-muted mb-6">
          Bộ sưu tập sẽ sớm được cập nhật. Hãy khám phá Chợ NFT!
        </p>
        <Link
          href="/"
          className="inline-flex rounded-xl px-6 py-3 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
        >
          Đến Chợ NFT
        </Link>
      </motion.div>
    </div>
  );
}
