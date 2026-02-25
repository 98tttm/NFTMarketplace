import { formatEther, parseEther, type Address } from "viem";
import { CONTRACT_ADDRESSES } from "@/config/addresses";
import { NFT_COLLECTION_ABI, NFT_MARKETPLACE_ABI, NFT_AUCTION_ABI } from "@/config/abis";
import type { NFTListing, AuctionItem } from "@/types";

export const marketplaceConfig = {
  address: CONTRACT_ADDRESSES.MARKETPLACE as Address,
  abi: NFT_MARKETPLACE_ABI,
} as const;

export const nftCollectionConfig = {
  address: CONTRACT_ADDRESSES.NFT_COLLECTION as Address,
  abi: NFT_COLLECTION_ABI,
} as const;

export const auctionConfig = {
  address: CONTRACT_ADDRESSES.AUCTION as Address,
  abi: NFT_AUCTION_ABI,
} as const;

export function getNFTContractConfig(address: string) {
  return {
    address: address as Address,
    abi: NFT_COLLECTION_ABI,
  } as const;
}

export function formatNFTListing(raw: readonly [bigint, string, bigint, string, bigint, boolean, bigint]): NFTListing {
  return {
    listingId: Number(raw[0]),
    nftContract: raw[1],
    tokenId: Number(raw[2]),
    seller: raw[3],
    price: raw[4],
    active: raw[5],
    listedAt: Number(raw[6]),
  };
}

export function formatAuction(
  raw: readonly [bigint, string, bigint, string, bigint, bigint, string, bigint, boolean, boolean]
): AuctionItem {
  return {
    auctionId: Number(raw[0]),
    nftContract: raw[1],
    tokenId: Number(raw[2]),
    seller: raw[3],
    startingPrice: raw[4],
    highestBid: raw[5],
    highestBidder: raw[6],
    endTime: Number(raw[7]),
    ended: raw[8],
    cancelled: raw[9],
  };
}

export function formatPrice(wei: bigint): string {
  const eth = formatEther(wei);
  const num = parseFloat(eth);
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  return num.toFixed(4).replace(/\.?0+$/, "");
}

export function parsePrice(eth: string): bigint {
  return parseEther(eth);
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function getEtherscanUrl(hashOrAddress: string, type: "tx" | "address" = "tx"): string {
  const base = "https://sepolia.etherscan.io";
  return `${base}/${type}/${hashOrAddress}`;
}
