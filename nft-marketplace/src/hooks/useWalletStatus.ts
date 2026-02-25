"use client";

import { useMemo, useEffect } from "react";
import { useAccount, useBalance, useEnsName, useEnsAvatar, useSwitchChain } from "wagmi";
import { sepolia, hardhat } from "wagmi/chains";
import { formatEther } from "viem";
import { useBalanceRefetchStore } from "@/stores/useBalanceRefetchStore";

const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 31337;
const TARGET_CHAIN = TARGET_CHAIN_ID === 31337 ? hardhat : sepolia;

export function useWalletStatus() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const setRefetch = useBalanceRefetchStore((s) => s.setRefetch);

  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    query: {
      enabled: isConnected,
      refetchInterval: 3000,
    },
  });

  useEffect(() => {
    if (!isConnected) {
      setRefetch(null);
      return;
    }
    setRefetch(() => refetchBalance);
    return () => setRefetch(null);
  }, [isConnected, refetchBalance, setRefetch]);

  const { data: ensName } = useEnsName({
    address,
    chainId: 1,
    query: { enabled: isConnected && !!address && TARGET_CHAIN_ID !== 31337 },
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ?? undefined,
    chainId: 1,
    query: { enabled: !!ensName && TARGET_CHAIN_ID !== 31337 },
  });

  const isCorrectNetwork = chainId === TARGET_CHAIN_ID;

  const balance = useMemo(() => {
    if (!balanceData) return "0";
    return parseFloat(formatEther(balanceData.value)).toFixed(4);
  }, [balanceData]);

  const switchToTarget = () => {
    switchChain?.({ chainId: TARGET_CHAIN_ID });
  };

  return {
    isConnected,
    address: address ?? null,
    ensName: ensName ?? null,
    ensAvatar: ensAvatar ?? null,
    balance,
    chainId: chainId ?? null,
    isCorrectNetwork,
    targetChainId: TARGET_CHAIN_ID,
    targetChainName: TARGET_CHAIN.name,
    switchToTarget,
  };
}
