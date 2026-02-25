import toast from "react-hot-toast";
import { getEtherscanUrl } from "./contracts";
import { useTransactionStore, type TxStatus } from "@/stores/useTransactionStore";
import { useBalanceRefetchStore } from "@/stores/useBalanceRefetchStore";

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 31337;

function trackTx(
  hash: string,
  description: string,
  status: TxStatus,
  chainId = CHAIN_ID,
  errorMessage?: string,
  userAddress?: string
) {
  const store = useTransactionStore.getState();
  const existing = store.transactions.find((t) => t.hash === hash);
  if (existing) {
    store.updateTransaction(hash, { status, errorMessage, ...(userAddress != null && { userAddress }) });
  } else {
    store.addTransaction({
      hash,
      description,
      status,
      chainId,
      explorerUrl: getEtherscanUrl(hash, "tx"),
      errorMessage,
      userAddress,
    });
  }
}

export function txPending(hash: string, message = "Transaction pending...", userAddress?: string) {
  trackTx(hash, message, "pending", undefined, undefined, userAddress);
  useBalanceRefetchStore.getState().triggerRefetch();
  return toast.loading(message, {
    id: hash,
    duration: Infinity,
  });
}

export function txSuccess(hash: string, message = "Transaction confirmed!", userAddress?: string) {
  trackTx(hash, message, "confirmed", undefined, undefined, userAddress);
  useBalanceRefetchStore.getState().triggerRefetch();
  return toast.success(message, {
    id: hash,
    duration: 5000,
  });
}

export function txError(hashOrId: string, message = "Transaction failed", userAddress?: string) {
  trackTx(hashOrId, message, "failed", CHAIN_ID, message, userAddress);
  return toast.error(message, {
    id: hashOrId,
    duration: 5000,
  });
}

export function showSuccess(message: string) {
  return toast.success(message);
}

export function showError(message: string) {
  return toast.error(message);
}

export function parseTxError(error: unknown): string {
  if (!error) return "Unknown error";

  const err = error as Error & {
    walk?: (fn: (e: unknown) => boolean) => unknown;
    shortMessage?: string;
    cause?: { reason?: string; shortMessage?: string; data?: { errorName?: string } };
  };

  if (err.shortMessage && !err.shortMessage.includes("Internal error")) {
    return err.shortMessage;
  }

  if (typeof err.walk === "function") {
    try {
      const revertErr = err.walk((e: unknown) => {
        const name = (e as Error)?.constructor?.name;
        return name === "ContractFunctionRevertedError" || name === "ContractFunctionExecutionError";
      }) as typeof err | null;
      if (revertErr) {
        if (revertErr.cause?.reason) return revertErr.cause.reason;
        if (revertErr.cause?.data?.errorName) return revertErr.cause.data.errorName;
        if (revertErr.shortMessage && !revertErr.shortMessage.includes("Internal error")) return revertErr.shortMessage;
      }
    } catch (_) {}
  }

  const msg = error instanceof Error ? error.message : String(error);

  const reasonMatch = msg.match(/reverted with reason string '([^']+)'/);
  if (reasonMatch) return reasonMatch[1];
  const reasonMatch2 = msg.match(/reason="([^"]+)"/);
  if (reasonMatch2) return reasonMatch2[1];

  if (msg.includes("user rejected") || msg.includes("User denied")) {
    return "Transaction rejected by user";
  }
  if (msg.includes("insufficient funds")) {
    return "Insufficient funds for transaction";
  }
  if (msg.includes("nonce too low")) {
    return "Transaction nonce conflict — please try again";
  }
  if (msg.includes("replacement fee too low") || msg.includes("underpriced")) {
    return "Gas price too low — please try again with higher gas";
  }
  if (msg.includes("already known")) {
    return "Transaction already submitted — please wait";
  }
  if (msg.includes("execution reverted")) {
    const match = msg.match(/reason="([^"]+)"/);
    return match ? match[1] : "Transaction reverted by contract";
  }
  if (msg.toLowerCase().includes("metamask") || msg.toLowerCase().includes("no provider")) {
    return "No wallet detected — please install MetaMask";
  }

  return msg.length > 120 ? msg.slice(0, 120) + "..." : msg;
}
