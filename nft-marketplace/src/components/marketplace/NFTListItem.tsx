"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Clock, BadgeCheck, ShoppingBag } from "lucide-react";
import type { NFTCardProps } from "@/components/nft/NFTCard";
import { fadeInUp } from "@/lib/animations";

export function NFTListItem({
  id,
  tokenId,
  name,
  image,
  price,
  highestBid,
  endTime,
  creator,
  collection,
  liked,
  likeCount = 0,
  onBuy,
  onBid,
}: NFTCardProps) {
  const displayPrice = highestBid ?? price ?? "—";

  const remaining = endTime
    ? (() => {
        const diff = endTime * 1000 - Date.now();
        if (diff <= 0) return "Ended";
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        return `${h}h ${m}m`;
      })()
    : null;

  return (
    <motion.div variants={fadeInUp}>
      <Link
        href={`/nft/${id}`}
        className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
      >
        {/* Thumbnail */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
          <Image
            src={image}
            alt={name}
            fill
            sizes="80px"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            unoptimized
          />
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold text-text-primary truncate">{name}</h3>
              <span className="text-xs text-text-muted">#{tokenId}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                {collection.name}
                {collection.verified && (
                  <BadgeCheck size={10} className="text-primary fill-primary stroke-background" />
                )}
              </span>
              <span>•</span>
              <span>@{creator.username}</span>
            </div>
          </div>

          {/* Price */}
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">
              {highestBid ? "Highest Bid" : "Price"}
            </p>
            <p className="text-sm font-bold gradient-text">{displayPrice} ETH</p>
          </div>

          {/* Timer */}
          {remaining && (
            <div className="shrink-0 flex items-center gap-1 text-xs text-danger font-medium">
              <Clock size={12} /> {remaining}
            </div>
          )}

          {/* Like */}
          <div className="shrink-0 flex items-center gap-1 text-xs text-text-muted">
            <Heart size={12} className={liked ? "fill-danger text-danger" : ""} />
            {likeCount}
          </div>

          {/* Action */}
          <div className="shrink-0">
            {onBid ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBid();
                }}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                style={{ border: "1px solid rgba(139,92,246,0.4)" }}
              >
                Bid
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBuy?.();
                }}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
              >
                <ShoppingBag size={12} /> Buy
              </button>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
