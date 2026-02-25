"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Clock,
} from "lucide-react";
import { useTransactionStore, type TrackedTransaction } from "@/stores/useTransactionStore";
import { formatDistanceToNow } from "@/lib/utils";

const STATUS_CONFIG: Record<
  TrackedTransaction["status"],
  { icon: typeof CheckCircle2; color: string; label: string }
> = {
  pending: { icon: Loader2, color: "#F59E0B", label: "Pending" },
  confirmed: { icon: CheckCircle2, color: "#10B981", label: "Confirmed" },
  failed: { icon: XCircle, color: "#EF4444", label: "Failed" },
};

function TxItem({ tx }: { tx: TrackedTransaction }) {
  const cfg = STATUS_CONFIG[tx.status];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-start gap-3 rounded-xl border border-border bg-surface/50 p-3"
    >
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${cfg.color}15` }}
      >
        <Icon
          size={16}
          style={{ color: cfg.color }}
          className={tx.status === "pending" ? "animate-spin" : ""}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">
          {tx.description}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
          <span style={{ color: cfg.color }}>{cfg.label}</span>
          <span>·</span>
          <span>{formatDistanceToNow(tx.timestamp)}</span>
        </div>
        {tx.errorMessage && tx.status === "failed" && (
          <p className="mt-1 text-xs text-error truncate">{tx.errorMessage}</p>
        )}
      </div>
      <a
        href={tx.explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-primary"
        title="View on Etherscan"
      >
        <ExternalLink size={14} />
      </a>
    </motion.div>
  );
}

export function TransactionPanel() {
  const { transactions, isPanelOpen, setPanel, clearAll } = useTransactionStore();

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPanel(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                <h2 className="text-base font-bold text-text-primary">
                  Transactions
                </h2>
                {transactions.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {transactions.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {transactions.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-error"
                    title="Clear all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setPanel(false)}
                  className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
                    <Clock size={24} className="text-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">
                    No transactions yet
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Your transaction history will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {transactions.map((tx) => (
                      <TxItem key={tx.hash} tx={tx} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function TransactionButton() {
  const { transactions, togglePanel } = useTransactionStore();
  const pendingCount = transactions.filter((t) => t.status === "pending").length;

  return (
    <button
      onClick={togglePanel}
      className="relative flex items-center gap-1.5 rounded-xl border border-border bg-surface/50 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
      title="Transaction history"
    >
      <Clock size={14} />
      <span className="hidden sm:inline">Txns</span>
      {pendingCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-black"
        >
          {pendingCount}
        </motion.span>
      )}
    </button>
  );
}
