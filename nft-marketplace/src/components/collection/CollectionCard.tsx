"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { fadeInUp } from "@/lib/animations";

export interface CollectionCardProps {
  id: string;
  name: string;
  bannerImage: string;
  logoImage: string;
  verified: boolean;
  previewImages: string[];
  floorPrice: string;
  totalVolume: string;
  itemCount: number;
  ownerCount: number;
}

export function CollectionCard({
  id,
  name,
  bannerImage,
  logoImage,
  verified,
  previewImages,
  floorPrice,
  totalVolume,
  itemCount,
  ownerCount,
}: CollectionCardProps) {
  return (
    <motion.div variants={fadeInUp}>
      <Link href={`/collection/${id}`} className="block group">
        <div className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
          {/* Banner */}
          <div className="relative h-[150px] bg-gradient-to-br from-primary/20 via-surface to-secondary/20 overflow-hidden">
            {bannerImage && (
              <img src={bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            )}

            {/* 3 preview NFTs */}
            <div className="absolute bottom-3 left-3 flex -space-x-3">
              {previewImages.slice(0, 3).map((src, i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-lg border-2 border-card bg-surface overflow-hidden"
                  style={{ zIndex: 3 - i }}
                >
                  {src ? (
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Logo + Info */}
          <div className="relative px-4 pb-4">
            {/* Avatar overlapping banner */}
            <div className="relative -mt-7 mb-3">
              <div className="h-[60px] w-[60px] rounded-full overflow-hidden bg-card" style={{ border: "3px solid #8B5CF6" }}>
                {logoImage ? (
                  <img src={logoImage} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-xl">
                    🖼️
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="flex items-center gap-1.5 mb-3">
              <h3 className="text-sm font-bold text-text-primary truncate">{name}</h3>
              {verified && (
                <BadgeCheck size={14} className="shrink-0 text-primary fill-primary stroke-background" />
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: "Floor", value: `${floorPrice} ETH` },
                { label: "Volume", value: `${totalVolume} ETH` },
                { label: "Items", value: itemCount.toLocaleString() },
                { label: "Owners", value: ownerCount.toLocaleString() },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xs font-semibold text-text-primary truncate">{s.value}</p>
                  <p className="text-[10px] text-text-muted">{s.label}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button className="w-full rounded-xl border border-border py-2 text-xs font-medium text-text-secondary transition-all group-hover:border-primary group-hover:text-primary group-hover:bg-primary/5">
              View Collection
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CollectionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="h-[150px] bg-surface" />
      <div className="px-4 pb-4">
        <div className="relative -mt-7 mb-3">
          <div className="h-[60px] w-[60px] rounded-full bg-surface border-3 border-card" />
        </div>
        <div className="h-4 w-32 rounded bg-surface mb-3" />
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <div className="h-3 w-full rounded bg-surface" />
              <div className="h-2 w-8 mx-auto rounded bg-surface" />
            </div>
          ))}
        </div>
        <div className="h-8 rounded-xl bg-surface" />
      </div>
    </div>
  );
}
