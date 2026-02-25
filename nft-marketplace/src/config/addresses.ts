export const CONTRACT_ADDRESSES = {
  NFT_COLLECTION: process.env.NEXT_PUBLIC_NFT_ADDRESS || "",
  MARKETPLACE: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || "",
  AUCTION: process.env.NEXT_PUBLIC_AUCTION_ADDRESS || "",
} as const;

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 11155111;

export const PLATFORM_FEE_PERCENT = 2.5;
