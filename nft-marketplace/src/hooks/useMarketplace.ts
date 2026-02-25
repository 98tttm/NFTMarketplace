"use client";

import { useState, useCallback } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { config } from "@/config/wagmi";
import { type Address, parseEther } from "viem";
import { marketplaceConfig, getNFTContractConfig } from "@/lib/contracts";
import { txPending, txSuccess, txError, parseTxError } from "@/lib/toast";
import type { NFTListing } from "@/types";

interface RawListing {
  listingId: bigint;
  nftContract: string;
  tokenId: bigint;
  seller: string;
  price: bigint;
  active: boolean;
  listedAt: bigint;
}

function rawToListing(r: RawListing): NFTListing {
  return {
    listingId: Number(r.listingId),
    nftContract: r.nftContract,
    tokenId: Number(r.tokenId),
    seller: r.seller,
    price: r.price,
    active: r.active,
    listedAt: Number(r.listedAt),
  };
}

export function useListedNFTs() {
  const result = useReadContract({
    ...marketplaceConfig,
    functionName: "fetchMarketItems",
    query: { staleTime: 30_000 },
  });

  const listings: NFTListing[] = result.data
    ? (result.data as unknown as RawListing[]).map(rawToListing)
    : [];

  return {
    listings,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useUserListings(address?: string) {
  const result = useReadContract({
    ...marketplaceConfig,
    functionName: "fetchListingsByOwner",
    args: address ? [address as Address] : undefined,
    query: { enabled: !!address, staleTime: 30_000 },
  });

  const listings: NFTListing[] = result.data
    ? (result.data as unknown as RawListing[]).map(rawToListing)
    : [];

  return {
    listings,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useListNFT() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<string>();
  const [isListing, setIsListing] = useState(false);

  const listNFT = useCallback(
    async (nftContract: string, tokenId: number, priceEth: string) => {
      if (!address) throw new Error("Wallet not connected");

      try {
        setIsListing(true);

        const approveHash = await writeContractAsync({
          ...getNFTContractConfig(nftContract),
          functionName: "approve",
          args: [marketplaceConfig.address, BigInt(tokenId)],
        });
        txPending(approveHash, "Approving marketplace...");

        await waitForTransactionReceipt(config, { hash: approveHash });

        const listHash = await writeContractAsync({
          ...marketplaceConfig,
          functionName: "listNFT",
          args: [nftContract as Address, BigInt(tokenId), parseEther(priceEth)],
        });

        txSuccess(approveHash, "Marketplace approved!");
        setTxHash(listHash);
        txPending(listHash, "Listing NFT...");

        return listHash;
      } catch (err) {
        const msg = parseTxError(err);
        txError("list-error", msg);
        throw err;
      } finally {
        setIsListing(false);
      }
    },
    [address, writeContractAsync]
  );

  const receipt = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  if (receipt.isSuccess && txHash) {
    txSuccess(txHash, "NFT listed successfully!");
  }

  return { listNFT, txHash, isListing, isConfirmed: receipt.isSuccess };
}

export function useBuyNFT() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<string>();
  const [isBuying, setIsBuying] = useState(false);

  const buyNFT = useCallback(
    async (listingId: number, priceWei: bigint) => {
      try {
        setIsBuying(true);
        const hash = await writeContractAsync({
          ...marketplaceConfig,
          functionName: "buyNFT",
          args: [BigInt(listingId)],
          value: priceWei,
        });

        setTxHash(hash);
        txPending(hash, "Purchasing NFT...");
        return hash;
      } catch (err) {
        const msg = parseTxError(err);
        txError("buy-error", msg);
        throw err;
      } finally {
        setIsBuying(false);
      }
    },
    [writeContractAsync]
  );

  const receipt = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  if (receipt.isSuccess && txHash) {
    txSuccess(txHash, "NFT purchased!");
  }

  return { buyNFT, txHash, isBuying, isConfirmed: receipt.isSuccess };
}

export function useCancelListing() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<string>();

  const cancelListing = useCallback(
    async (listingId: number) => {
      try {
        const hash = await writeContractAsync({
          ...marketplaceConfig,
          functionName: "cancelListing",
          args: [BigInt(listingId)],
        });

        setTxHash(hash);
        txPending(hash, "Cancelling listing...");
        return hash;
      } catch (err) {
        const msg = parseTxError(err);
        txError("cancel-error", msg);
        throw err;
      }
    },
    [writeContractAsync]
  );

  const receipt = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  if (receipt.isSuccess && txHash) {
    txSuccess(txHash, "Listing cancelled!");
  }

  return { cancelListing, txHash, isConfirmed: receipt.isSuccess };
}

export function useUpdatePrice() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<string>();

  const updatePrice = useCallback(
    async (listingId: number, newPriceEth: string) => {
      try {
        const hash = await writeContractAsync({
          ...marketplaceConfig,
          functionName: "updatePrice",
          args: [BigInt(listingId), parseEther(newPriceEth)],
        });

        setTxHash(hash);
        txPending(hash, "Updating price...");
        return hash;
      } catch (err) {
        const msg = parseTxError(err);
        txError("price-error", msg);
        throw err;
      }
    },
    [writeContractAsync]
  );

  const receipt = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  if (receipt.isSuccess && txHash) {
    txSuccess(txHash, "Price updated!");
  }

  return { updatePrice, txHash, isConfirmed: receipt.isSuccess };
}
