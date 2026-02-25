"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useAccount } from "wagmi";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { shortenAddress } from "@/lib/contracts";

export default function ActivityPage() {
  const { address } = useAccount();
  const getTransactionsForAddress = useTransactionStore((s) => s.getTransactionsForAddress);
  const transactions = getTransactionsForAddress(address);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2 mb-6">
        <Activity size={24} /> Hoạt động
      </h1>

      {!address ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 border border-dashed border-border rounded-2xl"
        >
          <p className="text-text-muted">Kết nối ví để xem lịch sử hoạt động của bạn.</p>
        </motion.div>
      ) : transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 border border-dashed border-border rounded-2xl"
        >
          <Activity size={40} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-muted">Chưa có hoạt động nào</p>
          <p className="text-xs text-text-muted mt-1">
            Khi bạn tạo, mua hoặc bán NFT, hoạt động sẽ hiển thị ở đây.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.hash}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{tx.description}</p>
                <p className="text-xs text-text-muted font-mono mt-1">{shortenAddress(tx.hash)}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-lg"
                  style={{
                    color: tx.status === "confirmed" ? "#10B981" : tx.status === "failed" ? "#EF4444" : "#F59E0B",
                    background: tx.status === "confirmed" ? "rgba(16,185,129,0.1)" : tx.status === "failed" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                  }}
                >
                  {tx.status === "confirmed" ? "Thành công" : tx.status === "failed" ? "Thất bại" : "Đang xử lý"}
                </span>
                <p className="text-[10px] text-text-muted mt-1">
                  {new Date(tx.timestamp).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
