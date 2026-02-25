"use client";

import { useState, useMemo } from "react";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { ModalWrapper } from "./ModalWrapper";
import type { BidHistory } from "@/types";
import { shortenAddress } from "@/lib/contracts";

type BidStatus = "idle" | "pending" | "success" | "error";

interface BidModalProps {
  open: boolean;
  onClose: () => void;
  nftName: string;
  minimumBid: string;
  currentBid: string;
  bids: BidHistory[];
  onConfirm: (amount: string) => Promise<void>;
}

export function BidModal({
  open,
  onClose,
  nftName,
  minimumBid,
  currentBid,
  bids,
  onConfirm,
}: BidModalProps) {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<BidStatus>("idle");

  const amountNum = parseFloat(amount || "0");
  const minNum = parseFloat(minimumBid || "0");
  const belowMinimum = amount !== "" && amountNum < minNum;
  const gasEstimate = "0.003";

  const usdEquiv = useMemo(() => {
    if (!amountNum) return "$0.00";
    return `$${(amountNum * 2800).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [amountNum]);

  async function handleConfirm() {
    if (belowMinimum || !amount) return;
    try {
      setStatus("pending");
      await onConfirm(amount);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function handleClose() {
    if (status !== "pending") {
      setStatus("idle");
      setAmount("");
      onClose();
    }
  }

  return (
    <ModalWrapper open={open} onClose={handleClose} title={`Place Bid — ${nftName}`}>
      {status === "pending" && (
        <div className="flex flex-col items-center py-8">
          <Loader2 size={32} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-text-secondary">Placing your bid...</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center py-8">
          <CheckCircle2 size={48} className="text-success mb-3" />
          <p className="text-lg font-bold text-text-primary">Bid Placed!</p>
          <p className="text-xs text-text-muted mt-1">Your bid of {amount} ETH has been submitted</p>
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
          <p className="text-sm font-semibold text-danger">Bid Failed</p>
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
          {/* Current bid info */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 mb-5">
            <span className="text-xs text-text-muted">Current Bid</span>
            <span className="text-sm font-bold gradient-text">{currentBid} ETH</span>
          </div>

          {/* Bid input */}
          <div className="mb-1">
            <label className="text-xs text-text-muted mb-1.5 block">Your Bid (ETH)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={minimumBid}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                {usdEquiv}
              </span>
            </div>
          </div>

          {/* Minimum warning */}
          {belowMinimum && (
            <div className="flex items-center gap-1.5 text-xs text-warning mb-4">
              <AlertTriangle size={12} /> Minimum bid is {minimumBid} ETH
            </div>
          )}
          {!belowMinimum && <div className="mb-4" />}

          {/* Summary */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Your Bid</span>
              <span className="text-text-primary font-medium">{amount || "0"} ETH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Gas Estimate</span>
              <span className="text-text-muted">~{gasEstimate} ETH</span>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleConfirm}
            disabled={!amount || belowMinimum}
            className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
          >
            Place Bid
          </button>

          {/* Recent bids */}
          {bids.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wider">
                Recent Bids
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {bids.slice(0, 5).map((b, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{shortenAddress(b.bidder)}</span>
                    <span className="font-medium text-text-primary">
                      {(Number(b.amount) / 1e18).toFixed(4)} ETH
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </ModalWrapper>
  );
}
