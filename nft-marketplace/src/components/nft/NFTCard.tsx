"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Eye, Clock, BadgeCheck, ShoppingBag, ArrowRightLeft, Tag } from "lucide-react";
import { fadeInUp } from "@/lib/animations";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface NFTCardProps {
  id: string;
  tokenId: number;
  name: string;
  image: string;
  price?: string;
  highestBid?: string;
  endTime?: number;
  creator: { address: string; username: string; avatar: string };
  collection: { name: string; verified: boolean };
  liked?: boolean;
  likeCount?: number;
  variant?: "marketplace" | "profile" | "auction" | "minimal";
  onBuy?: () => void;
  onBid?: () => void;
  onLike?: () => void;
  onQuickView?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Countdown Hook (local)                                             */
/* ------------------------------------------------------------------ */

function useCountdown(endTimestamp?: number) {
  const getRemaining = useCallback(() => {
    if (!endTimestamp) return { h: 0, m: 0, s: 0, expired: true };
    const diff = endTimestamp * 1000 - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
    return {
      h: Math.floor(diff / 3_600_000),
      m: Math.floor((diff % 3_600_000) / 60_000),
      s: Math.floor((diff % 60_000) / 1_000),
      expired: false,
    };
  }, [endTimestamp]);

  const [time, setTime] = useState(getRemaining);

  useEffect(() => {
    if (!endTimestamp) return;
    const id = setInterval(() => setTime(getRemaining()), 1_000);
    return () => clearInterval(id);
  }, [endTimestamp, getRemaining]);

  return time;
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

export function NFTCardSkeleton() {
  return (
    <div
      className="w-[280px] animate-pulse rounded-2xl border border-border bg-card overflow-hidden"
      style={{ boxShadow: "0 4px 24px rgba(139, 92, 246, 0.1)" }}
    >
      <div className="aspect-square bg-surface" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-surface" />
          <div className="h-4 w-10 rounded bg-surface" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-surface" />
          <div className="h-3 w-24 rounded bg-surface" />
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-3 w-16 rounded bg-surface" />
            <div className="h-5 w-20 rounded bg-surface" />
          </div>
          <div className="h-3 w-20 rounded bg-surface" />
        </div>
        <div className="h-10 w-full rounded-xl bg-surface" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Card                                                               */
/* ------------------------------------------------------------------ */

export function NFTCard({
  id,
  tokenId,
  name,
  image,
  price,
  highestBid,
  endTime,
  creator,
  collection,
  liked = false,
  likeCount = 0,
  variant = "marketplace",
  onBuy,
  onBid,
  onLike,
  onQuickView,
}: NFTCardProps) {
  const [isLiked, setIsLiked] = useState(liked);
  const [likes, setLikes] = useState(likeCount);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const countdown = useCountdown(endTime);

  const handleLike = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsLiked((prev) => !prev);
      setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
      onLike?.();
    },
    [isLiked, onLike],
  );

  const handleQuickView = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onQuickView?.();
    },
    [onQuickView],
  );

  const handleActionClick = useCallback(
    (e: React.MouseEvent, action?: () => void) => {
      e.preventDefault();
      e.stopPropagation();
      action?.();
    },
    [],
  );

  const displayPrice = useMemo(() => {
    if (variant === "auction" && highestBid) return highestBid;
    return price ?? "—";
  }, [variant, highestBid, price]);

  const priceLabel = useMemo(() => {
    if (variant === "auction") return "Current Bid";
    if (highestBid) return "Highest Bid";
    return "Price";
  }, [variant, highestBid]);

  const isMinimal = variant === "minimal";

  return (
    <motion.div
      variants={fadeInUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-[280px] shrink-0"
    >
      <Link href={`/nft/${id}`} className="block">
        <motion.div
          whileHover={{ y: -8 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="relative rounded-2xl border bg-card overflow-hidden transition-[border-color,box-shadow] duration-300"
          style={{
            borderColor: hovered ? "#A855F7" : "#1E1E2E",
            boxShadow: hovered
              ? "0 20px 60px rgba(139, 92, 246, 0.3)"
              : "0 4px 24px rgba(139, 92, 246, 0.1)",
          }}
        >
          {/* ---- Image Container ---- */}
          <div className="relative aspect-square overflow-hidden">
            {/* Skeleton shimmer while loading */}
            {!imgLoaded && (
              <div className="absolute inset-0 bg-surface animate-pulse" />
            )}

            <Image
              src={image}
              alt={name}
              fill
              sizes="280px"
              className={`object-cover transition-transform duration-500 ${hovered ? "scale-110" : "scale-100"} ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
              unoptimized
            />

            {/* Top-left: Collection badge */}
            {!isMinimal && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-text-primary glassmorphism">
                {collection.name}
                {collection.verified && (
                  <BadgeCheck size={12} className="text-primary fill-primary stroke-background" />
                )}
              </div>
            )}

            {/* Top-right: Like button */}
            {!isMinimal && (
              <button
                onClick={handleLike}
                className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs glassmorphism transition-colors"
              >
                <motion.span
                  key={String(isLiked)}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 12 }}
                >
                  <Heart
                    size={14}
                    className={isLiked ? "fill-danger text-danger" : "text-text-secondary"}
                  />
                </motion.span>
                <span className={isLiked ? "text-danger" : "text-text-secondary"}>{likes}</span>
              </button>
            )}

            {/* Hover overlay — Quick View */}
            {!isMinimal && (
              <AnimatePresence>
                {hovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-black/40"
                  >
                    <motion.button
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 10, opacity: 0 }}
                      transition={{ delay: 0.05 }}
                      onClick={handleQuickView}
                      className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white glassmorphism hover:bg-white/10 transition-colors"
                    >
                      <Eye size={16} /> Quick View
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* ---- Card Body ---- */}
          <div className="p-4">
            {/* Row 1 — Title + Token ID */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-sm font-bold text-text-primary truncate">{name}</h3>
              <span className="shrink-0 text-xs text-text-muted">#{tokenId}</span>
            </div>

            {/* Minimal variant stops here */}
            {isMinimal ? (
              <div className="mt-2">
                <p className="text-sm font-bold gradient-text">{displayPrice} ETH</p>
              </div>
            ) : (
              <>
                {/* Row 2 — Creator */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-surface">
                    {creator.avatar ? (
                      <Image
                        src={creator.avatar}
                        alt={creator.username}
                        fill
                        sizes="20px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/40" />
                    )}
                  </div>
                  <span className="text-xs text-text-muted truncate">
                    by{" "}
                    <span className="text-text-secondary hover:text-primary transition-colors">
                      @{creator.username}
                    </span>
                  </span>
                </div>

                {/* Divider */}
                <div className="h-px bg-border mb-3" />

                {/* Row 3 — Price / Countdown */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">
                      {priceLabel}
                    </p>
                    <p className="text-base font-bold gradient-text">{displayPrice} ETH</p>
                  </div>

                  {endTime && !countdown.expired && (
                    <div className="flex items-center gap-1 text-xs text-danger font-medium">
                      <Clock size={12} />
                      <span>
                        {String(countdown.h).padStart(2, "0")}h{" "}
                        {String(countdown.m).padStart(2, "0")}m{" "}
                        {String(countdown.s).padStart(2, "0")}s
                      </span>
                    </div>
                  )}

                  {endTime && countdown.expired && (
                    <span className="text-xs text-text-muted">Ended</span>
                  )}
                </div>

                {/* Row 4 — Action Buttons */}
                <ActionButtons
                  variant={variant}
                  onBuy={onBuy}
                  onBid={onBid}
                  onClick={handleActionClick}
                />
              </>
            )}
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Action Buttons                                                     */
/* ------------------------------------------------------------------ */

function ActionButtons({
  variant,
  onBuy,
  onBid,
  onClick,
}: {
  variant: NFTCardProps["variant"];
  onBuy?: () => void;
  onBid?: () => void;
  onClick: (e: React.MouseEvent, action?: () => void) => void;
}) {
  switch (variant) {
    case "marketplace":
      return (
        <div className="flex gap-2">
          {onBuy && (
            <button
              onClick={(e) => onClick(e, onBuy)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
            >
              <ShoppingBag size={14} /> Buy Now
            </button>
          )}
          {onBid && (
            <button
              onClick={(e) => onClick(e, onBid)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
              style={{ border: "1px solid rgba(139,92,246,0.4)" }}
            >
              Place Bid
            </button>
          )}
          {!onBuy && !onBid && (
            <button
              className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
            >
              <ShoppingBag size={14} /> Buy Now
            </button>
          )}
        </div>
      );

    case "profile":
      return (
        <div className="flex gap-2">
          <button
            onClick={(e) => onClick(e, onBuy)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
          >
            <Tag size={14} /> List for Sale
          </button>
          <button
            onClick={(e) => onClick(e, onBid)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary hover:bg-surface"
            style={{ border: "1px solid #1E1E2E" }}
          >
            <ArrowRightLeft size={14} /> Transfer
          </button>
        </div>
      );

    case "auction":
      return (
        <button
          onClick={(e) => onClick(e, onBid)}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
          style={{ border: "1px solid rgba(139,92,246,0.4)" }}
        >
          Place Bid
        </button>
      );

    default:
      return null;
  }
}
