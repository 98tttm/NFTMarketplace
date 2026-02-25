import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, hardhat } from "wagmi/chains";
import { http } from "wagmi";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "placeholder_for_build";
const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 31337;

const sepoliaRpc = alchemyKey
  ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`
  : sepolia.rpcUrls.default.http[0];

export const config = chainId === 31337
  ? getDefaultConfig({
      appName: "NFT Marketplace",
      projectId,
      chains: [hardhat],
      transports: { [hardhat.id]: http("http://127.0.0.1:8545") },
      ssr: true,
    })
  : getDefaultConfig({
      appName: "NFT Marketplace",
      projectId,
      chains: [sepolia],
      transports: { [sepolia.id]: http(sepoliaRpc) },
      ssr: true,
    });
