"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { config } from "@/config/wagmi";
import { type Address, parseEther } from "viem";
import { auctionConfig, getNFTContractConfig } from "@/lib/contracts";
import { txPending, txSuccess, txError, parseTxError } from "@/lib/toast";
import type { AuctionItem, BidHistory } from "@/types";

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

function rawToAuction(r: RawAuction): AuctionItem {
  return {
    auctionId: Number(r.auctionId),
    nftContract: r.nftContract,
    tokenId: Number(r.tokenId),
    seller: r.seller,
    startingPrice: r.startingPrice,
    highestBid: r.highestBid,
    highestBidder: r.highestBidder,
    endTime: Number(r.endTime),
    ended: r.ended,
    cancelled: r.cancelled,
  };
}

export function useActiveAuctions() {
  const result = useReadContract({
    ...auctionConfig,
    functionName: "fetchActiveAuctions",
    query: {
      staleTime: 30_000,
      refetchInterval: 30_000,
    },
  });

  const auctions: AuctionItem[] = result.data
    ? (result.data as unknown as RawAuction[]).map(rawToAuction)
    : [];

  return {
    auctions,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useAuction(auctionId?: number) {
  const result = useReadContract({
    ...auctionConfig,
    functionName: "auctions",
    args: auctionId !== undefined ? [BigInt(auctionId)] : undefined,
    query: {
      enabled: auctionId !== undefined,
      refetchInterval: 15_000,
    },
  });

  const auction = result.data ? rawToAuction(result.data as unknown as RawAuction) : undefined;

  return {
    auction,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useAuctionBids(auctionId?: number) {
  const result = useReadContract({
    ...auctionConfig,
    functionName: "getAuctionBids",
    args: auctionId !== undefined ? [BigInt(auctionId)] : undefined,
    query: {
      enabled: auctionId !== undefined,
      refetchInterval: 15_000,
    },
  });

  const bids: BidHistory[] = result.data
    ? (result.data as unknown as { bidder: string; amount: bigint; timestamp: bigint }[]).map((b) => ({
        bidder: b.bidder,
        amount: b.amount,
        timestamp: Number(b.timestamp),
        txHash: "",
      }))
    : [];

  return { bids, isLoading: result.isLoading, refetch: result.refetch };
}

export function useCountdown(endTime?: number) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });

  useEffect(() => {
    if (!endTime) return;

    function calc() {
      const now = Math.floor(Date.now() / 1000);
      const diff = endTime! - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / 86400),
        hours: Math.floor((diff % 86400) / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
        expired: false,
      });
    }

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
}

export function useCreateAuction() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<string>();
  const [isCreating, setIsCreating] = useState(false);

  const createAuction = useCallback(
    async (nftContract: string, tokenId: number, startingPriceEth: string, durationSeconds: number) => {
      if (!address) throw new Error("Wallet not connected");

      try {
        setIsCreating(true);

        const approveHash = await writeContractAsync({
          ...getNFTContractConfig(nftContract),
          functionName: "approve",
          args: [auctionConfig.address, BigInt(tokenId)],
        });
        txPending(approveHash, "Approving auction contract...");

        await waitForTransactionReceipt(config, { hash: approveHash });

        const hash = await writeContractAsync({
          ...auctionConfig,
          functionName: "createAuction",
          args: [
            nftContract as Address,
            BigInt(tokenId),
            parseEther(startingPriceEth),
            BigInt(durationSeconds),
          ],
        });

        txSuccess(approveHash, "Auction contract approved!");
        setTxHash(hash);
        txPending(hash, "Creating auction...");
        return hash;
      } catch (err) {
        const msg = parseTxError(err);
        txError("auction-create-error", msg);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [address, writeContractAsync]
  );

  const receipt = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  if (receipt.isSuccess && txHash) {
    txSuccess(txHash, "Auction created!");
  }

  return { createAuction, txHash, isCreating, isConfirmed: receipt.isSuccess };
}

export function usePlaceBid() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<string>();
  const [isBidding, setIsBidding] = useState(false);

  const placeBid = useCallback(
    async (auctionId: number, bidAmountEth: string) => {
      try {
        setIsBidding(true);
        const hash = await writeContractAsync({
          ...auctionConfig,
          functionName: "placeBid",
          args: [BigInt(auctionId)],
          value: parseEther(bidAmountEth),
        });

        setTxHash(hash);
        txPending(hash, "Placing bid...");
        return hash;
      } catch (err) {
        const msg = parseTxError(err);
        txError("bid-error", msg);
        throw err;
      } finally {
        setIsBidding(false);
      }
    },
    [writeContractAsync]
  );

  const receipt = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  if (receipt.isSuccess && txHash) {
    txSuccess(txHash, "Bid placed!");
  }

  return { placeBid, txHash, isBidding, isConfirmed: receipt.isSuccess };
}

export function useEndAuction() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<string>();

  const endAuction = useCallback(
    async (auctionId: number) => {
      try {
        const hash = await writeContractAsync({
          ...auctionConfig,
          functionName: "endAuction",
          args: [BigInt(auctionId)],
        });

        setTxHash(hash);
        txPending(hash, "Ending auction...");
        return hash;
      } catch (err) {
        const msg = parseTxError(err);
        txError("end-auction-error", msg);
        throw err;
      }
    },
    [writeContractAsync]
  );

  const receipt = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  if (receipt.isSuccess && txHash) {
    txSuccess(txHash, "Auction ended!");
  }

  return { endAuction, txHash, isConfirmed: receipt.isSuccess };
}

export function useCancelAuction() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<string>();

  const cancelAuction = useCallback(
    async (auctionId: number) => {
      try {
        const hash = await writeContractAsync({
          ...auctionConfig,
          functionName: "cancelAuction",
          args: [BigInt(auctionId)],
        });

        setTxHash(hash);
        txPending(hash, "Cancelling auction...");
        return hash;
      } catch (err) {
        const msg = parseTxError(err);
        txError("cancel-auction-error", msg);
        throw err;
      }
    },
    [writeContractAsync]
  );

  const receipt = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  if (receipt.isSuccess && txHash) {
    txSuccess(txHash, "Auction cancelled!");
  }

  return { cancelAuction, txHash, isConfirmed: receipt.isSuccess };
}
