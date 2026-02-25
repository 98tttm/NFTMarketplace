"use client";

import { useState, useCallback, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { type Address, parseEther } from "viem";
import { useQuery } from "@tanstack/react-query";
import { nftCollectionConfig, getNFTContractConfig } from "@/lib/contracts";
import { uploadImageToIPFS, uploadMetadataToIPFS, resolveIPFS, fetchMetadataFromIPFS } from "@/lib/ipfs";
import { txPending, txSuccess, txError, parseTxError } from "@/lib/toast";
import type { NFTMetadata } from "@/types";

export type MintStep = "idle" | "uploading-image" | "uploading-metadata" | "awaiting-wallet" | "minting" | "success" | "error";

export function useMintNFT() {
  const { address } = useAccount();
  const [step, setStep] = useState<MintStep>("idle");
  const [txHash, setTxHash] = useState<string>();
  const [error, setError] = useState<string>();

  const { writeContractAsync } = useWriteContract();

  const mint = useCallback(
    async (params: {
      file: File;
      name: string;
      description: string;
      attributes: { trait_type: string; value: string | number }[];
      royaltyBps: number;
      mintFee: string;
    }) => {
      if (!address) {
        setError("Wallet not connected");
        return;
      }

      try {
        setStep("uploading-image");
        setError(undefined);
        const imageCid = await uploadImageToIPFS(params.file);

        setStep("uploading-metadata");
        const metadata: NFTMetadata = {
          name: params.name,
          description: params.description,
          image: `ipfs://${imageCid}`,
          attributes: params.attributes,
        };
        const metadataCid = await uploadMetadataToIPFS(metadata);
        const tokenURI = `ipfs://${metadataCid}`;

        setStep("awaiting-wallet");
        const hash = await writeContractAsync({
          ...nftCollectionConfig,
          functionName: "mint",
          args: [address, tokenURI, BigInt(params.royaltyBps)],
          value: parseEther(params.mintFee),
        });

        setTxHash(hash);
        setStep("minting");
        txPending(hash, "Minting your NFT...");

        return hash;
      } catch (err) {
        const msg = parseTxError(err);
        setError(msg);
        setStep("error");
        txError("mint-error", msg);
      }
    },
    [address, writeContractAsync]
  );

  const { isSuccess } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  useEffect(() => {
    if (isSuccess && step === "minting") {
      setStep("success");
      txSuccess(txHash!, "NFT minted successfully!");
    }
  }, [isSuccess, step, txHash]);

  const reset = useCallback(() => {
    setStep("idle");
    setTxHash(undefined);
    setError(undefined);
  }, []);

  return { mint, step, txHash, error, isSuccess, reset };
}

export function useNFTsByOwner(ownerAddress?: string) {
  return useReadContract({
    ...nftCollectionConfig,
    functionName: "tokensByOwner",
    args: ownerAddress ? [ownerAddress as Address] : undefined,
    query: { enabled: !!ownerAddress },
  });
}

export function useNFTMetadata(tokenURI?: string) {
  return useQuery({
    queryKey: ["nft-metadata", tokenURI],
    queryFn: () => fetchMetadataFromIPFS(tokenURI!),
    enabled: !!tokenURI,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useTokenURI(tokenId?: number) {
  return useReadContract({
    ...nftCollectionConfig,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

export function useApproveNFT() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<string>();

  const approve = useCallback(
    async (nftContract: string, spender: string, tokenId: number) => {
      try {
        const hash = await writeContractAsync({
          ...getNFTContractConfig(nftContract),
          functionName: "approve",
          args: [spender as Address, BigInt(tokenId)],
        });
        setTxHash(hash);
        txPending(hash, "Approving NFT...");
        return hash;
      } catch (err) {
        txError("approve-error", parseTxError(err));
        throw err;
      }
    },
    [writeContractAsync]
  );

  const { isSuccess } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  useEffect(() => {
    if (isSuccess && txHash) {
      txSuccess(txHash, "NFT approved!");
    }
  }, [isSuccess, txHash]);

  return { approve, txHash, isSuccess };
}

export function useIsApproved(nftContract?: string, tokenId?: number, spender?: string) {
  return useReadContract({
    ...getNFTContractConfig(nftContract || ""),
    functionName: "getApproved",
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!nftContract && tokenId !== undefined,
      select: (data) => (data as string)?.toLowerCase() === spender?.toLowerCase(),
    },
  });
}

export function useMintFee() {
  return useReadContract({
    ...nftCollectionConfig,
    functionName: "mintFee",
  });
}
