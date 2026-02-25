# NFT Marketplace — Setup Guide

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MetaMask** browser extension
- **Git**

---

## 1. Clone & Install

```bash
git clone https://github.com/98tttm/NFTMarketplace.git
cd NFTMarketplace/nft-marketplace
npm install --legacy-peer-deps
```

## 2. Get API Keys

### Alchemy (RPC Provider)
1. Sign up at [alchemy.com](https://www.alchemy.com/)
2. Create a new app, select **Ethereum** → **Sepolia**
3. Copy the **API Key**

### Pinata (IPFS Storage)
1. Sign up at [pinata.cloud](https://www.pinata.cloud/)
2. Go to API Keys → New Key
3. Copy the **API Key**, **API Secret**, and **JWT**

### WalletConnect
1. Sign up at [cloud.walletconnect.com](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the **Project ID**

### Etherscan (Contract Verification)
1. Sign up at [etherscan.io](https://etherscan.io/)
2. Go to API Keys → Add
3. Copy the **API Key**

## 3. Environment Variables

Create `.env.local` in the project root:

```env
# Blockchain
ALCHEMY_API_KEY=your_alchemy_api_key
DEPLOYER_PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# Frontend (NEXT_PUBLIC_ prefix = accessible in browser)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# IPFS
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret
PINATA_JWT=your_pinata_jwt

# Contract Addresses (filled after deployment)
NEXT_PUBLIC_NFT_COLLECTION_ADDRESS=
NEXT_PUBLIC_MARKETPLACE_ADDRESS=
NEXT_PUBLIC_AUCTION_ADDRESS=
```

> **Warning:** Never commit `.env.local` or expose your `DEPLOYER_PRIVATE_KEY`.

## 4. Fund Your Wallet

1. Export your wallet's private key from MetaMask
2. Get Sepolia test ETH from a faucet:
   - [sepoliafaucet.com](https://sepoliafaucet.com/)
   - [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)

## 5. Compile & Deploy Smart Contracts

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia
```

After deployment, copy the contract addresses from the terminal output into your `.env.local`:

```env
NEXT_PUBLIC_NFT_COLLECTION_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_AUCTION_ADDRESS=0x...
```

### (Optional) Seed demo data

```bash
npm run seed:sepolia
```

## 6. Run the Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 7. Run Tests

```bash
# Unit tests
npm run test

# E2E tests (requires build first)
npm run build
npm run test:e2e

# Smart contract tests
npm run test:contracts
```

---

## Deployment to Vercel

1. Push your repo to GitHub
2. Import the project on [vercel.com](https://vercel.com/)
3. Set environment variables in Vercel dashboard (all `NEXT_PUBLIC_*` vars)
4. Deploy — Vercel auto-detects Next.js

---

## Project Structure

```
nft-marketplace/
├── contracts/           # Solidity smart contracts
├── scripts/             # Deploy & seed scripts
├── deployments/         # Deployment output (auto-generated)
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   ├── config/          # Wagmi, contract addresses, ABIs
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities (animations, contracts, toast)
│   ├── stores/          # Zustand stores
│   └── types/           # TypeScript type definitions
├── e2e/                 # Playwright E2E tests
├── __tests__/           # Jest unit tests
├── .github/workflows/   # CI/CD pipeline
└── vercel.json          # Vercel configuration
```
