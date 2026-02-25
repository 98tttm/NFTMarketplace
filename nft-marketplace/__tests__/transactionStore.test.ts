import { useTransactionStore } from "@/stores/useTransactionStore";

describe("useTransactionStore", () => {
  beforeEach(() => {
    useTransactionStore.setState({ transactions: [], isPanelOpen: false });
  });

  it("adds a transaction", () => {
    const store = useTransactionStore.getState();
    store.addTransaction({
      hash: "0xabc",
      description: "Test tx",
      status: "pending",
      chainId: 11155111,
      explorerUrl: "https://sepolia.etherscan.io/tx/0xabc",
    });

    const txs = useTransactionStore.getState().transactions;
    expect(txs).toHaveLength(1);
    expect(txs[0].hash).toBe("0xabc");
    expect(txs[0].status).toBe("pending");
  });

  it("updates a transaction status", () => {
    const store = useTransactionStore.getState();
    store.addTransaction({
      hash: "0xdef",
      description: "Confirm tx",
      status: "pending",
      chainId: 11155111,
      explorerUrl: "https://sepolia.etherscan.io/tx/0xdef",
    });

    store.updateTransaction("0xdef", { status: "confirmed" });
    const tx = useTransactionStore.getState().transactions.find((t) => t.hash === "0xdef");
    expect(tx?.status).toBe("confirmed");
  });

  it("limits transactions to 50", () => {
    const store = useTransactionStore.getState();
    for (let i = 0; i < 55; i++) {
      store.addTransaction({
        hash: `0x${i}`,
        description: `Tx ${i}`,
        status: "confirmed",
        chainId: 11155111,
        explorerUrl: `https://sepolia.etherscan.io/tx/0x${i}`,
      });
    }

    expect(useTransactionStore.getState().transactions.length).toBeLessThanOrEqual(50);
  });

  it("clears all transactions", () => {
    const store = useTransactionStore.getState();
    store.addTransaction({
      hash: "0x1",
      description: "Tx",
      status: "pending",
      chainId: 11155111,
      explorerUrl: "",
    });

    store.clearAll();
    expect(useTransactionStore.getState().transactions).toHaveLength(0);
  });

  it("toggles panel", () => {
    const store = useTransactionStore.getState();
    expect(store.isPanelOpen).toBe(false);

    store.togglePanel();
    expect(useTransactionStore.getState().isPanelOpen).toBe(true);

    store.togglePanel();
    expect(useTransactionStore.getState().isPanelOpen).toBe(false);
  });

  it("counts pending transactions", () => {
    const store = useTransactionStore.getState();
    store.addTransaction({ hash: "0xa", description: "a", status: "pending", chainId: 1, explorerUrl: "" });
    store.addTransaction({ hash: "0xb", description: "b", status: "confirmed", chainId: 1, explorerUrl: "" });
    store.addTransaction({ hash: "0xc", description: "c", status: "pending", chainId: 1, explorerUrl: "" });

    expect(useTransactionStore.getState().pendingCount()).toBe(2);
  });
});
