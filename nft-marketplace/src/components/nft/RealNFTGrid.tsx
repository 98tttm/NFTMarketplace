"use client";

import { useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { nftCollectionConfig } from "@/lib/contracts";
import { resolveIPFS, fetchMetadataFromIPFS } from "@/lib/ipfs";

interface RealNFTGridProps {
  maxItems?: number;
  ownerAddress?: string;
}

export function RealNFTGrid({ maxItems = 20, ownerAddress }: RealNFTGridProps) {
  const { data: totalSupply } = useReadContract({
    ...nftCollectionConfig,
    functionName: "totalSupply",
    query: { enabled: !ownerAddress },
  });

  const { data: ownedTokens } = useReadContract({
    ...nftCollectionConfig,
    functionName: "tokensByOwner",
    args: ownerAddress ? [ownerAddress as `0x${string}`] : undefined,
    query: { enabled: !!ownerAddress },
  });

  const tokenIds: number[] = [];
  if (ownerAddress && ownedTokens) {
    const ids = ownedTokens as bigint[];
    ids.forEach((id) => tokenIds.push(Number(id)));
  } else if (totalSupply) {
    const total = Number(totalSupply);
    for (let i = Math.max(0, total - maxItems); i < total; i++) {
      tokenIds.push(i);
    }
  }

  if (tokenIds.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        Chưa có NFT nào.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {tokenIds.map((tokenId) => (
        <NFTCardReal key={tokenId} tokenId={tokenId} />
      ))}
    </div>
  );
}

function NFTCardReal({ tokenId }: { tokenId: number }) {
  const { data: tokenURI } = useReadContract({
    ...nftCollectionConfig,
    functionName: "tokenURI",
    args: [BigInt(tokenId)],
  });

  const { data: owner } = useReadContract({
    ...nftCollectionConfig,
    functionName: "ownerOf",
    args: [BigInt(tokenId)],
  });

  const { data: metadata } = useQuery({
    queryKey: ["nft-meta", tokenId, tokenURI],
    queryFn: () => fetchMetadataFromIPFS(tokenURI as string),
    enabled: !!tokenURI,
    staleTime: 60 * 60 * 1000,
  });

  const imageUrl = metadata?.image ? resolveIPFS(metadata.image) : "/placeholder-nft.svg";
  const name = metadata?.name || `NFT #${tokenId}`;
  const shortOwner = owner
    ? `${(owner as string).slice(0, 6)}...${(owner as string).slice(-4)}`
    : "";

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors">
      <Link href={`/nft/${tokenId}`}>
        <div className="relative aspect-square bg-surface">
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
          <p className="text-xs text-text-muted mt-1">#{tokenId}</p>
        </div>
      </Link>
      {shortOwner && (owner as string) && (
        <div className="px-3 pb-3 -mt-1">
          <p className="text-xs text-text-muted">
            Sở hữu:{" "}
            <Link href={`/profile/${owner}`} className="text-primary hover:underline">
              {shortOwner}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
