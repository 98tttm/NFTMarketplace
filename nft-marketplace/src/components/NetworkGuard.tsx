"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { useWalletStatus } from "@/hooks/useWalletStatus";

interface NetworkGuardProps {
  children: React.ReactNode;
}

export function NetworkGuard({ children }: NetworkGuardProps) {
  const { isConnected, isCorrectNetwork, targetChainName, switchToTarget } = useWalletStatus();

  const showOverlay = !isConnected || !isCorrectNetwork;

  return (
    <div className="relative">
      {children}

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-sm bg-background/70 rounded-2xl"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center text-center p-8 max-w-sm"
            >
              {!isConnected ? (
                <>
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl mb-5"
                    style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))" }}
                  >
                    <Wallet size={28} className="text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    Kết nối ví để tiếp tục
                  </h3>
                  <p className="text-sm text-text-muted mb-6">
                    Bạn cần kết nối ví để tương tác với blockchain.
                  </p>
                  <ConnectButton />
                </>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10 mb-5">
                    <AlertTriangle size={28} className="text-warning" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    Sai mạng
                  </h3>
                  <p className="text-sm text-text-muted mb-6">
                    Vui lòng chuyển sang <span className="text-primary font-semibold">{targetChainName}</span> để tiếp tục.
                  </p>
                  <button
                    onClick={switchToTarget}
                    className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
                  >
                    <ArrowRightLeft size={16} /> Switch to {targetChainName}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function NetworkBanner() {
  const { isConnected, isCorrectNetwork, targetChainName, switchToTarget } = useWalletStatus();

  if (!isConnected || isCorrectNetwork) return null;

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-warning/10 border-b border-warning/20 px-4 py-2.5"
    >
      <AlertTriangle size={14} className="text-warning" />
      <span className="text-xs text-warning font-medium">
        Bạn đang ở sai mạng.
      </span>
      <button
        onClick={switchToTarget}
        className="rounded-lg bg-warning/20 px-3 py-1 text-xs font-semibold text-warning hover:bg-warning/30 transition-colors"
      >
        Chuyển sang {targetChainName}
      </button>
    </motion.div>
  );
}
