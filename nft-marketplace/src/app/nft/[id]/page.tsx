"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWalletClient } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { config } from "@/config/wagmi";
import { parseEther, encodeFunctionData, type Address } from "viem";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Tag, Gavel, ShoppingCart, Loader2, CheckCircle, AlertTriangle, Clock, User, Copy, Wallet, ArrowRight, Award, XCircle,
} from "lucide-react";
import {
  nftCollectionConfig, marketplaceConfig, auctionConfig,
  shortenAddress, formatPrice,
} from "@/lib/contracts";
import { formatDistanceToNow } from "@/lib/utils";
import { CONTRACT_ADDRESSES } from "@/config/addresses";
import { resolveIPFS, fetchMetadataFromIPFS } from "@/lib/ipfs";
import { txPending, txSuccess, txError, parseTxError } from "@/lib/toast";
import { useAuctionBids } from "@/hooks/useAuction";
import { useNotificationStore } from "@/stores/useNotificationStore";

type ActionMode = "idle" | "list" | "auction";

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = Number(params.id);
  const { address, chain } = useAccount();

  const [actionMode, setActionMode] = useState<ActionMode>("idle");
  const [listPrice, setListPrice] = useState("");
  const [auctionPrice, setAuctionPrice] = useState("");
  const [auctionStartNow, setAuctionStartNow] = useState(true);
  const [auctionStartDate, setAuctionStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [auctionStartHour, setAuctionStartHour] = useState(() => String(new Date().getHours()));
  const [auctionStartMinute, setAuctionStartMinute] = useState(() => String(Math.floor(new Date().getMinutes() / 5) * 5));
  const [auctionEndDate, setAuctionEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [auctionEndHour, setAuctionEndHour] = useState(() => String(new Date().getHours()));
  const [auctionEndMinute, setAuctionEndMinute] = useState(() => String(Math.floor(new Date().getMinutes() / 5) * 5));
  const [auctionParticipationFee, setAuctionParticipationFee] = useState("");
  const [auctionStep, setAuctionStep] = useState<"form" | "confirm">("form");
  const [bidAmount, setBidAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [justSoldByMe, setJustSoldByMe] = useState<{ price: string; newOwner: string } | null>(null);
  const hadListingByMeRef = useRef(false);
  const soldPriceRef = useRef("");
  const auctionEndNotifiedRef = useRef<number | null>(null);
  const auctionEndingSoonNotifiedRef = useRef<number | null>(null);

  const { writeContractAsync } = useWriteContract();
  const { data: walletClient } = useWalletClient();

  const { data: tokenURI } = useReadContract({ ...nftCollectionConfig, functionName: "tokenURI", args: [BigInt(tokenId)] });
  const { data: owner, refetch: refetchOwner } = useReadContract({ ...nftCollectionConfig, functionName: "ownerOf", args: [BigInt(tokenId)] });
  const { data: royaltyInfo } = useReadContract({ ...nftCollectionConfig, functionName: "royaltyInfo", args: [BigInt(tokenId), BigInt(10000)] });
  const { data: rawListings, refetch: refetchListings } = useReadContract({ ...marketplaceConfig, functionName: "fetchMarketItems" });
  const { data: rawAuctions, refetch: refetchAuctions } = useReadContract({ ...auctionConfig, functionName: "fetchActiveAuctions" });
  const { data: minBidIncrementBps } = useReadContract({ ...auctionConfig, functionName: "MIN_BID_INCREMENT_BPS" });

  const { data: metadata, isLoading } = useQuery({
    queryKey: ["nft-detail", tokenId, tokenURI],
    queryFn: () => fetchMetadataFromIPFS(tokenURI as string),
    enabled: !!tokenURI,
    staleTime: 60 * 60 * 1000,
  });

  const imageUrl = metadata?.image ? resolveIPFS(metadata.image) : "/placeholder-nft.svg";
  const name = metadata?.name || `NFT #${tokenId}`;
  const description = metadata?.description || "";
  const attributes = metadata?.attributes || [];
  const ownerStr = owner as string | undefined;
  const isOwner = ownerStr?.toLowerCase() === address?.toLowerCase();
  const royaltyBps = royaltyInfo ? Number((royaltyInfo as [string, bigint])[1]) / 100 : 0;

  type RawListing = { listingId: bigint; nftContract: string; tokenId: bigint; seller: string; price: bigint; active: boolean; listedAt: bigint };
  type RawAuction = { auctionId: bigint; nftContract: string; tokenId: bigint; seller: string; startingPrice: bigint; highestBid: bigint; highestBidder: string; endTime: bigint; ended: boolean; cancelled: boolean };

  const activeListing = (rawListings as RawListing[] | undefined)
    ?.find((l) => Number(l.tokenId) === tokenId && l.active);
  const activeAuction = (rawAuctions as RawAuction[] | undefined)
    ?.find((a) => Number(a.tokenId) === tokenId && !a.ended && !a.cancelled);

  const isOwnedByAuctionContract = ownerStr?.toLowerCase() === (CONTRACT_ADDRESSES.AUCTION as string).toLowerCase();
  const isOwnedByMarketContract = ownerStr?.toLowerCase() === (CONTRACT_ADDRESSES.MARKETPLACE as string).toLowerCase();

  const { data: endedAuctionData } = useQuery({
    queryKey: ["find-auction-for-token", tokenId, isOwnedByAuctionContract, activeAuction ? Number(activeAuction.auctionId) : null],
    queryFn: async () => {
      if (activeAuction) return null;
      if (!isOwnedByAuctionContract) return null;
      const { readContract: rc } = await import("wagmi/actions");
      for (let i = 0; i < 200; i++) {
        try {
          const result = await rc(config, {
            ...auctionConfig,
            functionName: "auctions",
            args: [BigInt(i)],
          });
          const a = result as readonly [bigint, string, bigint, string, bigint, bigint, string, bigint, boolean, boolean];
          if (Number(a[2]) === tokenId && !a[8] && !a[9]) {
            return {
              auctionId: a[0], nftContract: a[1], tokenId: a[2], seller: a[3],
              startingPrice: a[4], highestBid: a[5], highestBidder: a[6],
              endTime: a[7], ended: a[8], cancelled: a[9],
            } as RawAuction;
          }
        } catch { break; }
      }
      return null;
    },
    enabled: isOwnedByAuctionContract && !activeAuction,
    staleTime: 10_000,
  });

  const effectiveAuction = activeAuction || (endedAuctionData as RawAuction | null);

  const { bids: auctionBids, isLoading: bidsLoading } = useAuctionBids(effectiveAuction ? Number(effectiveAuction.auctionId) : undefined);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const isListingSeller = activeListing && address && activeListing.seller.toLowerCase() === address.toLowerCase();

  useEffect(() => {
    if (isListingSeller && activeListing) {
      hadListingByMeRef.current = true;
      soldPriceRef.current = formatPrice(activeListing.price);
    }
  }, [isListingSeller, activeListing]);

  useEffect(() => {
    if (!activeListing && hadListingByMeRef.current && ownerStr && address && ownerStr.toLowerCase() !== address.toLowerCase()) {
      const payload = { price: soldPriceRef.current, newOwner: ownerStr };
      setJustSoldByMe(payload);
      hadListingByMeRef.current = false;
      try {
        localStorage.setItem(
          `nft-sold-${tokenId}`,
          JSON.stringify({ seller: address, ...payload, timestamp: Date.now() })
        );
      } catch (_) {}
    }
  }, [activeListing, ownerStr, address, tokenId]);

  useEffect(() => {
    if (justSoldByMe != null || !address || !ownerStr || ownerStr.toLowerCase() === address.toLowerCase()) return;
    try {
      const raw = localStorage.getItem(`nft-sold-${tokenId}`);
      if (!raw) return;
      const data = JSON.parse(raw);
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      if (data.seller?.toLowerCase() === address.toLowerCase() && data.timestamp && Date.now() - data.timestamp < maxAge) {
        setJustSoldByMe({ price: data.price || "0", newOwner: data.newOwner || ownerStr });
      }
    } catch (_) {}
  }, [address, ownerStr, tokenId]);

  useEffect(() => {
    if (!isListingSeller || !refetchListings || !refetchOwner) return;
    const iv = setInterval(() => {
      refetchListings();
      refetchOwner();
    }, 5000);
    return () => clearInterval(iv);
  }, [isListingSeller, refetchListings, refetchOwner]);

  function resetAction() {
    setActionMode("idle");
    setActionMsg("");
    setActionError("");
    setActionSuccess("");
    setBusy(false);
    setAuctionStep("form");
    setAuctionStartNow(true);
  }

  async function handleApproveAndList() {
    if (!listPrice || Number(listPrice) <= 0) { setActionError("Vui lòng nhập giá hợp lệ"); return; }
    try {
      setBusy(true);
      setActionError("");
      setActionMsg("Đang phê duyệt NFT cho Marketplace...");
      const approveHash = await writeContractAsync({
        ...nftCollectionConfig,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.MARKETPLACE as Address, BigInt(tokenId)],
      });
      txPending(approveHash, "Đang phê duyệt...");

      setActionMsg("Đang chờ xác nhận phê duyệt...");
      await waitForTransactionReceipt(config, { hash: approveHash, chainId: chain?.id });

      setActionMsg("Đang đăng bán trên Marketplace...");
      const listHash = await writeContractAsync({
        ...marketplaceConfig,
        functionName: "listNFT",
        args: [CONTRACT_ADDRESSES.NFT_COLLECTION as Address, BigInt(tokenId), parseEther(listPrice)],
      });
      txPending(listHash, "Đang đăng bán...", address);
      txSuccess(listHash, "Đã đăng bán thành công!", address);
      setActionSuccess(`Đã đăng bán NFT với giá ${listPrice} ETH!`);
      setActionMsg("");
      setActionMode("idle");
      setListPrice("");
      refetchListings();
      refetchOwner();
    } catch (err) {
      setActionError(parseTxError(err));
      setActionMsg("");
    } finally {
      setBusy(false);
    }
  }

  async function handleBuy() {
    if (!activeListing) return;
    try {
      setBusy(true);
      setActionError("");
      setActionMsg("Đang mua NFT...");
      const hash = await writeContractAsync({
        ...marketplaceConfig,
        functionName: "buyNFT",
        args: [activeListing.listingId],
        value: activeListing.price,
      });
      txPending(hash, "Đang mua...", address);
      txSuccess(hash, "Mua NFT thành công!", address);
      addNotification({
        type: "sale",
        title: "NFT đã được mua",
        message: `NFT "${name}" đã được mua với giá ${formatPrice(activeListing.price)} ETH.`,
        link: `/nft/${tokenId}`,
        recipientAddress: activeListing.seller,
      });
      setActionSuccess("Mua NFT thành công! NFT giờ thuộc về bạn.");
      setActionMsg("");
      refetchListings();
      refetchOwner();
    } catch (err) {
      setActionError(parseTxError(err));
      setActionMsg("");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelListing() {
    if (!activeListing) return;
    try {
      setBusy(true);
      setActionMsg("Đang hủy bán...");
      const hash = await writeContractAsync({
        ...marketplaceConfig,
        functionName: "cancelListing",
        args: [activeListing.listingId],
      });
      txPending(hash, "Đang hủy...", address);
      txSuccess(hash, "Đã hủy bán!", address);
      setActionSuccess("Đã hủy bán NFT.");
      refetchListings();
      refetchOwner();
    } catch (err) {
      setActionError(parseTxError(err));
    } finally {
      setBusy(false);
      setActionMsg("");
    }
  }

  function getAuctionStartTimeMs(): number | null {
    if (auctionStartNow) return null;
    if (!auctionStartDate || auctionStartHour === "" || auctionStartMinute === "") return null;
    const d = new Date(auctionStartDate);
    d.setHours(Number(auctionStartHour), Number(auctionStartMinute), 0, 0);
    return d.getTime();
  }

  function getAuctionEndTimeMs(): number | null {
    if (!auctionEndDate || auctionEndHour === "" || auctionEndMinute === "") return null;
    const d = new Date(auctionEndDate);
    d.setHours(Number(auctionEndHour), Number(auctionEndMinute), 0, 0);
    return d.getTime();
  }

  const auctionStartTimeMs = getAuctionStartTimeMs();
  const auctionEndTimeMs = getAuctionEndTimeMs();
  const canCreateAuctionNow = auctionStartNow || (auctionStartTimeMs != null && Date.now() >= auctionStartTimeMs);

  const nowMs = Date.now();
  const effectiveStartMs = auctionStartNow ? nowMs : (auctionStartTimeMs ?? nowMs);
  const durationSecFromEnd =
    auctionEndTimeMs != null && auctionEndTimeMs > effectiveStartMs
      ? Math.floor((auctionEndTimeMs - effectiveStartMs) / 1000)
      : 0;
  const durationValid = durationSecFromEnd >= 60;
  const durationHours = Math.floor(durationSecFromEnd / 3600);
  const durationMins = Math.floor((durationSecFromEnd % 3600) / 60);

  const [, setTick] = useState(0);
  useEffect(() => {
    if (actionMode !== "auction" || auctionStep !== "confirm" || canCreateAuctionNow) return;
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [actionMode, auctionStep, canCreateAuctionNow]);

  async function handleApproveAndAuction() {
    if (!auctionPrice || Number(auctionPrice) <= 0) { setActionError("Vui lòng nhập giá khởi điểm"); return; }
    if (auctionEndTimeMs == null) { setActionError("Vui lòng chọn thời gian kết thúc"); return; }
    const now = Date.now();
    const durationCheck = Math.floor((auctionEndTimeMs - now) / 1000);
    if (durationCheck < 60) { setActionError("Thời gian kết thúc phải sau thời điểm hiện tại ít nhất 1 phút"); return; }
    if (!auctionStartNow && auctionStartTimeMs != null && now < auctionStartTimeMs) {
      setActionError("Chưa đến giờ bắt đầu đấu giá. Vui lòng bấm 'Tạo đấu giá' khi đến giờ.");
      return;
    }
    const nftAddress = CONTRACT_ADDRESSES.NFT_COLLECTION as Address;
    const startingPriceWei = parseEther(auctionPrice);

    try {
      setBusy(true);
      setActionError("");

      setActionMsg("Đang kiểm tra quyền sở hữu...");
      const { readContract } = await import("wagmi/actions");
      const currentOwner = await readContract(config, {
        ...nftCollectionConfig,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      }) as string;
      if (currentOwner.toLowerCase() !== address?.toLowerCase()) {
        setActionError("Bạn không còn sở hữu NFT này. Có thể NFT đang nằm trong phiên đấu giá hoặc đăng bán khác.");
        setBusy(false);
        setActionMsg("");
        return;
      }

      setActionMsg("Đang phê duyệt NFT cho Auction...");
      const approveHash = await writeContractAsync({
        ...nftCollectionConfig,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.AUCTION as Address, BigInt(tokenId)],
      });

      setActionMsg("Đang chờ xác nhận phê duyệt...");
      await waitForTransactionReceipt(config, { hash: approveHash, chainId: chain?.id });

      const approvedAddr = await readContract(config, {
        ...nftCollectionConfig,
        functionName: "getApproved",
        args: [BigInt(tokenId)],
      }) as string;
      if (approvedAddr.toLowerCase() !== (CONTRACT_ADDRESSES.AUCTION as string).toLowerCase()) {
        setActionError("Phê duyệt không thành công. Vui lòng thử lại.");
        setBusy(false);
        setActionMsg("");
        return;
      }

      const finalDurationSec = Math.max(180, Math.floor((auctionEndTimeMs - Date.now()) / 1000));

      if (!walletClient) { setActionError("Wallet chưa kết nối"); setBusy(false); setActionMsg(""); return; }

      setActionMsg("Đang tạo phiên đấu giá...");
      const calldata = encodeFunctionData({
        abi: auctionConfig.abi,
        functionName: "createAuction",
        args: [nftAddress, BigInt(tokenId), startingPriceWei, BigInt(finalDurationSec)],
      });
      const hash = await walletClient.sendTransaction({
        to: auctionConfig.address,
        data: calldata,
        gas: 500_000n,
      });
      txPending(hash, "Đang tạo đấu giá...", address);

      setActionMsg("Đang chờ xác nhận tạo đấu giá...");
      await waitForTransactionReceipt(config, { hash, chainId: chain?.id });

      txSuccess(hash, "Tạo đấu giá thành công!", address);
      setActionSuccess(`Đã tạo phiên đấu giá, giá khởi điểm ${auctionPrice} ETH!`);
      setActionMsg("");
      setActionMode("idle");
      setAuctionStep("form");
      refetchAuctions();
      refetchOwner();
    } catch (err) {
      const msg = parseTxError(err);
      console.error("[Auction] createAuction error:", err);
      setActionError(msg);
      setActionMsg("");
    } finally {
      setBusy(false);
    }
  }

  async function handlePlaceBid() {
    if (!activeAuction || !bidAmount || Number(bidAmount) <= 0) {
      setActionError("Vui lòng nhập số tiền đặt giá");
      return;
    }
    const bidWei = parseEther(bidAmount);
    const startingPrice = activeAuction.startingPrice;
    const currentBid = activeAuction.highestBid > 0n ? activeAuction.highestBid : startingPrice;
    const bps = minBidIncrementBps != null ? Number(minBidIncrementBps) : 500;
    const minIncrement = (currentBid * BigInt(bps)) / 10000n;
    const minBidWei = currentBid + minIncrement;
    if (activeAuction.highestBid === 0n && bidWei < startingPrice) {
      setActionError("Giá đặt phải >= giá khởi điểm.");
      return;
    }
    if (bidWei < minBidWei) {
      setActionError(`Giá đặt tối thiểu: ${formatPrice(minBidWei)} ETH (bước giá ${bps / 100}%).`);
      return;
    }
    try {
      setBusy(true);
      setActionError("");
      setActionMsg("Đang đặt giá...");
      const hash = await writeContractAsync({
        ...auctionConfig,
        functionName: "placeBid",
        args: [activeAuction.auctionId],
        value: bidWei,
      });
      txPending(hash, "Đang đặt giá...", address);
      txSuccess(hash, "Đặt giá thành công!", address);
      addNotification({
        type: "bid",
        title: "Có người đặt giá",
        message: `NFT "${name}" nhận giá ${bidAmount} ETH từ ${address ? shortenAddress(address) : "người dùng"}.`,
        link: `/nft/${tokenId}`,
        recipientAddress: activeAuction.seller,
      });
      setActionSuccess(`Đã đặt giá ${bidAmount} ETH!`);
      setActionMsg("");
      refetchAuctions();
    } catch (err) {
      setActionError(parseTxError(err));
      setActionMsg("");
    } finally {
      setBusy(false);
    }
  }

  async function handleEndAuction() {
    if (!effectiveAuction) return;
    try {
      setBusy(true);
      setActionMsg("Đang kết thúc đấu giá...");
      const hash = await writeContractAsync({
        ...auctionConfig,
        functionName: "endAuction",
        args: [effectiveAuction.auctionId],
      });
      txPending(hash, "Đang kết thúc đấu giá...", address);

      setActionMsg("Đang chờ xác nhận...");
      await waitForTransactionReceipt(config, { hash, chainId: chain?.id });

      txSuccess(hash, "Đấu giá kết thúc!", address);
      setActionSuccess("Đấu giá đã kết thúc. NFT và tiền đã được phân phối.");
      refetchAuctions();
      refetchOwner();
    } catch (err) {
      setActionError(parseTxError(err));
    } finally {
      setBusy(false);
      setActionMsg("");
    }
  }

  const auctionEndTime = effectiveAuction ? Number(effectiveAuction.endTime) * 1000 : 0;
  const auctionEnded = auctionEndTime > 0 && auctionEndTime < Date.now();
  const isSeller = activeListing?.seller.toLowerCase() === address?.toLowerCase()
    || effectiveAuction?.seller.toLowerCase() === address?.toLowerCase();
  const isAuctionWinner = effectiveAuction && address && effectiveAuction.highestBidder.toLowerCase() === address.toLowerCase();
  const hadBidInAuction = effectiveAuction && address && auctionBids.some((b) => b.bidder.toLowerCase() === address.toLowerCase());
  const isAuctionLoser = effectiveAuction && auctionEnded && address && hadBidInAuction && !isAuctionWinner;

  useEffect(() => {
    if (!effectiveAuction || !auctionEnded || !addNotification) return;
    const id = Number(effectiveAuction.auctionId);
    if (auctionEndNotifiedRef.current === id) return;
    auctionEndNotifiedRef.current = id;
    const endTimeStr = new Date(auctionEndTime).toLocaleString("vi-VN");
    addNotification({
      type: "auction_ending",
      title: "Phiên đấu giá đã kết thúc",
      message: `Phiên đấu giá "${name}" kết thúc lúc ${endTimeStr}. Vào trang NFT để kết thúc phiên và nhận tiền.`,
      link: `/nft/${tokenId}`,
      recipientAddress: effectiveAuction.seller,
    });
    if (effectiveAuction.highestBidder !== "0x0000000000000000000000000000000000000000") {
      addNotification({
        type: "auction_ending",
        title: "Phiên đấu giá đã kết thúc — Bạn đã thắng",
        message: `Chúc mừng! Bạn là người đặt giá cao nhất cho "${name}". Vào trang NFT và bấm "Nhận sản phẩm" để nhận NFT về ví.`,
        link: `/nft/${tokenId}`,
        recipientAddress: effectiveAuction.highestBidder,
      });
    }
  }, [effectiveAuction, auctionEnded, auctionEndTime, name, tokenId, addNotification]);

  useEffect(() => {
    if (!effectiveAuction || auctionEnded || !addNotification) return;
    const remaining = auctionEndTime - Date.now();
    if (remaining > 5 * 60 * 1000 || remaining <= 0) return;
    const id = Number(effectiveAuction.auctionId);
    if (auctionEndingSoonNotifiedRef.current === id) return;
    auctionEndingSoonNotifiedRef.current = id;
    const endTimeStr = new Date(auctionEndTime).toLocaleString("vi-VN");
    addNotification({
      type: "auction_ending",
      title: "Phiên đấu giá sắp kết thúc",
      message: `Phiên đấu giá "${name}" kết thúc lúc ${endTimeStr}. Còn dưới 5 phút.`,
      link: `/nft/${tokenId}`,
      recipientAddress: effectiveAuction.seller,
    });
    if (effectiveAuction.highestBidder !== "0x0000000000000000000000000000000000000000") {
      addNotification({
        type: "auction_ending",
        title: "Phiên đấu giá sắp kết thúc",
        message: `Phiên đấu giá "${name}" (bạn đang đặt cao nhất) kết thúc lúc ${endTimeStr}. Còn dưới 5 phút.`,
        link: `/nft/${tokenId}`,
        recipientAddress: effectiveAuction.highestBidder,
      });
    }
  }, [effectiveAuction, auctionEnded, auctionEndTime, name, tokenId, addNotification]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-surface rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-surface rounded w-3/4" />
            <div className="h-4 bg-surface rounded w-1/2" />
            <div className="h-20 bg-surface rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary mb-6 transition-colors">
        <ArrowLeft size={16} /> Quay lại
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface">
          <Image src={imageUrl} alt={name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority unoptimized />
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{name}</h1>
            <p className="text-sm text-text-muted mt-1">Token #{tokenId}</p>
          </div>

          {description && <p className="text-sm text-text-secondary leading-relaxed">{description}</p>}

          {/* Owner + Royalty */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted flex items-center gap-1"><User size={14} /> Chủ sở hữu</span>
              {isOwner ? (
                <span className="text-text-primary font-medium">Bạn</span>
              ) : ownerStr ? (
                <Link href={`/profile/${ownerStr}`} className="font-medium text-primary hover:underline inline-flex items-center gap-1">
                  {shortenAddress(ownerStr)}
                  <ArrowRight size={12} />
                </Link>
              ) : (
                <span className="text-text-primary font-medium">—</span>
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Bản quyền</span>
              <span className="text-text-primary font-medium">{royaltyBps}%</span>
            </div>
          </div>

          {/* Đã bán — khu vực nhận tiền & chuyển NFT cho chủ mới (hiển thị khi xác định được người bán) */}
          {justSoldByMe && (
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle size={20} />
                <span className="font-semibold">Giao dịch đã hoàn tất</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Wallet size={16} className="mt-0.5 shrink-0 text-success" />
                <p className="text-text-primary">
                  <span className="font-medium">{justSoldByMe.price} ETH</span> đã được chuyển về ví của bạn.
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight size={16} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-text-primary">
                  NFT đã thuộc về chủ sở hữu mới:{" "}
                  <Link href={`/profile/${justSoldByMe.newOwner}`} className="font-mono font-medium text-primary hover:underline inline-flex items-center gap-1">
                    {shortenAddress(justSoldByMe.newOwner)}
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(justSoldByMe.newOwner)}
                    className="ml-1 p-0.5 rounded text-text-muted hover:text-primary"
                    title="Sao chép địa chỉ"
                  >
                    <Copy size={12} />
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Bạn không còn sở hữu — giải thích tiền đã tự động về ví (không cần nút rút tiền) */}
          {address && !isOwner && ownerStr && !activeListing && !effectiveAuction && !justSoldByMe && !isOwnedByAuctionContract && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Wallet size={20} />
                <span className="font-semibold">Bạn không còn sở hữu NFT này</span>
              </div>
              <p className="text-sm text-text-primary">
                Nếu bạn đã bán NFT, số tiền đã được <strong>chuyển tự động về ví của bạn</strong> ngay khi người mua thanh toán — không cần thao tác rút tiền.
              </p>
              <p className="text-xs text-text-muted">
                Chủ sở hữu hiện tại:{" "}
                <Link href={`/profile/${ownerStr}`} className="font-mono text-primary hover:underline">
                  {shortenAddress(ownerStr)}
                </Link>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(ownerStr)}
                  className="ml-1 p-0.5 rounded text-text-muted hover:text-primary align-middle"
                  title="Sao chép địa chỉ"
                >
                  <Copy size={12} />
                </button>
              </p>
              <div className="flex flex-wrap gap-3 mt-2">
                <Link
                  href={`/profile/${ownerStr}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Xem profile & sản phẩm của chủ sở hữu →
                </Link>
                <Link
                  href="/activity"
                  className="inline-flex items-center gap-1 text-sm font-medium text-text-muted hover:text-primary hover:underline"
                >
                  Xem lịch sử giao dịch tại Hoạt động →
                </Link>
              </div>
            </div>
          )}

          {/* Listing Info — đang đăng bán */}
          {activeListing && !justSoldByMe && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs text-text-muted mb-1">Giá bán</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(activeListing.price)} ETH</p>
            </div>
          )}

          {/* Auction Info */}
          {effectiveAuction && (
            <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4 space-y-2">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-text-muted mb-1">Giá hiện tại</p>
                  <p className="text-xl font-bold text-secondary">
                    {Number(effectiveAuction.highestBid) > 0 ? formatPrice(effectiveAuction.highestBid) : formatPrice(effectiveAuction.startingPrice)} ETH
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted mb-1 flex items-center gap-1 justify-end"><Clock size={12} /> {auctionEnded ? "Đã kết thúc" : "Kết thúc"}</p>
                  {auctionEnded ? (
                    <p className="text-sm font-bold text-danger">Hết giờ</p>
                  ) : (
                    <CountdownDisplay endTime={auctionEndTime} />
                  )}
                </div>
              </div>
              {effectiveAuction.highestBidder !== "0x0000000000000000000000000000000000000000" && (
                <p className="text-xs text-text-muted">
                  Người đặt cao nhất:{" "}
                  <Link href={`/profile/${effectiveAuction.highestBidder}`} className="text-primary hover:underline">
                    {shortenAddress(effectiveAuction.highestBidder)}
                  </Link>
                </p>
              )}
            </div>
          )}

          {/* Lịch sử đấu giá */}
          {effectiveAuction && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-text-muted uppercase mb-3">Lịch sử đấu giá</p>
              {bidsLoading ? (
                <p className="text-sm text-text-muted">Đang tải...</p>
              ) : auctionBids.length === 0 ? (
                <p className="text-sm text-text-muted">Chưa có lượt đặt giá nào.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                  {[...auctionBids]
                    .sort((a, b) => (a.amount < b.amount ? 1 : a.amount > b.amount ? -1 : 0))
                    .map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle size={14} className="text-success shrink-0" />
                        <span className="text-sm font-medium text-text-primary">{formatPrice(b.amount)} ETH</span>
                      </div>
                      <span className="text-xs text-text-muted shrink-0">
                        {formatDistanceToNow(b.timestamp * 1000)}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-text-secondary truncate font-mono">{shortenAddress(b.bidder)}</span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(b.bidder)}
                          className="shrink-0 p-0.5 rounded text-text-muted hover:text-primary"
                          title="Sao chép địa chỉ"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attributes */}
          {attributes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase mb-2">Thuộc tính</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {attributes.map((attr, i) => (
                  <div key={i} className="rounded-lg border border-border bg-surface/50 p-2 text-center">
                    <p className="text-[10px] uppercase text-primary font-semibold">{attr.trait_type}</p>
                    <p className="text-xs font-bold text-text-primary">{String(attr.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {actionMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 p-3">
              <Loader2 size={16} className="animate-spin text-primary" />
              <p className="text-sm text-text-primary">{actionMsg}</p>
            </div>
          )}
          {actionError && (
            <div className="rounded-xl bg-danger/10 border border-danger/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-danger shrink-0" />
                <p className="text-sm text-danger">{actionError}</p>
              </div>
              {actionMode === "auction" && (
                <p className="text-xs text-text-muted pl-6">
                  Gợi ý: Bạn cần bấm &quot;Xác nhận đấu giá&quot; và chấp nhận <strong>cả hai</strong> giao dịch trong ví (Phê duyệt rồi Tạo đấu giá). Đảm bảo NFT đang thuộc về bạn và chưa nằm trong phiên đấu giá khác.
                </p>
              )}
            </div>
          )}
          {actionSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-success/10 border border-success/20 p-3">
              <CheckCircle size={16} className="text-success shrink-0" />
              <p className="text-sm text-success">{actionSuccess}</p>
            </div>
          )}

          {/* ===== ACTIONS ===== */}
          {/* Buy button (not owner, listing active) */}
          {activeListing && !isSeller && address && (
            <button
              onClick={handleBuy}
              disabled={busy}
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
            >
              <ShoppingCart size={16} className="inline mr-2" />
              {busy ? "Đang xử lý..." : `Mua với giá ${formatPrice(activeListing.price)} ETH`}
            </button>
          )}

          {/* Cancel listing (seller) */}
          {activeListing && isSeller && (
            <button onClick={handleCancelListing} disabled={busy} className="w-full rounded-xl py-3 text-sm font-medium border border-danger text-danger hover:bg-danger/10 disabled:opacity-50 transition-colors">
              {busy ? "Đang xử lý..." : "Hủy bán"}
            </button>
          )}

          {/* Bid button (not seller, auction active) */}
          {effectiveAuction && !isSeller && address && !auctionEnded && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Nhập giá (ETH)"
                  step="0.01"
                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
                />
                <button
                  onClick={handlePlaceBid}
                  disabled={busy}
                  className="rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 shrink-0"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
                >
                  <Gavel size={16} className="inline mr-1" />
                  {busy ? "..." : "Đặt giá"}
                </button>
              </div>
            </div>
          )}

          {/* Phiên đấu giá đã kết thúc — giao diện người thắng / người thua / chủ sở hữu */}
          {effectiveAuction && auctionEnded && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <p className="text-sm font-semibold text-text-primary">Phiên đấu giá đã kết thúc</p>

              {isAuctionWinner && (
                <div className="rounded-lg border border-success/30 bg-success/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-success">
                    <Award size={20} />
                    <span className="font-semibold">Chúc mừng bạn đã thắng phiên đấu giá này!</span>
                  </div>
                  <p className="text-sm text-text-primary">
                    Bạn là người đặt giá cao nhất ({formatPrice(effectiveAuction.highestBid)} ETH). Bấm nút bên dưới để kết thúc phiên và nhận NFT về ví của bạn.
                  </p>
                  <button
                    onClick={handleEndAuction}
                    disabled={busy}
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
                  >
                    {busy ? "Đang xử lý..." : "Nhận sản phẩm (Kết thúc đấu giá)"}
                  </button>
                </div>
              )}

              {isAuctionLoser && (
                <div className="rounded-lg border border-border bg-surface/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-text-muted">
                    <XCircle size={20} />
                    <span className="font-semibold">Thật tiếc! Bạn đã thua trong phiên đấu giá này.</span>
                  </div>
                  <p className="text-sm text-text-primary">
                    Số tiền bạn đặt giá trước đó đã được <strong>hoàn lại tự động</strong> khi có người đặt giá cao hơn. Không cần thao tác rút tiền.
                  </p>
                </div>
              )}

              {isSeller && !isAuctionWinner && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                  <p className="text-sm text-text-primary">
                    Phiên đấu giá đã hết giờ. Bạn có thể bấm &quot;Kết thúc đấu giá&quot; để hoàn tất và nhận tiền về ví (hoặc chờ người thắng / bất kỳ ai bấm).
                  </p>
                  <button
                    onClick={handleEndAuction}
                    disabled={busy}
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
                  >
                    {busy ? "Đang xử lý..." : "Kết thúc đấu giá"}
                  </button>
                </div>
              )}

              {!isAuctionWinner && !isAuctionLoser && !isSeller && (
                <div className="rounded-lg border border-border bg-surface/50 p-3">
                  <p className="text-sm text-text-muted">
                    Phiên đấu giá đã kết thúc. Người thắng hoặc bất kỳ ai có thể bấm &quot;Kết thúc đấu giá&quot; để hoàn tất.
                  </p>
                  <button
                    onClick={handleEndAuction}
                    disabled={busy}
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50 mt-2"
                    style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
                  >
                    {busy ? "Đang xử lý..." : "Kết thúc đấu giá"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Owner actions (no active listing/auction) */}
          {isOwner && !activeListing && !activeAuction && actionMode === "idle" && (
            <div className="flex gap-3">
              <button
                onClick={() => { resetAction(); setActionMode("list"); }}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
              >
                <Tag size={16} className="inline mr-1" /> Đăng bán
              </button>
              <button
                onClick={() => { resetAction(); setActionMode("auction"); }}
                className="flex-1 rounded-xl py-3 text-sm font-semibold border border-primary text-primary hover:bg-primary/10 transition-colors"
              >
                <Gavel size={16} className="inline mr-1" /> Đấu giá
              </button>
            </div>
          )}

          {/* List form */}
          {actionMode === "list" && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-text-primary">Đăng bán NFT</p>
              <input
                type="number"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                placeholder="Giá bán (ETH)"
                step="0.01"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleApproveAndList}
                  disabled={busy}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
                >
                  {busy ? "Đang xử lý..." : "Xác nhận đăng bán"}
                </button>
                <button onClick={resetAction} className="rounded-xl px-4 py-3 text-sm border border-border text-text-muted hover:text-text-primary transition-colors">
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Auction form */}
          {actionMode === "auction" && auctionStep === "form" && (
            <div className="space-y-4 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-text-primary">Tạo phiên đấu giá</p>
              <div>
                <label className="text-xs text-text-muted">Giá khởi điểm (ETH)</label>
                <input
                  type="number"
                  value={auctionPrice}
                  onChange={(e) => setAuctionPrice(e.target.value)}
                  placeholder="0"
                  step="0.01"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted">Bước giá tối thiểu (từ contract)</label>
                <p className="mt-1 text-sm text-text-primary font-medium">
                  {minBidIncrementBps != null ? `${Number(minBidIncrementBps) / 100}%` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-2">Khi nào phiên đấu giá bắt đầu?</p>
                <label className="flex items-start gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-surface/50">
                  <input
                    type="radio"
                    name="auctionStart"
                    checked={auctionStartNow}
                    onChange={() => setAuctionStartNow(true)}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-text-primary">Ngay bây giờ</span>
                    <p className="text-xs text-text-muted mt-0.5">Người tham gia có thể đặt giá ngay sau khi bạn tạo phiên.</p>
                  </div>
                </label>
                <label className="flex items-start gap-2 rounded-lg border border-border p-3 mt-2 cursor-pointer hover:bg-surface/50">
                  <input
                    type="radio"
                    name="auctionStart"
                    checked={!auctionStartNow}
                    onChange={() => setAuctionStartNow(false)}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-text-primary">Không phải bây giờ</span>
                    <p className="text-xs text-text-muted mt-0.5">Chọn ngày và giờ bắt đầu. Bạn cần bấm &quot;Tạo đấu giá&quot; khi đến giờ.</p>
                    {!auctionStartNow && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <label className="text-[10px] text-text-muted">Ngày</label>
                          <input
                            type="date"
                            value={auctionStartDate}
                            onChange={(e) => setAuctionStartDate(e.target.value)}
                            className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text-primary mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted">Giờ</label>
                          <select
                            value={auctionStartHour}
                            onChange={(e) => setAuctionStartHour(e.target.value)}
                            className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text-primary mt-0.5"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted">Phút</label>
                          <select
                            value={auctionStartMinute}
                            onChange={(e) => setAuctionStartMinute(e.target.value)}
                            className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text-primary mt-0.5"
                          >
                            {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                              <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-2">Thời gian kết thúc</p>
                <p className="text-xs text-text-muted mb-2">Chọn ngày, giờ và phút đấu giá kết thúc</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-text-muted">Ngày</label>
                    <input
                      type="date"
                      value={auctionEndDate}
                      onChange={(e) => setAuctionEndDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text-primary mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted">Giờ</label>
                    <select
                      value={auctionEndHour}
                      onChange={(e) => setAuctionEndHour(e.target.value)}
                      className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text-primary mt-0.5"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted">Phút</label>
                    <select
                      value={auctionEndMinute}
                      onChange={(e) => setAuctionEndMinute(e.target.value)}
                      className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text-primary mt-0.5"
                    >
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                        <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {!durationValid && auctionEndTimeMs != null && (
                  <p className="text-xs text-amber-600 mt-1">Thời gian kết thúc phải sau thời điểm bắt đầu ít nhất 1 phút</p>
                )}
              </div>
              <div>
                <label className="text-xs text-text-muted">Phí tham gia (ETH) — ghi chú: contract hiện chưa hỗ trợ</label>
                <input
                  type="number"
                  value={auctionParticipationFee}
                  onChange={(e) => setAuctionParticipationFee(e.target.value)}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary mt-1"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActionError("");
                    if (!auctionPrice || Number(auctionPrice) <= 0) { setActionError("Vui lòng nhập giá khởi điểm"); return; }
                    if (!auctionStartNow && !auctionStartDate) { setActionError("Vui lòng chọn ngày bắt đầu"); return; }
                    if (!auctionEndDate || auctionEndHour === "" || auctionEndMinute === "") { setActionError("Vui lòng chọn thời gian kết thúc"); return; }
                    if (!durationValid) { setActionError("Thời gian kết thúc phải sau thời điểm bắt đầu ít nhất 1 phút"); return; }
                    setAuctionStep("confirm");
                  }}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
                >
                  Tiếp tục
                </button>
                <button onClick={resetAction} className="rounded-xl px-4 py-3 text-sm border border-border text-text-muted hover:text-text-primary transition-colors">
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Auction confirm */}
          {actionMode === "auction" && auctionStep === "confirm" && (
            <div className="space-y-4 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-text-primary">Xác nhận thông tin đấu giá</p>
              <div className="rounded-lg border border-border bg-surface/50 p-3 space-y-2 text-sm">
                <p><span className="text-text-muted">NFT:</span> <span className="font-medium text-text-primary">{name}</span></p>
                <p><span className="text-text-muted">Giá khởi điểm:</span> <span className="font-medium text-text-primary">{auctionPrice} ETH</span></p>
                <p><span className="text-text-muted">Bước giá:</span> <span className="font-medium text-text-primary">{minBidIncrementBps != null ? `${Number(minBidIncrementBps) / 100}%` : "—"}</span></p>
                {auctionStartNow ? (
                  <p><span className="text-text-muted">Bắt đầu:</span> <span className="font-medium text-text-primary">Ngay bây giờ</span></p>
                ) : auctionStartTimeMs != null ? (
                  <p><span className="text-text-muted">Bắt đầu lúc:</span> <span className="font-medium text-text-primary">{new Date(auctionStartTimeMs).toLocaleString("vi-VN")}</span></p>
                ) : null}
                <p><span className="text-text-muted">Kết thúc lúc:</span> <span className="font-medium text-text-primary">{auctionEndTimeMs != null ? new Date(auctionEndTimeMs).toLocaleString("vi-VN") : "—"}</span></p>
                {durationValid && (
                  <p><span className="text-text-muted">Thời lượng:</span> <span className="font-medium text-text-primary">{durationHours} giờ {durationMins} phút</span></p>
                )}
                {auctionParticipationFee && Number(auctionParticipationFee) > 0 && (
                  <p><span className="text-text-muted">Phí tham gia (ghi chú):</span> <span className="font-medium text-text-primary">{auctionParticipationFee} ETH</span></p>
                )}
              </div>
              {!canCreateAuctionNow && auctionStartTimeMs != null && (
                <p className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  Đấu giá sẽ bắt đầu lúc {new Date(auctionStartTimeMs).toLocaleString("vi-VN")}. Vui lòng bấm &quot;Tạo đấu giá&quot; khi đến giờ.
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleApproveAndAuction}
                  disabled={busy || !canCreateAuctionNow || !durationValid}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
                >
                  {busy ? "Đang xử lý..." : !durationValid ? "Thời gian kết thúc không hợp lệ" : canCreateAuctionNow ? "Xác nhận đấu giá" : "Chờ đến giờ bắt đầu"}
                </button>
                <button
                  onClick={() => setAuctionStep("form")}
                  className="rounded-xl px-4 py-3 text-sm border border-border text-text-muted hover:text-text-primary transition-colors"
                >
                  Trở lại
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function CountdownDisplay({ endTime }: { endTime: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const diff = Math.max(0, endTime - now);
  if (diff === 0) return <p className="text-sm font-bold text-danger">Đã kết thúc</p>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return <p className="text-sm font-bold text-text-primary">{h}h {m}m {s}s</p>;
}
