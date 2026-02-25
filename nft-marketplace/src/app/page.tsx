"use client";

import { useState, useMemo } from "react";
import { useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Search, ArrowRight, Tag, Gavel, Clock, Plus, ShoppingBag } from "lucide-react";
import {
  nftCollectionConfig, marketplaceConfig, auctionConfig,
  formatPrice, shortenAddress,
} from "@/lib/contracts";
import { resolveIPFS, fetchMetadataFromIPFS } from "@/lib/ipfs";
import { RealNFTGrid } from "@/components/nft/RealNFTGrid";

type Tab = "products" | "auctions";

interface RawListing {
  listingId: bigint;
  nftContract: string;
  tokenId: bigint;
  seller: string;
  price: bigint;
  active: boolean;
  listedAt: bigint;
}

interface RawAuction {
  auctionId: bigint;
  nftContract: string;
  tokenId: bigint;
  seller: string;
  startingPrice: bigint;
  highestBid: bigint;
  highestBidder: string;
  endTime: bigint;
  ended: boolean;
  cancelled: boolean;
}

export default function Home() {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("products");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: totalSupply } = useReadContract({ ...nftCollectionConfig, functionName: "totalSupply" });
  const { data: rawListings, isLoading: loadingListings } = useReadContract({ ...marketplaceConfig, functionName: "fetchMarketItems" });
  const { data: rawAuctions, isLoading: loadingAuctions } = useReadContract({ ...auctionConfig, functionName: "fetchActiveAuctions" });

  const total = totalSupply ? Number(totalSupply) : 0;
  const listings = useMemo(() => (rawListings as RawListing[] | undefined)?.filter((l) => l.active) ?? [], [rawListings]);
  const auctions = useMemo(() => (rawAuctions as RawAuction[] | undefined)?.filter((a) => !a.ended && !a.cancelled) ?? [], [rawAuctions]);
  const isLoading = loadingListings || loadingAuctions;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
      {/* Search Bar */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative w-full max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full rounded-full border border-border bg-surface/60 pl-11 pr-12 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors">
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setTab("products")}
            className="rounded-full px-5 py-2 text-sm font-medium transition-all"
            style={{
              background: tab === "products" ? "rgba(139,92,246,0.12)" : "transparent",
              color: tab === "products" ? "#F9FAFB" : "#9CA3AF",
              border: tab === "products" ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
            }}
          >
            Sản phẩm
            {listings.length > 0 && (
              <span className="ml-1.5 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{listings.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab("auctions")}
            className="rounded-full px-5 py-2 text-sm font-medium transition-all"
            style={{
              background: tab === "auctions" ? "rgba(6,182,212,0.12)" : "transparent",
              color: tab === "auctions" ? "#F9FAFB" : "#9CA3AF",
              border: tab === "auctions" ? "1px solid rgba(6,182,212,0.3)" : "1px solid transparent",
            }}
          >
            Đấu giá
            {auctions.length > 0 && (
              <span className="ml-1.5 text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded-full">{auctions.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="aspect-square bg-surface" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-surface rounded w-3/4" />
                <div className="h-3 bg-surface rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products Tab */}
      {!isLoading && tab === "products" && (
        <>
          {listings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
              {listings.map((listing) => (
                <ListingCard key={Number(listing.listingId)} listing={listing} search={searchQuery} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Tag size={40} className="text-text-muted" />}
              message="Chưa có sản phẩm nào đang bán"
              sub="Tạo NFT rồi đăng bán để bắt đầu!"
              showCreate={isConnected}
            />
          )}

          {/* All minted NFTs below */}
          {total > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-text-primary mb-4">Tất cả NFT đã tạo</h2>
              <RealNFTGrid maxItems={12} />
            </section>
          )}
        </>
      )}

      {/* Auctions Tab */}
      {!isLoading && tab === "auctions" && (
        auctions.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {auctions.map((auction) => (
              <AuctionCard key={Number(auction.auctionId)} auction={auction} search={searchQuery} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Gavel size={40} className="text-text-muted" />}
            message="Chưa có phiên đấu giá nào"
            sub="Tạo NFT và mở đấu giá ngay!"
            showCreate={isConnected}
          />
        )
      )}
    </div>
  );
}

/* ---------- Cards ---------- */

function ListingCard({ listing, search }: { listing: RawListing; search: string }) {
  const tokenId = Number(listing.tokenId);
  const { data: tokenURI } = useReadContract({ ...nftCollectionConfig, functionName: "tokenURI", args: [BigInt(tokenId)] });
  const { data: metadata } = useQuery({
    queryKey: ["listing-meta", tokenId, tokenURI],
    queryFn: () => fetchMetadataFromIPFS(tokenURI as string),
    enabled: !!tokenURI,
    staleTime: 60 * 60 * 1000,
  });

  const imageUrl = metadata?.image ? resolveIPFS(metadata.image) : "/placeholder-nft.svg";
  const name = metadata?.name || `NFT #${tokenId}`;

  if (search && !name.toLowerCase().includes(search.toLowerCase())) return null;

  return (
    <Link href={`/nft/${tokenId}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
      >
        <div className="relative aspect-square bg-surface">
          <Image src={imageUrl} alt={name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Tag size={10} className="text-primary" />
            <span className="text-[10px] font-semibold text-white">Đang bán</span>
          </div>
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1">
            <span className="text-xs font-bold text-primary">{formatPrice(listing.price)} ETH</span>
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
          <p className="text-xs text-text-muted mt-1">Người bán: {shortenAddress(listing.seller)}</p>
        </div>
      </motion.div>
    </Link>
  );
}

function AuctionCard({ auction, search }: { auction: RawAuction; search: string }) {
  const tokenId = Number(auction.tokenId);
  const { data: tokenURI } = useReadContract({ ...nftCollectionConfig, functionName: "tokenURI", args: [BigInt(tokenId)] });
  const { data: metadata } = useQuery({
    queryKey: ["auction-meta", tokenId, tokenURI],
    queryFn: () => fetchMetadataFromIPFS(tokenURI as string),
    enabled: !!tokenURI,
    staleTime: 60 * 60 * 1000,
  });

  const imageUrl = metadata?.image ? resolveIPFS(metadata.image) : "/placeholder-nft.svg";
  const name = metadata?.name || `NFT #${tokenId}`;
  const currentPrice = Number(auction.highestBid) > 0 ? auction.highestBid : auction.startingPrice;
  const endMs = Number(auction.endTime) * 1000;

  if (search && !name.toLowerCase().includes(search.toLowerCase())) return null;

  return (
    <Link href={`/nft/${tokenId}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group rounded-xl border border-border bg-card overflow-hidden hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/5 transition-all"
      >
        <div className="relative aspect-square bg-surface">
          <Image src={imageUrl} alt={name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Gavel size={10} className="text-secondary" />
            <span className="text-[10px] font-semibold text-white">Đấu giá</span>
          </div>
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1">
            <span className="text-xs font-bold text-secondary">{formatPrice(currentPrice)} ETH</span>
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
          <div className="flex items-center gap-1 mt-1">
            <Clock size={10} className="text-text-muted" />
            <MiniCountdown endTime={endMs} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function MiniCountdown({ endTime }: { endTime: number }) {
  const diff = Math.max(0, endTime - Date.now());
  if (diff === 0) return <span className="text-xs text-danger font-medium">Đã kết thúc</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return <span className="text-xs text-text-muted">{h > 0 ? `${h}h ${m}m` : `${m} phút`} còn lại</span>;
}

function EmptyState({ icon, message, sub, showCreate }: { icon: React.ReactNode; message: string; sub: string; showCreate: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 border border-dashed border-border rounded-2xl">
      <div className="mb-4 flex justify-center">{icon}</div>
      <p className="text-text-muted mb-2">{message}</p>
      <p className="text-xs text-text-muted mb-6">{sub}</p>
      {showCreate && (
        <Link href="/create" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}>
          <Plus size={16} /> Tạo NFT
        </Link>
      )}
    </motion.div>
  );
}
