import { create } from "zustand";

interface BalanceRefetchState {
  refetch: (() => void) | null;
  setRefetch: (fn: (() => void) | null) => void;
  triggerRefetch: () => void;
}

export const useBalanceRefetchStore = create<BalanceRefetchState>((set, get) => ({
  refetch: null,
  setRefetch: (fn) => set({ refetch: fn }),
  triggerRefetch: () => {
    const { refetch } = get();
    refetch?.();
  },
}));
