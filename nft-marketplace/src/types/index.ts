export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: NFTAttribute[];
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface NFTListing {
  listingId: number;
  nftContract: string;
  tokenId: number;
  seller: string;
  price: bigint;
  active: boolean;
  listedAt: number;
  metadata?: NFTMetadata;
}

export interface AuctionItem {
  auctionId: number;
  nftContract: string;
  tokenId: number;
  seller: string;
  startingPrice: bigint;
  highestBid: bigint;
  highestBidder: string;
  endTime: number;
  ended: boolean;
  cancelled: boolean;
  metadata?: NFTMetadata;
}

export interface BidHistory {
  bidder: string;
  amount: bigint;
  timestamp: number;
  txHash: string;
}

export interface UserProfile {
  address: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  totalVolume?: string;
  nftsOwned?: number;
  nftsListed?: number;
}

export interface NFTCardData {
  id: string;
  tokenId: number;
  name: string;
  image: string;
  price?: string;
  highestBid?: string;
  endTime?: number;
  creator: {
    address: string;
    username: string;
    avatar: string;
  };
  collection: {
    name: string;
    verified: boolean;
  };
  liked?: boolean;
  likeCount?: number;
}

export interface CollectionData {
  id: string;
  name: string;
  description: string;
  bannerImage: string;
  logoImage: string;
  verified: boolean;
  creator: string;
  floorPrice: string;
  totalVolume: string;
  itemCount: number;
  ownerCount: number;
}

export interface ActivityEvent {
  id: string;
  type: "sale" | "listing" | "bid" | "transfer" | "mint" | "cancel";
  nftContract: string;
  tokenId: number;
  from: string;
  to: string;
  price?: bigint;
  timestamp: number;
  txHash: string;
  metadata?: NFTMetadata;
}

export type TransactionStatus = "pending" | "confirmed" | "failed";

export interface TrackedTransaction {
  hash: string;
  description: string;
  status: TransactionStatus;
  timestamp: number;
  chainId: number;
}
