# NFT Marketplace

A production-grade, full-stack NFT Marketplace built on Ethereum (Sepolia Testnet). Mint, list, buy, auction, and trade ERC-721 NFTs with a modern, responsive UI and complete Web3 integration.

---

## Live Demo

> Deploy to Vercel and connect your wallet to try it out.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | Framework — SSR, routing, API |
| **TypeScript** | Type safety across the codebase |
| **Tailwind CSS v4** | Utility-first styling with custom dark theme |
| **Framer Motion** | Page transitions, scroll reveals, micro-interactions |
| **RainbowKit v2** | Wallet connection modal (MetaMask, WalletConnect, Coinbase, Rainbow) |
| **Wagmi v2** | React hooks for Ethereum (read/write contracts, balances, ENS) |
| **Viem** | Low-level Ethereum interaction |
| **TanStack React Query** | Data fetching, caching, and synchronization |
| **Zustand** | Lightweight state management (transactions, notifications) |
| **Recharts** | Charts for price history, volume analytics |
| **React Hook Form + Zod** | Form validation on the Create NFT page |
| **Lucide React** | Consistent icon system |

### Smart Contracts
| Technology | Purpose |
|---|---|
| **Solidity 0.8.20** | Smart contract language |
| **Hardhat 3** | Development environment, testing, deployment |
| **OpenZeppelin Contracts 5.x** | Battle-tested contract standards |
| **Ethers.js v6** | Contract interaction in scripts |

### Infrastructure
| Service | Purpose |
|---|---|
| **Alchemy** | Ethereum RPC provider |
| **Pinata / IPFS** | Decentralized metadata & image storage |
| **Etherscan** | Contract verification |
| **Vercel** | Frontend hosting |
| **GitHub Actions** | CI/CD pipeline |

---

## Smart Contracts

Three Solidity contracts form the marketplace backend:

### NFTCollection.sol
- **ERC-721** with URI storage and enumerable extensions
- **ERC-2981** royalty standard (creator-defined per token, up to 10%)
- Configurable mint fee paid to contract owner
- `Ownable`, `Pausable`, `ReentrancyGuard` security patterns
- Events: `NFTMinted`, `RoyaltySet`

### NFTMarketplace.sol
- Fixed-price NFT listings (list, buy, cancel)
- **2.5% platform fee** on every sale
- Automatic royalty distribution to original creators
- Listing management with price updates
- Events: `Listed`, `Sold`, `Cancelled`, `PriceUpdated`

### NFTAuction.sol
- English auction system with configurable duration
- **Anti-sniping**: extends auction by 10 minutes if bid placed in final 10 minutes
- Minimum bid increment: 5% above current highest bid
- Safe bid refunds to previous bidders
- Events: `AuctionCreated`, `BidPlaced`, `AuctionEnded`, `AuctionCancelled`

---

## Features

### Wallet & Web3
- Multi-wallet support via RainbowKit (MetaMask, WalletConnect, Coinbase Wallet, Rainbow)
- Custom dark theme matching the app design
- Network detection with auto-switch to Sepolia
- Network guard overlay for wrong-network state
- Transaction tracking with Zustand + localStorage persistence
- Transaction panel with pending/confirmed/failed status and Etherscan links
- Comprehensive error parsing (user rejected, insufficient funds, no MetaMask, reverted, etc.)

### Pages

| Page | Route | Description |
|---|---|---|
| **Home** | `/` | Hero section with animated stats, live auctions carousel, trending NFTs, top collections, featured artists, how it works, newsletter CTA |
| **Marketplace** | `/marketplace` | Browse NFTs with filter sidebar (status, price range, collections, categories), sort options, grid/list toggle, infinite scroll |
| **NFT Detail** | `/nft/[id]` | Large media viewer, tabbed info (description, properties, details), price/action box, price history chart, bid history, activity feed |
| **Create NFT** | `/create` | Multi-step wizard: media upload (drag & drop), details form, royalties & pricing, review & mint |
| **Profile** | `/profile/[address]` | Cover + avatar, user info, stats row, tabs (Collected, Created, On Sale, Favorited, Activity), edit profile drawer |
| **Collections Browse** | `/collections` | Search, filter, grid of collection cards with floor price, volume, items |
| **Collection Detail** | `/collection/[id]` | Banner, info, stats, tabs (Items grid, Activity, Analytics with charts) |
| **Activity** | `/activity` | Global event feed with filter chips, chain filter, infinite scroll, auto-refresh |
| **Rankings** | `/rankings` | Collections & artists tables with time period selector, sparkline charts, rank badges |
| **Search** | `/search?q=` | Full results page with tabs (All/NFTs/Collections/Users), sort, pagination |

### UI Components

| Component | Location | Features |
|---|---|---|
| `CountdownTimer` | `components/ui/` | DD:HH:MM:SS, color states (normal/warning/urgent), pulse animation |
| `PriceDisplay` | `components/ui/` | ETH + USD (CoinGecko, cached 60s), sm/md/lg sizes |
| `NFTSkeleton` | `components/ui/` | Shimmer animation skeleton matching NFTCard |
| `AddressDisplay` | `components/ui/` | Shortened/ENS, copy button, Etherscan link, blockies avatar |
| `GradientButton` | `components/ui/` | 3 variants, 4 sizes, loading spinner, shimmer + ripple effects |
| `Modal` | `components/ui/` | Framer Motion, blur backdrop, mobile sheet behavior |
| `InfiniteGrid` | `components/ui/` | Intersection Observer, loading/end states |
| `TraitBadge` | `components/ui/` | Glassmorphism, rarity color coding |
| `ScrollReveal` | `components/ui/` | Scroll-triggered whileInView animations |
| `SearchBar` | `components/layout/` | Command Palette modal (Ctrl+K), grouped results, recent/trending |
| `NetworkGuard` | `components/` | Connect wallet overlay, wrong-network banner |
| `TransactionPanel` | `components/` | Slide-out tx history with Etherscan links |
| `NotificationPanel` | `components/` | Notification center with preferences |

### Animations & Responsive
- Page transitions (fade + slide between routes)
- Scroll-triggered animations (`whileInView`)
- Animated gradient backgrounds, floating orbs
- `prefers-reduced-motion` support
- Mobile bottom navigation bar (Home, Explore, Create, Activity, Profile)
- `xs` breakpoint (375px) for small phones
- Touch-friendly 44px tap targets
- Safe area inset for iPhone notch

### SEO & Performance
- Dynamic Open Graph image generation
- JSON-LD structured data
- Sitemap + robots.txt
- Twitter card meta tags
- Bundle analysis (`npm run analyze`)
- Next.js Image optimization with IPFS gateway support
- Inter font via `next/font` (swap display)

---

## Project Structure

```
nft-marketplace/
├── contracts/                  # Solidity smart contracts
│   ├── NFTCollection.sol
│   ├── NFTMarketplace.sol
│   └── NFTAuction.sol
├── scripts/                    # Hardhat scripts
│   ├── deploy.ts               # Deploy all contracts + verify on Etherscan
│   └── seed.ts                 # Seed marketplace with demo NFTs
├── deployments/                # Auto-generated deployment output
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (providers, nav, footer)
│   │   ├── page.tsx            # Home page
│   │   ├── error.tsx           # Global error boundary
│   │   ├── loading.tsx         # Root loading state
│   │   ├── not-found.tsx       # 404 page
│   │   ├── robots.ts           # robots.txt generation
│   │   ├── sitemap.ts          # Sitemap generation
│   │   ├── opengraph-image.tsx # OG image generation
│   │   ├── marketplace/        # Marketplace browse
│   │   ├── nft/[id]/           # NFT detail
│   │   ├── create/             # Create/mint NFT
│   │   ├── profile/[address]/  # User profile
│   │   ├── collections/        # Collections browse
│   │   ├── collection/[id]/    # Collection detail
│   │   ├── activity/           # Global activity feed
│   │   ├── rankings/           # Rankings page
│   │   └── search/             # Search results
│   ├── components/
│   │   ├── ui/                 # Shared UI components (Button, Modal, etc.)
│   │   ├── layout/             # Navbar, Footer, SearchBar, MobileNav
│   │   ├── home/               # Home page sections
│   │   ├── nft/                # NFTCard
│   │   ├── collection/         # CollectionCard
│   │   ├── marketplace/        # FilterSidebar, ActiveFilters, NFTListItem
│   │   ├── modals/             # BuyModal, BidModal, ListModal, EditProfileDrawer
│   │   ├── NetworkGuard.tsx    # Network detection overlay
│   │   ├── TransactionPanel.tsx
│   │   └── NotificationPanel.tsx
│   ├── config/                 # Wagmi config, contract addresses, ABIs
│   ├── hooks/                  # Custom hooks (useWalletStatus, useMarketplace, etc.)
│   ├── lib/                    # Utilities (animations, contracts, toast, utils)
│   ├── stores/                 # Zustand stores (transactions, notifications)
│   └── types/                  # TypeScript type definitions
├── __tests__/                  # Jest unit tests
├── e2e/                        # Playwright E2E tests
├── .github/workflows/ci.yml   # CI/CD pipeline
├── hardhat.config.ts
├── next.config.ts
├── jest.config.ts
├── playwright.config.ts
├── vercel.json
├── SETUP.md                    # Detailed setup guide
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- MetaMask browser extension

### Installation

```bash
git clone https://github.com/98tttm/NFTMarketplace.git
cd NFTMarketplace/nft-marketplace
npm install --legacy-peer-deps
```

### Environment Variables

Create `.env.local`:

```env
# Blockchain
ALCHEMY_API_KEY=your_alchemy_key
DEPLOYER_PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_key

# Frontend
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id

# IPFS
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret
PINATA_JWT=your_pinata_jwt

# Contract Addresses (after deployment)
NEXT_PUBLIC_NFT_COLLECTION_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_AUCTION_ADDRESS=0x...
```

### Deploy Contracts

```bash
npm run compile
npm run deploy:sepolia
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run compile` | Compile Solidity contracts |
| `npm run test:contracts` | Run Hardhat contract tests |
| `npm run deploy:sepolia` | Deploy contracts to Sepolia |
| `npm run seed:sepolia` | Seed marketplace with demo NFTs |
| `npm run test` | Run Jest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run analyze` | Bundle analysis |

---

## Testing

### Unit Tests (Jest)

37 tests across 3 suites:

- **utils.test.ts** — `formatDistanceToNow`, `cn`, `shortenAddress`, `formatPrice`, `parsePrice`, `getEtherscanUrl`, `parseTxError`
- **animations.test.ts** — All animation variant structures and properties
- **transactionStore.test.ts** — Zustand store: add, update, limit, clear, toggle, pendingCount

```bash
npm run test
```

### E2E Tests (Playwright)

10 specs covering:
- Homepage rendering & navigation
- Marketplace page with filters
- NFT detail page
- Search (Ctrl+K modal + results page)
- Collections, Activity, Rankings pages

```bash
npm run test:e2e
```

---

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push to `main` and PR:

1. **Lint & Type Check** — ESLint + `tsc --noEmit`
2. **Unit Tests** — Jest with coverage
3. **Build** — Next.js production build
4. **E2E Tests** — Playwright (chromium)

---

## Deployment

### Vercel

1. Import repository on [vercel.com](https://vercel.com)
2. Set environment variables in dashboard
3. Deploy — Vercel auto-detects Next.js

### Smart Contracts

```bash
# Sepolia testnet
npm run deploy:sepolia

# Seed demo data
npm run seed:sepolia
```

Contracts are auto-verified on Etherscan after deployment.

---

## Checklist

### Blockchain Features
- [x] Wallet connect (MetaMask, WalletConnect, Coinbase, Rainbow)
- [x] Mint NFT (ERC-721 + IPFS)
- [x] Fixed price listing
- [x] Buy NFT
- [x] Create auction
- [x] Place bid (with anti-sniping)
- [x] End auction
- [x] Cancel listing / auction
- [x] Creator royalties (ERC-2981)
- [x] Platform fee (2.5%)
- [x] NFT transfer
- [x] Price history (from events)
- [x] Real-time bid updates

### UI Features
- [x] Home / Landing page
- [x] Marketplace browse with filters
- [x] NFT detail page
- [x] Mint / Create page
- [x] User profile page
- [x] Collections browse & detail
- [x] Global activity feed
- [x] Rankings page
- [x] Search (global — Command Palette)
- [x] Responsive (mobile, tablet, desktop)
- [x] Dark theme consistent
- [x] Loading skeletons
- [x] Error states
- [x] Empty states
- [x] Toast notifications
- [x] Transaction tracking
- [x] Notification system

### Code Quality
- [x] TypeScript strict mode
- [x] Smart contract unit tests
- [x] Frontend unit tests (37 tests)
- [x] E2E tests (Playwright)
- [x] ESLint configured
- [x] CI/CD pipeline (GitHub Actions)
- [x] SEO meta tags + OG images + JSON-LD
- [x] Accessibility (ARIA labels, keyboard nav, focus rings)
- [x] Performance optimized (bundle analyzer, image optimization, font swap)
- [x] `prefers-reduced-motion` respected

---

## License

MIT

---

## Author

Built as a production-grade NFT Marketplace demonstration project.
