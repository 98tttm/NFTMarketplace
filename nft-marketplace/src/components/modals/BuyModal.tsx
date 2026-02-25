"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, ShoppingBag } from "lucide-react";
import { ModalWrapper } from "./ModalWrapper";

type BuyStatus = "idle" | "pending" | "success" | "error";

interface BuyModalProps {
  open: boolean;
  onClose: () => void;
  nftName: string;
  nftImage: string;
  priceEth: string;
  onConfirm: () => Promise<void>;
}

export function BuyModal({
  open,
  onClose,
  nftName,
  nftImage,
  priceEth,
  onConfirm,
}: BuyModalProps) {
  const [status, setStatus] = useState<BuyStatus>("idle");

  const gasEstimate = "0.002";
  const total = (parseFloat(priceEth) + parseFloat(gasEstimate)).toFixed(4);

  async function handleConfirm() {
    try {
      setStatus("pending");
      await onConfirm();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function handleClose() {
    if (status !== "pending") {
      setStatus("idle");
      onClose();
    }
  }

  return (
    <ModalWrapper open={open} onClose={handleClose} title="Complete Purchase">
      {/* NFT preview */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface">
          <Image src={nftImage} alt={nftName} fill sizes="64px" className="object-cover" unoptimized />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text-primary truncate">{nftName}</h3>
          <p className="text-xs text-text-muted">Confirm your purchase</p>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Item Price</span>
          <span className="font-semibold text-text-primary">{priceEth} ETH</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Gas Estimate</span>
          <span className="text-text-muted">~{gasEstimate} ETH</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-text-primary">Total</span>
          <span className="font-bold gradient-text">{total} ETH</span>
        </div>
      </div>

      {/* Status states */}
      {status === "pending" && (
        <div className="flex flex-col items-center py-4 mb-4">
          <Loader2 size={32} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-text-secondary">Confirming transaction...</p>
          <p className="text-xs text-text-muted mt-1">Please wait and don&apos;t close this window</p>
        </div>
      )}

      {status === "success" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center py-4 mb-4"
        >
          <CheckCircle2 size={48} className="text-success mb-3" />
          <p className="text-lg font-bold text-text-primary">Purchase Complete!</p>
          <p className="text-xs text-text-muted mt-1">The NFT is now in your wallet</p>
        </motion.div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center py-4 mb-4">
          <XCircle size={48} className="text-danger mb-3" />
          <p className="text-sm font-semibold text-danger">Transaction Failed</p>
          <p className="text-xs text-text-muted mt-1">Insufficient balance or transaction rejected</p>
        </div>
      )}

      {/* Actions */}
      {status === "idle" && (
        <button
          onClick={handleConfirm}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
        >
          <ShoppingBag size={16} /> Confirm Purchase
        </button>
      )}

      {status === "error" && (
        <button
          onClick={() => setStatus("idle")}
          className="w-full rounded-xl border border-border py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface"
        >
          Try Again
        </button>
      )}

      {status === "success" && (
        <button
          onClick={handleClose}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
        >
          Done
        </button>
      )}
    </ModalWrapper>
  );
}
