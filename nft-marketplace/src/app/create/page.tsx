"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Upload, X, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMintNFT, useMintFee } from "@/hooks/useNFT";
import { formatPrice } from "@/lib/contracts";

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { mint, step: mintStep, error: mintError, reset: resetMint } = useMintNFT();
  const { data: mintFeeRaw } = useMintFee();
  const mintFee = mintFeeRaw ? formatPrice(mintFeeRaw as bigint) : "0.001";

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [royalty, setRoyalty] = useState("5");
  const fileRef = useRef<HTMLInputElement>(null);

  const isMinting = mintStep !== "idle" && mintStep !== "success" && mintStep !== "error";

  const handleFile = useCallback((f: File) => {
    if (f.size > 100 * 1024 * 1024) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name.trim() || !isConnected) return;

    await mint({
      file,
      name: name.trim(),
      description: description.trim(),
      attributes: [],
      royaltyBps: Math.round(Number(royalty) * 100),
      mintFee,
    });
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Tạo NFT</h1>
        <p className="text-text-muted mb-6">Kết nối ví để bắt đầu tạo NFT</p>
        <ConnectButton />
      </div>
    );
  }

  if (mintStep === "success") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle size={64} className="mx-auto text-success mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Tạo NFT thành công!</h2>
          <p className="text-text-muted mb-6">NFT của bạn đã được tạo trên blockchain.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => router.push(`/profile/${address}`)}
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
            >
              Xem NFT của tôi
            </button>
            <button
              onClick={() => { resetMint(); setFile(null); setPreview(null); setName(""); setDescription(""); }}
              className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:border-primary transition-colors"
            >
              Tạo thêm
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Tạo NFT mới</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Ảnh NFT *</label>
          {preview ? (
            <div className="relative w-full max-w-xs mx-auto">
              <div className="relative aspect-square rounded-xl overflow-hidden border border-border">
                <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
              </div>
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-danger flex items-center justify-center text-white"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-border bg-surface/50 cursor-pointer hover:border-primary transition-colors"
            >
              <Upload size={32} className="text-text-muted mb-2" />
              <p className="text-sm text-text-muted">Kéo thả hoặc <span className="text-primary font-semibold">chọn ảnh</span></p>
              <p className="text-xs text-text-muted mt-1">JPG, PNG, GIF, SVG (tối đa 100MB)</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Tên NFT *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Bức tranh kỹ thuật số #1"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả về NFT của bạn..."
            rows={3}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Royalty */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Phí bản quyền (%)</label>
          <input
            type="number"
            value={royalty}
            onChange={(e) => setRoyalty(e.target.value)}
            min="0"
            max="10"
            step="0.5"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
          />
          <p className="text-xs text-text-muted mt-1">Bạn nhận {royalty}% mỗi lần NFT được bán lại (tối đa 10%)</p>
        </div>

        {/* Info */}
        <div className="rounded-xl bg-surface/50 border border-border p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-muted">Phí tạo NFT</span>
            <span className="text-text-primary font-medium">{mintFee} ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Blockchain</span>
            <span className="text-text-primary font-medium">Ethereum</span>
          </div>
        </div>

        {/* Error */}
        {mintStep === "error" && mintError && (
          <div className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 p-3">
            <AlertTriangle size={16} className="text-danger shrink-0" />
            <p className="text-sm text-danger">{mintError}</p>
          </div>
        )}

        {/* Minting Progress */}
        {isMinting && (
          <div className="flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 p-4">
            <Loader2 size={20} className="animate-spin text-primary" />
            <p className="text-sm text-text-primary">
              {mintStep === "uploading-image" && "Đang tải ảnh lên IPFS..."}
              {mintStep === "uploading-metadata" && "Đang tạo metadata..."}
              {mintStep === "awaiting-wallet" && "Đang chờ ví xác nhận..."}
              {mintStep === "minting" && "Đang tạo NFT trên blockchain..."}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!file || !name.trim() || isMinting}
          className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
        >
          {isMinting ? "Đang xử lý..." : "Tạo NFT"}
        </button>
      </form>
    </div>
  );
}
