"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

export default function RankingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2 mb-6">
        <Trophy size={24} /> Xếp hạng
      </h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16 border border-dashed border-border rounded-2xl"
      >
        <Trophy size={40} className="mx-auto text-text-muted mb-4" />
        <p className="text-text-muted mb-2">Tính năng đang phát triển</p>
        <p className="text-xs text-text-muted mb-6">
          Bảng xếp hạng sẽ sớm được cập nhật.
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
