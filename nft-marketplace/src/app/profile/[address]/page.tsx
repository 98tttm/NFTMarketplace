"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAccount, useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Copy, ExternalLink, Tag, Gavel, ImageIcon, Wallet, Check, Plus } from "lucide-react";
import {
  shortenAddress, getEtherscanUrl,
  nftCollectionConfig, marketplaceConfig, auctionConfig, formatPrice,
} from "@/lib/contracts";
import { resolveIPFS, fetchMetadataFromIPFS } from "@/lib/ipfs";
import { useWalletStatus } from "@/hooks/useWalletStatus";

type Tab = "all" | "owned" | "listings" | "auctions";

export default function ProfilePage() {
  const params = useParams();
  const profileAddress = params.address as string;
  const { address } = useAccount();
  const { balance } = useWalletStatus();
  const isOwn = address?.toLowerCase() === profileAddress?.toLowerCase();
  const [tab, setTab] = useState<Tab>("owned");
  const [copied, setCopied] = useState(false);

  const { data: totalSupply } = useReadContract({ ...nftCollectionConfig, functionName: "totalSupply" });
  const { data: ownedTokens } = useReadContract({
    ...nftCollectionConfig, functionName: "tokensByOwner",
    args: [profileAddress as `0x${string}`],
  });
  const { data: rawListings } = useReadContract({ ...marketplaceConfig, functionName: "fetchMarketItems" });
  const { data: rawAuctions } = useReadContract({ ...auctionConfig, functionName: "fetchActiveAuctions" });

  const ownedIds = (ownedTokens as bigint[] | undefined)?.map(Number) ?? [];
  const myListings = (rawListings as RawListing[] | undefined)
    ?.filter((l) => l.active && l.seller.toLowerCase() === profileAddress.toLowerCase()) ?? [];
  const myAuctions = (rawAuctions as RawAuction[] | undefined)
    ?.filter((a) => !a.ended && !a.cancelled && a.seller.toLowerCase() === profileAddress.toLowerCase()) ?? [];

  function copyAddress() {
    navigator.clipboard.writeText(profileAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "owned", label: "Đang sở hữu", count: ownedIds.length },
    { key: "listings", label: "Đang bán", count: myListings.length },
    { key: "auctions", label: "Đấu giá", count: myAuctions.length },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Banner */}
        <div className="h-36 sm:h-44 rounded-2xl relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(6,182,212,0.4))" }}>
          <div className="absolute inset-0" style={{ background: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')" }} />
        </div>

        {/* Avatar + Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-10 px-4 sm:px-6">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary shrink-0 border-4 border-background shadow-xl" />
          <div className="flex-1 min-w-0 text-center sm:text-left pb-2">
            <h1 className="text-xl font-bold text-text-primary">
              {isOwn ? "Trang cá nhân" : `Profile — ${shortenAddress(profileAddress)}`}
            </h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
              <span className="text-sm text-text-muted font-mono">{shortenAddress(profileAddress)}</span>
              <button onClick={copyAddress} className="text-text-muted hover:text-primary transition-colors">
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </button>
              <a href={getEtherscanUrl(profileAddress, "address")} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors">
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Balance Card */}
          {isOwn && (
            <div className="rounded-xl border border-border bg-card px-5 py-3 text-center shrink-0">
              <p className="text-xs text-text-muted flex items-center gap-1 justify-center"><Wallet size={12} /> Số dư trong ví</p>
              <p className="text-lg font-bold text-text-primary mt-0.5">{balance} <span className="text-xs text-text-muted">ETH</span></p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center sm:justify-start gap-6 mt-6 px-4 sm:px-6">
          <div className="text-center">
            <p className="text-lg font-bold text-text-primary">{ownedIds.length}</p>
            <p className="text-xs text-text-muted">Sở hữu</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-text-primary">{myListings.length}</p>
            <p className="text-xs text-text-muted">Đang bán</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-text-primary">{myAuctions.length}</p>
            <p className="text-xs text-text-muted">Đấu giá</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mt-8 mb-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="relative px-4 py-2.5 text-sm font-medium transition-colors"
            style={{ color: tab === t.key ? "#F9FAFB" : "#9CA3AF" }}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
            {tab === t.key && (
              <motion.div
                layoutId="profile-tab"
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                style={{ background: "linear-gradient(90deg, #8B5CF6, #06B6D4)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Owned NFTs */}
      {tab === "owned" && (
        ownedIds.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {ownedIds.map((tokenId) => (
              <OwnedNFTCard key={tokenId} tokenId={tokenId} />
            ))}
          </div>
        ) : (
          <EmptyState message="Chưa sở hữu NFT nào" isOwn={isOwn} />
        )
      )}

      {/* Listings */}
      {tab === "listings" && (
        myListings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {myListings.map((listing) => (
              <ListingCard key={Number(listing.listingId)} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState message="Chưa đăng bán NFT nào" isOwn={isOwn} />
        )
      )}

      {/* Auctions */}
      {tab === "auctions" && (
        myAuctions.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {myAuctions.map((auction) => (
              <AuctionCard key={Number(auction.auctionId)} auction={auction} />
            ))}
          </div>
        ) : (
          <EmptyState message="Chưa có phiên đấu giá nào" isOwn={isOwn} />
        )
      )}
    </div>
  );
}

/* ---------- NFT Cards ---------- */

function OwnedNFTCard({ tokenId }: { tokenId: number }) {
  const { data: tokenURI } = useReadContract({ ...nftCollectionConfig, functionName: "tokenURI", args: [BigInt(tokenId)] });
  const { data: metadata } = useQuery({
    queryKey: ["owned-nft", tokenId, tokenURI],
    queryFn: () => fetchMetadataFromIPFS(tokenURI as string),
    enabled: !!tokenURI,
    staleTime: 60 * 60 * 1000,
  });
  const imageUrl = metadata?.image ? resolveIPFS(metadata.image) : "/placeholder-nft.svg";
  const name = metadata?.name || `Sản phẩm #${tokenId + 1}`;

  return (
    <Link href={`/nft/${tokenId}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
      >
        <div className="relative aspect-square bg-surface">
          <Image src={imageUrl} alt={name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary to-secondary" />
            <span className="text-[10px] font-medium text-text-muted bg-surface rounded-full px-2 py-0.5">NFT #{tokenId}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function ListingCard({ listing }: { listing: RawListing }) {
  const tokenId = Number(listing.tokenId);
  const { data: tokenURI } = useReadContract({ ...nftCollectionConfig, functionName: "tokenURI", args: [BigInt(tokenId)] });
  const { data: metadata } = useQuery({
    queryKey: ["p-listing", tokenId, tokenURI],
    queryFn: () => fetchMetadataFromIPFS(tokenURI as string),
    enabled: !!tokenURI,
    staleTime: 60 * 60 * 1000,
  });
  const imageUrl = metadata?.image ? resolveIPFS(metadata.image) : "/placeholder-nft.svg";
  const name = metadata?.name || `NFT #${tokenId}`;

  return (
    <Link href={`/nft/${tokenId}`}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all">
        <div className="relative aspect-square bg-surface">
          <Image src={imageUrl} alt={name} fill sizes="25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
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
        </div>
      </motion.div>
    </Link>
  );
}

function AuctionCard({ auction }: { auction: RawAuction }) {
  const tokenId = Number(auction.tokenId);
  const { data: tokenURI } = useReadContract({ ...nftCollectionConfig, functionName: "tokenURI", args: [BigInt(tokenId)] });
  const { data: metadata } = useQuery({
    queryKey: ["p-auction", tokenId, tokenURI],
    queryFn: () => fetchMetadataFromIPFS(tokenURI as string),
    enabled: !!tokenURI,
    staleTime: 60 * 60 * 1000,
  });
  const imageUrl = metadata?.image ? resolveIPFS(metadata.image) : "/placeholder-nft.svg";
  const name = metadata?.name || `NFT #${tokenId}`;
  const currentPrice = Number(auction.highestBid) > 0 ? auction.highestBid : auction.startingPrice;

  return (
    <Link href={`/nft/${tokenId}`}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-secondary/50 transition-all">
        <div className="relative aspect-square bg-surface">
          <Image src={imageUrl} alt={name} fill sizes="25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
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
        </div>
      </motion.div>
    </Link>
  );
}

function EmptyState({ message, isOwn }: { message: string; isOwn: boolean }) {
  return (
    <div className="text-center py-16 border border-dashed border-border rounded-2xl">
      <ImageIcon size={40} className="mx-auto text-text-muted mb-4" />
      <p className="text-text-muted mb-4">{message}</p>
      {isOwn && (
        <Link
          href="/create"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
        >
          <Plus size={16} /> Tạo NFT
        </Link>
      )}
    </div>
  );
}

interface RawListing {
  listingId: bigint; nftContract: string; tokenId: bigint;
  seller: string; price: bigint; active: boolean; listedAt: bigint;
}
interface RawAuction {
  auctionId: bigint; nftContract: string; tokenId: bigint; seller: string;
  startingPrice: bigint; highestBid: bigint; highestBidder: string;
  endTime: bigint; ended: boolean; cancelled: boolean;
}
