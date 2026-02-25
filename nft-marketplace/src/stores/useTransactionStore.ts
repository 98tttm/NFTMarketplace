import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TxStatus = "pending" | "confirmed" | "failed";

export interface TrackedTransaction {
  hash: string;
  description: string;
  status: TxStatus;
  timestamp: number;
  chainId: number;
  explorerUrl: string;
  errorMessage?: string;
  /** Địa chỉ ví của người thực hiện giao dịch (để lọc Hoạt động theo ví kết nối) */
  userAddress?: string;
}

interface TransactionState {
  transactions: TrackedTransaction[];
  isPanelOpen: boolean;
  addTransaction: (tx: Omit<TrackedTransaction, "timestamp">) => void;
  updateTransaction: (hash: string, updates: Partial<TrackedTransaction>) => void;
  clearAll: () => void;
  togglePanel: () => void;
  setPanel: (open: boolean) => void;
  pendingCount: () => number;
  getTransactionsForAddress: (address: string | undefined) => TrackedTransaction[];
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      isPanelOpen: false,

      addTransaction: (tx) =>
        set((state) => ({
          transactions: [
            { ...tx, timestamp: Date.now() },
            ...state.transactions,
          ].slice(0, 50),
        })),
      getTransactionsForAddress: (addr: string | undefined) =>
        addr
          ? get().transactions.filter(
              (tx) => tx.userAddress?.toLowerCase() === addr.toLowerCase()
            )
          : get().transactions,

      updateTransaction: (hash, updates) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.hash === hash ? { ...tx, ...updates } : tx
          ),
        })),

      clearAll: () => set({ transactions: [] }),

      togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

      setPanel: (open) => set({ isPanelOpen: open }),

      pendingCount: () =>
        get().transactions.filter((tx) => tx.status === "pending").length,
    }),
    {
      name: "nft-marketplace-transactions",
      partialize: (state) => ({ transactions: state.transactions }),
    }
  )
);
