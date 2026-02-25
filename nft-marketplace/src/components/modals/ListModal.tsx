"use client";

import { useState, useMemo } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { ModalWrapper } from "./ModalWrapper";

type ListStatus = "idle" | "approving" | "listing" | "success" | "error";
type ListType = "fixed" | "auction";

const DURATION_OPTIONS = [
  { label: "1h", seconds: 3600 },
  { label: "12h", seconds: 43200 },
  { label: "1d", seconds: 86400 },
  { label: "3d", seconds: 259200 },
  { label: "7d", seconds: 604800 },
];

interface ListModalProps {
  open: boolean;
  onClose: () => void;
  nftName: string;
  royaltyPercent: number;
  onListFixed: (priceEth: string) => Promise<void>;
  onListAuction: (startingPriceEth: string, durationSeconds: number) => Promise<void>;
}

export function ListModal({
  open,
  onClose,
  nftName,
  royaltyPercent,
  onListFixed,
  onListAuction,
}: ListModalProps) {
  const [listType, setListType] = useState<ListType>("fixed");
  const [price, setPrice] = useState("");
  const [auctionPrice, setAuctionPrice] = useState("");
  const [duration, setDuration] = useState(86400);
  const [status, setStatus] = useState<ListStatus>("idle");

  const platformFee = 2.5;
  const activePrice = listType === "fixed" ? price : auctionPrice;
  const priceNum = parseFloat(activePrice || "0");

  const feeBreakdown = useMemo(() => {
    const platformAmount = priceNum * (platformFee / 100);
    const royaltyAmount = priceNum * (royaltyPercent / 100);
    const youReceive = priceNum - platformAmount - royaltyAmount;
    return { platformAmount, royaltyAmount, youReceive: Math.max(0, youReceive) };
  }, [priceNum, royaltyPercent]);

  const usdEquiv = useMemo(
    () => `$${(priceNum * 2800).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    [priceNum],
  );

  async function handleSubmit() {
    if (!activePrice || priceNum <= 0) return;
    try {
      setStatus("approving");
      if (listType === "fixed") {
        setStatus("listing");
        await onListFixed(price);
      } else {
        setStatus("listing");
        await onListAuction(auctionPrice, duration);
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function handleClose() {
    if (status === "approving" || status === "listing") return;
    setStatus("idle");
    setPrice("");
    setAuctionPrice("");
    onClose();
  }

  return (
    <ModalWrapper open={open} onClose={handleClose} title={`List "${nftName}" for Sale`}>
      {(status === "approving" || status === "listing") && (
        <div className="flex flex-col items-center py-8">
          <Loader2 size={32} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-text-secondary">
            {status === "approving" ? "Approving NFT..." : "Creating listing..."}
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center py-8">
          <CheckCircle2 size={48} className="text-success mb-3" />
          <p className="text-lg font-bold text-text-primary">Listed Successfully!</p>
          <button
            onClick={handleClose}
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
          >
            Done
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center py-8">
          <XCircle size={48} className="text-danger mb-3" />
          <p className="text-sm font-semibold text-danger">Listing Failed</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-4 rounded-xl border border-border px-6 py-2 text-sm text-text-secondary hover:bg-surface transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {status === "idle" && (
        <>
          {/* Toggle Fixed / Auction */}
          <div className="flex rounded-xl border border-border overflow-hidden mb-6">
            {(["fixed", "auction"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setListType(t)}
                className="flex-1 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: listType === t ? "#8B5CF6" : "transparent",
                  color: listType === t ? "white" : "#9CA3AF",
                }}
              >
                {t === "fixed" ? "Fixed Price" : "Timed Auction"}
              </button>
            ))}
          </div>

          {/* Fixed Price Input */}
          {listType === "fixed" && (
            <div className="mb-5">
              <label className="text-xs text-text-muted mb-1.5 block">Price (ETH)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                  {usdEquiv}
                </span>
              </div>
            </div>
          )}

          {/* Auction inputs */}
          {listType === "auction" && (
            <>
              <div className="mb-4">
                <label className="text-xs text-text-muted mb-1.5 block">Starting Price (ETH)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={auctionPrice}
                    onChange={(e) => setAuctionPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                    {usdEquiv}
                  </span>
                </div>
              </div>
              <div className="mb-5">
                <label className="text-xs text-text-muted mb-1.5 block">Duration</label>
                <div className="flex gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d.seconds}
                      onClick={() => setDuration(d.seconds)}
                      className="flex-1 rounded-lg py-2 text-xs font-medium transition-all"
                      style={{
                        background: duration === d.seconds ? "rgba(139,92,246,0.15)" : "transparent",
                        color: duration === d.seconds ? "#A855F7" : "#9CA3AF",
                        border: duration === d.seconds ? "1px solid rgba(139,92,246,0.4)" : "1px solid #1E1E2E",
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Fee breakdown */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2 mb-5">
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary">Platform Fee ({platformFee}%)</span>
              <span className="text-text-muted">{feeBreakdown.platformAmount.toFixed(4)} ETH</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary">Creator Royalty ({royaltyPercent}%)</span>
              <span className="text-text-muted">{feeBreakdown.royaltyAmount.toFixed(4)} ETH</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-text-primary">You Receive</span>
              <span className="font-bold gradient-text">{feeBreakdown.youReceive.toFixed(4)} ETH</span>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!activePrice || priceNum <= 0}
            className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
          >
            Complete Listing
          </button>
        </>
      )}
    </ModalWrapper>
  );
}
