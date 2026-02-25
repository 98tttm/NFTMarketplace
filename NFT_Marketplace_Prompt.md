# 🎨 NFT Blockchain Marketplace — Master Prompt

> **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Hardhat · Solidity · Ethers.js v6 · RainbowKit · Wagmi v2 · IPFS (Pinata) · The Graph · Framer Motion  
> **Network:** Ethereum Sepolia Testnet (→ Mainnet ready)  
> **Design Reference:** Figma — NFT Marketplace Community (dark theme, neon purple/blue gradient palette)

---

## 📁 PROJECT STRUCTURE

```
nft-marketplace/
├── contracts/                  # Solidity smart contracts
│   ├── NFTCollection.sol
│   ├── NFTMarketplace.sol
│   └── NFTAuction.sol
├── scripts/                    # Hardhat deploy scripts
├── test/                       # Contract unit tests
├── frontend/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Home / Landing
│   │   ├── marketplace/        # Browse all NFTs
│   │   ├── nft/[id]/           # NFT Detail page
│   │   ├── create/             # Mint NFT
│   │   ├── profile/[address]/  # User profile
│   │   ├── collections/        # All collections
│   │   ├── collection/[id]/    # Single collection
│   │   ├── activity/           # Global activity feed
│   │   └── rankings/           # Top creators/collections
│   ├── components/
│   │   ├── layout/             # Navbar, Footer, Sidebar
│   │   ├── nft/                # NFTCard, NFTGrid, NFTDetail
│   │   ├── auction/            # BidModal, BidHistory, Countdown
│   │   ├── wallet/             # ConnectButton, WalletModal
│   │   ├── profile/            # ProfileHeader, ProfileTabs
│   │   ├── ui/                 # Shared UI primitives
│   │   └── modals/             # BuyModal, ListModal, BidModal
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Blockchain utils, IPFS, helpers
│   ├── config/                 # Contract addresses, ABIs
│   └── types/                  # TypeScript interfaces
├── hardhat.config.ts
├── .env.local
└── package.json
```

---

## 🔷 PROMPT 1 — PROJECT SETUP & CONFIGURATION

```
You are an expert Web3/blockchain developer. Set up a production-grade NFT Marketplace project with the following exact configuration:

### Tech Stack
- Next.js 14 with App Router and TypeScript
- Tailwind CSS with custom dark theme configuration
- Hardhat for smart contract development
- Ethers.js v6 for blockchain interaction
- Wagmi v2 + RainbowKit for wallet connection
- Pinata SDK for IPFS metadata/image storage
- Framer Motion for animations
- React Query (TanStack Query) for data fetching/caching
- Zustand for global state management

### Initialize Project
Run the following setup:
1. `npx create-next-app@latest nft-marketplace --typescript --tailwind --app --src-dir --import-alias "@/*"`
2. Install dependencies:
   ```
   npm install ethers wagmi viem @rainbow-me/rainbowkit @tanstack/react-query zustand framer-motion
   npm install pinata axios lucide-react react-hot-toast
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```
3. Configure `tailwind.config.ts` with this exact theme:
   ```ts
   colors: {
     primary: { DEFAULT: '#8B5CF6', dark: '#6D28D9' },
     secondary: { DEFAULT: '#06B6D4', dark: '#0891B2' },
     accent: '#F59E0B',
     background: { DEFAULT: '#0A0A0F', card: '#13131A', border: '#1E1E2E' },
     surface: '#1A1A2E',
     neon: { purple: '#A855F7', blue: '#3B82F6', pink: '#EC4899' }
   }
   ```
4. Set up `providers.tsx` wrapping the app with WagmiConfig, RainbowKitProvider, QueryClientProvider
5. Configure RainbowKit to support: MetaMask, WalletConnect, Coinbase Wallet, Rainbow, Trust Wallet
6. Set up environment variables in `.env.local`:
   - NEXT_PUBLIC_CHAIN_ID, NEXT_PUBLIC_MARKETPLACE_ADDRESS, NEXT_PUBLIC_NFT_ADDRESS
   - PINATA_API_KEY, PINATA_SECRET_KEY, PINATA_JWT
   - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
   - ALCHEMY_API_KEY (for RPC)
7. Set up Hardhat config targeting Sepolia testnet with Alchemy RPC

Output the complete file tree, all config files, providers.tsx, and .env.example.
```

---

## 🔷 PROMPT 2 — SMART CONTRACTS

```
Write three production-ready Solidity smart contracts (v0.8.20, using OpenZeppelin 5.x):

### Contract 1: NFTCollection.sol (ERC-721)
- Inherits: ERC721, ERC721URIStorage, ERC721Royalty, Ownable, ReentrancyGuard
- Features:
  - `mint(address to, string memory tokenURI, uint96 royaltyFraction)` — public, requires payment of mintFee
  - `batchMint(address to, string[] memory tokenURIs, uint96 royaltyFraction)` — up to 10 at once
  - `setMintFee(uint256 fee)` — owner only
  - `withdraw()` — owner withdraws accumulated fees
  - `tokensByOwner(address owner)` — returns all tokenIds owned by address
  - ERC2981 royalty support (creator gets % of every secondary sale)
  - Supports IPFS metadata URIs
  - Events: `NFTMinted(uint256 indexed tokenId, address indexed creator, string tokenURI)`

### Contract 2: NFTMarketplace.sol
- Inherits: ReentrancyGuard, Ownable, Pausable
- Data Structures:
  ```solidity
  struct Listing {
    uint256 listingId;
    address nftContract;
    uint256 tokenId;
    address payable seller;
    uint256 price;
    bool active;
    uint256 listedAt;
  }
  ```
- Features:
  - `listNFT(address nftContract, uint256 tokenId, uint256 price)` — seller lists NFT; transfers NFT to marketplace contract; emits NFTListed
  - `buyNFT(uint256 listingId)` — buyer sends ETH; marketplace deducts platform fee (2.5%); pays royalty to creator; transfers ETH to seller; transfers NFT to buyer; emits NFTSold
  - `cancelListing(uint256 listingId)` — seller can cancel; NFT returned; emits ListingCancelled
  - `updatePrice(uint256 listingId, uint256 newPrice)` — seller updates price
  - `fetchMarketItems()` — returns all active listings
  - `fetchListingsByOwner(address owner)` — seller's active listings
  - `setPlatformFee(uint96 fee)` — owner (max 10%)
  - Events: NFTListed, NFTSold, ListingCancelled, PriceUpdated
  - Proper ERC721 interface checking via IERC721

### Contract 3: NFTAuction.sol
- Inherits: ReentrancyGuard, Ownable
- Data Structures:
  ```solidity
  struct Auction {
    uint256 auctionId;
    address nftContract;
    uint256 tokenId;
    address payable seller;
    uint256 startingPrice;
    uint256 highestBid;
    address payable highestBidder;
    uint256 endTime;       // unix timestamp
    bool ended;
    bool cancelled;
  }
  ```
- Features:
  - `createAuction(address nftContract, uint256 tokenId, uint256 startingPrice, uint256 durationSeconds)` — seller creates auction (min 1 hour, max 30 days); NFT locked in contract
  - `placeBid(uint256 auctionId)` — payable; bid must exceed highestBid by at least 5%; previous highestBidder refunded automatically
  - `endAuction(uint256 auctionId)` — callable by anyone after endTime; transfers NFT to winner; ETH to seller minus platform fee; royalties paid
  - `cancelAuction(uint256 auctionId)` — seller cancels before first bid; NFT returned
  - `getAuctionBids(uint256 auctionId)` — returns bid history array
  - Anti-sniping: if bid placed in last 5 minutes, extend auction by 5 minutes
  - Events: AuctionCreated, BidPlaced, AuctionEnded, AuctionCancelled

Write complete, commented Solidity code for all three contracts. Include all necessary imports, modifiers, and NatSpec documentation. Also write Hardhat deployment scripts (scripts/deploy.ts) that deploys all three contracts in sequence, saves addresses to a deployments.json file, and verifies on Etherscan.
```

---

## 🔷 PROMPT 3 — SMART CONTRACT TESTS

```
Write comprehensive Hardhat tests (TypeScript) for all three smart contracts:

For NFTCollection.sol test:
- Test minting with correct ETH fee
- Test minting fails without sufficient ETH
- Test tokenURI is set correctly
- Test royalty info returned correctly
- Test batch minting (success and failure cases)
- Test owner withdrawal of fees
- Test tokensByOwner returns correct results

For NFTMarketplace.sol test:
- Test listing an NFT (approval required flow)
- Test buying an NFT (fee split: platform + royalty + seller)
- Test cancel listing returns NFT
- Test price update
- Test fetchMarketItems returns only active listings
- Test platform fee calculation accuracy
- Test reentrancy protection

For NFTAuction.sol test:
- Test auction creation
- Test bid placement and outbidding
- Test auto-refund of previous bidder on outbid
- Test anti-sniping extension
- Test auction end transfers NFT and ETH correctly
- Test cancel before bids
- Test cannot cancel after bid
- Test bid below minimum increment rejected

Use ethers.js v6, Hardhat's time manipulation helpers (time.increase, time.latest), and chai assertions. Write 100% coverage tests.
```

---

## 🔷 PROMPT 4 — BLOCKCHAIN HOOKS & UTILITIES

```
Create all custom React hooks and utility functions for blockchain interaction:

### File: hooks/useMarketplace.ts
Custom hook exposing:
- `useListedNFTs()` — fetch all active marketplace listings via contract call + format results
- `useListNFT(nftContract, tokenId, price)` — list an NFT; handle approval then listing transaction with loading/error states
- `useBuyNFT(listingId, price)` — buy NFT; send ETH; return tx hash + receipt
- `useCancelListing(listingId)` — cancel listing
- `useUserListings(address)` — fetch listings by wallet address

### File: hooks/useAuction.ts
- `useActiveAuctions()` — fetch all live auctions; auto-refresh every 30s
- `useAuction(auctionId)` — single auction data with live countdown
- `useCreateAuction(...)` — create auction with form validation
- `usePlaceBid(auctionId, bidAmount)` — place bid; validate amount; handle tx
- `useEndAuction(auctionId)` — end expired auction

### File: hooks/useNFT.ts
- `useMintNFT()` — upload image to IPFS → upload metadata to IPFS → call mint() on contract; returns progress state
- `useNFTsByOwner(address)` — get all NFTs owned by address
- `useNFTMetadata(tokenURI)` — fetch and cache metadata from IPFS
- `useApproveNFT(nftContract, spender, tokenId)` — check and execute approval

### File: lib/ipfs.ts
- `uploadImageToIPFS(file: File): Promise<string>` — upload via Pinata, return IPFS CID
- `uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string>` — upload JSON metadata
- `getIPFSUrl(cid: string): string` — convert CID to gateway URL (cloudflare/pinata gateway)

### File: lib/contracts.ts
- `getMarketplaceContract(signerOrProvider)` — returns typed contract instance
- `getNFTContract(address, signerOrProvider)` — returns ERC721 typed instance
- `getAuctionContract(signerOrProvider)` — returns typed contract instance
- `formatNFTListing(raw)` — normalize raw contract data to TypeScript type
- `formatPrice(wei: bigint): string` — wei to ETH with 4 decimal places
- `parsePrice(eth: string): bigint` — ETH string to wei

### File: types/index.ts
Define complete TypeScript interfaces:
```ts
interface NFTMetadata { name, description, image, attributes: [{trait_type, value}] }
interface NFTListing { listingId, nftContract, tokenId, seller, price, metadata, active, listedAt }
interface AuctionItem { auctionId, tokenId, seller, startingPrice, highestBid, highestBidder, endTime, ended, metadata }
interface BidHistory { bidder, amount, timestamp, txHash }
interface UserProfile { address, username, bio, avatarUrl, coverUrl, totalVolume, nftsOwned, nftsListed }
```

Implement all hooks using `useReadContract`, `useWriteContract`, `useWaitForTransactionReceipt` from wagmi v2. Include proper TypeScript types, error handling, and toast notifications via react-hot-toast.
```

---

## 🔷 PROMPT 5 — GLOBAL LAYOUT & NAVIGATION

```
Build the global layout components with pixel-perfect dark design matching the NFT Marketplace Community Figma:

### Navbar (components/layout/Navbar.tsx)
Design specs:
- Background: rgba(10, 10, 15, 0.8) with backdrop-blur-xl, border-bottom: 1px solid #1E1E2E
- Height: 80px, sticky top-0, z-index: 50
- Left: Logo — gradient text "NFT Market" with a purple/cyan SVG diamond icon
- Center: Navigation links — Marketplace, Collections, Rankings, Activity
  - Active link: gradient underline (purple → blue), font-weight: 600
  - Hover: text color transition to #A855F7
- Right: SearchBar + WalletConnect button + Notification bell icon
- SearchBar: expands on focus; searches NFTs/collections/users; shows dropdown results
- WalletConnect button (RainbowKit custom theme):
  - Not connected: gradient button "Connect Wallet" (purple → blue gradient, rounded-full)
  - Connected: shows ENS/shortened address + avatar, clicking opens dropdown with: Profile, My NFTs, Create NFT, Disconnect
- Mobile: hamburger menu with full-screen slide-in drawer

### Footer (components/layout/Footer.tsx)
- Dark background #0A0A0F, 4-column grid layout
- Column 1: Logo + tagline + social icons (Twitter, Discord, Instagram, Github) with hover glow effects
- Column 2: Marketplace links
- Column 3: Resources links
- Column 4: Newsletter email subscription form
- Bottom bar: copyright + legal links

### SearchBar with Autocomplete
- Debounced search (300ms) across NFTs, collections, users
- Dropdown shows: NFT results (image + name + price), Collection results, User results
- Keyboard navigation (arrow keys + enter)
- Highlight matched text

Use Framer Motion for navbar scroll animation (shadow appears on scroll), mobile drawer animation, and dropdown animations. Implement with full TypeScript and responsive design (mobile-first).
```

---

## 🔷 PROMPT 6 — HOME PAGE (Landing)

```
Build the stunning Home page (app/page.tsx) matching the NFT Marketplace Community dark design:

### Section 1: Hero
- Full viewport height, dark background with animated gradient mesh (CSS + Framer Motion)
- Floating 3D NFT cards rotating in background (CSS 3D transform animations, 3 cards at different depths)
- Left side: 
  - Badge: "🔥 #1 NFT Marketplace" (purple pill badge)
  - H1: "Discover, Collect & Sell Extraordinary NFTs" (white, bold, large, gradient on "Extraordinary")
  - Subtext: description paragraph
  - CTA Buttons: "Explore Marketplace" (gradient primary), "Create NFT" (outlined)
  - Stats row: "120K+ Artworks" | "45K+ Artists" | "220K+ Users" with animated count-up on scroll
- Right side: Featured NFT Card (large, 3D hover effect, showing highest bid, countdown timer)
- Animated purple/blue gradient orbs in background (CSS radial gradients + animation)

### Section 2: Live Auctions (Horizontal Scroll)
- Section title with "Live Auctions" + animated red dot
- Horizontal scroll row of AuctionCard components (4 visible, scroll on arrow click)
- Each card: NFT image, title, current bid, countdown timer (real-time), "Place Bid" button
- Left/Right navigation arrows with glassmorphism styling

### Section 3: Trending NFTs
- Section title "Trending Now" + filter tabs (All, Art, Music, Photography, Gaming, Sports)
- 8-card grid (4 col desktop, 2 col tablet, 1 col mobile)
- NFTCard component with hover effects

### Section 4: Top Collections (This Week)
- Table/list of top 10 collections with: rank, collection image+name, floor price, volume, % change (green/red)
- Toggle: 24h / 7d / 30d

### Section 5: Featured Artists
- "Top Creators" heading
- Horizontal scroll of Creator cards: avatar, username, verified badge, follow button, total volume

### Section 6: How It Works
- 3-step process: "Connect Wallet" → "Create & Upload" → "Sell or Collect"
- Each step has a glassmorphism card with icon, number, title, description

### Section 7: Newsletter CTA Banner
- Full-width banner with gradient background (purple → blue → pink)
- "Join the NFT Revolution" + email input + subscribe button

Implement all sections with Framer Motion scroll-triggered animations (fade-in-up, stagger children). Make it fully responsive. Use real data from the smart contracts where possible, with mock data fallback during loading.
```

---

## 🔷 PROMPT 7 — NFT CARD COMPONENT

```
Build a reusable, highly polished NFTCard component (components/nft/NFTCard.tsx):

### Visual Design (match Figma dark theme):
- Card dimensions: 280px width, auto height
- Background: #13131A (card surface)
- Border: 1px solid #1E1E2E, border-radius: 16px
- Box-shadow: 0 4px 24px rgba(139, 92, 246, 0.1)
- On hover: transform: translateY(-8px), box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3), border-color: #A855F7

### Card Anatomy:
1. Image Container (aspect-ratio: 1/1):
   - NFT image with object-cover, border-radius top
   - Top-left: Collection name badge (glassmorphism)
   - Top-right: Like/Heart button with count (toggle with animation)
   - On hover overlay: "Quick View" button appears with fade-in
   - Loading skeleton animation while image loads

2. Card Body (padding: 16px):
   - Row 1: NFT title (font-bold, white) + token ID (#123)
   - Row 2: Creator info — small avatar + "by @username" (link to profile)
   - Divider line
   - Row 3: 
     - Left: "Current Bid" label + price in ETH (gradient text purple→blue) + USD equivalent
     - Right: Countdown timer if auction (red clock icon + time remaining)
   - Row 4: "Buy Now" button (gradient) or "Place Bid" button (outlined gradient border)

### Variants prop:
- `variant="marketplace"` — shows Buy Now / Bid buttons
- `variant="profile"` — shows List for Sale / Transfer buttons  
- `variant="auction"` — shows Place Bid + countdown only
- `variant="minimal"` — image + title + price only (for grids)

### Interactions:
- Click on card body → navigate to `/nft/[id]`
- Like button → optimistic update + contract call
- Quick View → opens NFTQuickViewModal
- All animations via Framer Motion

### Props interface:
```ts
interface NFTCardProps {
  id: string
  tokenId: number
  name: string
  image: string
  price?: string      // in ETH
  highestBid?: string
  endTime?: number    // unix timestamp for auctions
  creator: { address: string; username: string; avatar: string }
  collection: { name: string; verified: boolean }
  liked?: boolean
  likeCount?: number
  variant?: 'marketplace' | 'profile' | 'auction' | 'minimal'
  onBuy?: () => void
  onBid?: () => void
}
```

Make the component work with real blockchain data. Include Framer Motion animations for hover, like toggle, and card entrance. Fully responsive. Implement skeleton loading state.
```

---

## 🔷 PROMPT 8 — MARKETPLACE PAGE

```
Build the full Marketplace browse page (app/marketplace/page.tsx):

### Layout:
- Left Sidebar (260px, sticky): Filters panel
- Right Main Area: NFT grid with sorting/view controls

### Sidebar Filters:
- "Filters" heading with "Clear All" button
- Status: All / Buy Now / On Auction / New / Has Offers (radio buttons styled as pill toggles)
- Price Range: Min ETH → Max ETH input fields + "Apply" button + preset ranges (< 0.1 ETH, 0.1–1 ETH, 1–10 ETH, > 10 ETH)
- Collections: searchable checklist of collections with item counts
- Categories: Art, Music, Photography, Sports, Gaming, Virtual Worlds, Utility (icon + label checkboxes)
- Chains: Ethereum, Polygon, Solana (icons)
- Traits/Properties: dynamic accordion based on selected collection
- "Apply Filters" sticky button at bottom

### Main Area:
- Top bar:
  - Left: Results count "2,345 items"
  - Center: Search within results (input)
  - Right: Sort dropdown (Price: Low→High, High→Low, Recently Listed, Most Liked, Ending Soon) + Grid/List view toggle
- NFT Grid (4 col desktop, 3 col tablet, 2 col small tablet, 1 col mobile)
- Infinite scroll — load more on scroll via Intersection Observer
- List view: horizontal card layout with more details
- Loading states: skeleton grid matching card dimensions
- Empty state: illustrated empty state with "No NFTs found" message and "Clear Filters" button

### URL State Management:
- All filters reflected in URL query params for shareable filtered views
- `useSearchParams` + `useRouter` for filter state

### Real Data Integration:
- Fetch from `fetchMarketItems()` smart contract function
- Filter/sort on client side for UI responsiveness, with server-side filtering for large datasets
- Use React Query with staleTime: 30 seconds for caching

Implement mobile-responsive collapsible sidebar (drawer on mobile). Add filter animation with Framer Motion. Include "Active Filters" chips row showing applied filters with remove buttons.
```

---

## 🔷 PROMPT 9 — NFT DETAIL PAGE

```
Build the NFT Detail page (app/nft/[id]/page.tsx) — the most important page:

### Layout: 2-column (image left, details right) on desktop; stacked on mobile

### Left Column — NFT Display:
- Large NFT image/media viewer (support: image, video, audio, 3D model)
- Image: full border-radius, subtle glow border matching NFT's dominant color
- Below image: share buttons (Twitter, copy link, embed) and report button
- Description tab / Properties tab / Details tab tabs:
  - Description: creator's description text
  - Properties: trait grid (trait_type → value, rarity %) displayed as glassmorphism badges
  - Details: Contract address (linked to Etherscan), Token ID, Token Standard, Blockchain, Creator Royalty %

### Right Column — NFT Info:
- Breadcrumb: Collection Name > NFT Name
- Collection badge (verified checkmark)
- NFT Title (large, bold, white)
- Views count + Favorites count (heart icon)
- Owner row: "Owned by" + avatar + username/address (linked to profile)
- Creator row: "Created by" + avatar + username/address

#### Price/Action Box (glassmorphism card, border gradient purple):
**If Fixed Price Listing:**
  - "Current Price" label
  - Price: large ETH amount + smaller USD equivalent
  - "Buy Now" button (full-width gradient, animated shimmer on hover)
  - "Make Offer" button (full-width outlined)

**If Auction:**
  - Countdown timer (days:hours:minutes:seconds, large digits, animated)
  - "Current Bid" + amount (large, gradient text)
  - Highest bidder avatar + address
  - "Place Bid" button (full-width gradient purple)
  - "Buy Now" option if available (buy it now price)

**If Not Listed (owner viewing):**
  - "List for Sale" button
  - "Create Auction" button  
  - "Transfer" button

#### Price History Chart:
- Line chart (Recharts) showing price history over time
- Toggle: 7D / 30D / 3M / All Time
- Shows sale events as dots on the line

#### Bid History / Activity (if auction):
- Table: Bidder avatar + address | Amount | Time ago | Etherscan TX link

#### Item Activity (all events):
- Table with event type icon (Sale/Transfer/List/Bid), from/to addresses, price, date
- Filter by event type

### Buy Modal (components/modals/BuyModal.tsx):
- Triggered on "Buy Now" click
- Shows: NFT image, name, price breakdown (item price + gas estimate + total)
- "Confirm Purchase" button → calls buyNFT() → shows tx pending → success animation
- Error states: insufficient balance, transaction rejected

### Bid Modal (components/modals/BidModal.tsx):
- Input field: minimum bid amount shown, ETH input with USD conversion live
- Bid increment warning if below minimum
- Summary: your bid + gas estimate
- "Place Bid" → calls placeBid() → pending → success
- Bid history shown below form

### List for Sale Modal (components/modals/ListModal.tsx):
- Toggle: Fixed Price / Timed Auction
- Fixed: Price input (ETH) + USD equivalent
- Auction: Starting price + Duration picker (1h, 12h, 1d, 3d, 7d, custom) + Buy Now option
- Fee breakdown: Platform fee (2.5%) + Creator royalty (%) + You receive
- "Complete Listing" → approve NFT → list → success

All modals: use Framer Motion for slide-up animation, backdrop blur overlay, close on backdrop click.
```

---

## 🔷 PROMPT 10 — CREATE / MINT NFT PAGE

```
Build the Create NFT page (app/create/page.tsx) — multi-step wizard:

### Step 1: Upload Media
- Drag-and-drop file upload zone (large, dashed border, dashed gradient on hover)
- Accepts: JPG, PNG, GIF, SVG, MP4, MP3, WEBM (max 100MB)
- Preview: shows uploaded image/video/audio preview immediately
- File info: name, size, type displayed below preview
- Supported formats shown as chips below dropzone

### Step 2: NFT Details
- Form fields (all styled dark with purple focus rings):
  - NFT Name* (input)
  - External Link (input, optional)
  - Description* (textarea, 500 char limit with counter)
  - Collection (dropdown: existing collections or "Create New Collection")
  - Properties/Traits (add key-value pairs dynamically, "+Add Property" button)
  - Levels (numerical attributes, e.g., Speed: 3/5)
  - Stats (numerical stats displayed as progress bars)
  - Unlockable Content toggle + textarea (exclusive content revealed after purchase)
  - Explicit & Sensitive Content toggle
  - Supply: 1 (default) or custom amount
  - Blockchain: Ethereum / Polygon selector

### Step 3: Royalties & Pricing
- Creator Royalty: slider 0–10% with input field, live preview: "You earn X ETH on 1 ETH sale"
- List immediately? Toggle:
  - Fixed Price: ETH price input + USD equivalent
  - Auction: Starting price + duration + buy now price
  - Not now: Just mint, list later
- Platform fee info card (2.5%)
- Earnings breakdown: "For 1 ETH sale, you receive X ETH"

### Step 4: Review & Mint
- Full preview card matching the NFTCard component exactly
- Summary of all settings
- Estimated gas fee (fetch live from provider)
- Terms acceptance checkbox
- "Create NFT" button (gradient, large)

### Minting Progress UX:
- Step 1: "Uploading image to IPFS..." (spinner + progress bar)
- Step 2: "Creating metadata..." 
- Step 3: "Waiting for wallet approval..." (MetaMask opens)
- Step 4: "Minting NFT on blockchain..." (tx hash shown, Etherscan link)
- Step 5: Success! Confetti animation + "View your NFT" button

### Validation:
- Form validation with react-hook-form + zod schema
- Prevent submission if wallet not connected
- File type/size validation before upload

Implement with full TypeScript, form state management (react-hook-form), zod validation. Stepper progress indicator at top. Mobile fully responsive.
```

---

## 🔷 PROMPT 11 — USER PROFILE PAGE

```
Build the User Profile page (app/profile/[address]/page.tsx):

### Profile Header:
- Cover image (full width, 280px height) — editable if own profile (click to upload)
- Avatar: 120px circle, bottom-left of cover overlapping it by 50%, purple ring border
  - Own profile: hover shows camera icon to change avatar
  - Verified badge: purple checkmark if verified
- Right side of header:
  - Follow/Following button (toggle, shows follower count change)
  - Share button (copy profile link)
  - Report button (three-dot menu)
  - If own profile: "Edit Profile" button → opens drawer/modal
- Below avatar: 
  - Username (@handle) + display name
  - Bio text (up to 200 chars)
  - Social links: Twitter, Instagram, Website (icons)
  - Member since date + Wallet address (shortened, copy button, Etherscan link)
- Stats row: Items | Owned | Created | Favorited | Followers | Following (all clickable to filter)

### Profile Tabs (sticky below header):
1. **Collected** — NFTs owned by this wallet (fetched from contract)
2. **Created** — NFTs minted by this address
3. **On Sale** — Active marketplace listings
4. **Favorited** — NFTs this user has liked
5. **Activity** — Personal activity feed (bought, sold, listed, bids)

### Tab Content:
- Each tab: same filter/sort controls as marketplace
- NFT Grid: NFTCard components (profile variant)
- Activity tab: timeline list with event type, NFT info, amount, date, TX link

### Edit Profile Drawer (own profile only):
- Slide-in from right drawer
- Fields: Display name, Username (unique check), Bio, Twitter URL, Instagram URL, Website URL
- Avatar upload (circular crop)
- Cover image upload
- "Save Changes" → stores in localStorage/backend (optional: IPFS + signed message)

### Empty States:
- Unique illustrated empty states for each tab
- "Collect your first NFT" with CTA to marketplace

Implement with ENS resolution: if address has ENS name, display it. Fetch real data from NFTCollection.sol and NFTMarketplace.sol contracts. Use wagmi's `useEnsName`, `useEnsAvatar`. Full mobile responsive.
```

---

## 🔷 PROMPT 12 — COLLECTIONS PAGE & DETAIL

```
Build Collections pages:

### Collections Browse (app/collections/page.tsx):
- Hero: "Explore Collections" heading + search bar (large, centered)
- Filter row: All / Art / Music / Photography / Sports / Gaming + Sort (Volume, Floor Price, Items, Recently Added)
- Grid of CollectionCard components (3 col desktop, 2 tablet, 1 mobile):
  
  **CollectionCard design:**
  - Banner image (top, 150px height)
  - 3 preview NFT images overlapping bottom-left of banner
  - Collection avatar (60px circle, purple border)
  - Collection name + verified badge
  - Stats: Floor | Volume | Items | Owners
  - "View Collection" button

### Collection Detail (app/collection/[id]/page.tsx):
- **Banner**: full-width banner image (320px desktop height), with gradient overlay bottom
- **Collection Info below banner**:
  - Large collection logo (100px circle, left-aligned)
  - Collection name (large, bold) + verified badge
  - Creator: "by @username" 
  - Description text (expandable "read more")
  - Social links (Discord, Twitter, Website)
  - Stats bar: Items | Owners | Floor Price | Total Volume | 24h Volume | Listed (%)

- **Filter & Sort**: same as marketplace
- **NFT Grid**: paginated grid of all NFTs in collection
- **Activity tab**: collection-wide activity feed (recent sales, listings)
- **Traits/Analytics tab**:
  - Trait distribution bar charts
  - Price floor chart (Recharts line chart, time selectors)
  - Sales volume bar chart
  - Rarity distribution

Fetch collection data from smart contract events + Alchemy NFT API for metadata enumeration.
```

---

## 🔷 PROMPT 13 — ACTIVITY & RANKINGS PAGES

```
Build Activity and Rankings pages:

### Global Activity (app/activity/page.tsx):
- Page title "Global Activity Feed"
- Filter chips: All / Sales / Listings / Transfers / Bids / Burns
- Chain filter: All Chains / Ethereum / Polygon
- Activity feed (infinite scroll list):
  Each row: Event type icon (colored by type) | NFT thumbnail | NFT name | Event detail ("Sold for 2.5 ETH") | From address → To address | Time ago | Etherscan TX link icon
  Rows animate in with Framer Motion stagger as they load
- Auto-refresh every 30 seconds with "X new events" notification banner at top (click to refresh)

### Rankings (app/rankings/page.tsx):
- Tab toggle: Collections | Artists
- Time period selector: 1 Day | 7 Days | 30 Days | All Time (updates ranking)

**Collections Rankings Table:**
- Columns: Rank (with change indicator ↑↓) | Collection | Volume | % Change | Floor Price | Sales | Items | Owners
- Rank 1-3: special styling (gold, silver, bronze badges)
- Row hover: subtle purple glow
- Collection image + name link in column

**Artists/Creators Rankings:**
- Top 3: Large card format with avatar, username, total volume, follower count
- Rest: Table format similar to collections

Fetch data by listening to smart contract events and aggregating. Use Recharts sparkline charts in volume column. Animate table rows entrance with Framer Motion.
```

---

## 🔷 PROMPT 14 — WALLET CONNECTION & WEB3 UX

```
Implement complete wallet connection UX:

### RainbowKit Custom Theme:
Configure RainbowKit with a custom dark theme matching the app:
```ts
const customTheme = {
  colors: {
    accentColor: '#8B5CF6',
    accentColorForeground: 'white',
    actionButtonBorder: '#1E1E2E',
    actionButtonBorderMobile: '#1E1E2E',
    closeButton: '#6B7280',
    closeButtonBackground: '#1A1A2E',
    connectButtonBackground: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
    connectButtonInnerBackground: '#13131A',
    connectButtonText: 'white',
    connectionIndicator: '#10B981',
    downloadBottomCardBackground: '#13131A',
    downloadTopCardBackground: '#1A1A2E',
    error: '#EF4444',
    generalBorder: '#1E1E2E',
    generalBorderDim: '#1E1E2E',
    menuItemBackground: '#1A1A2E',
    modalBackground: '#0A0A0F',
    modalBorder: '#1E1E2E',
    modalText: '#F9FAFB',
    modalTextDim: '#9CA3AF',
    modalTextSecondary: '#6B7280',
    profileAction: '#1A1A2E',
    profileActionHover: '#13131A',
    profileForeground: '#13131A',
    selectedOptionBorder: '#8B5CF6',
    standby: '#F59E0B',
  },
  fonts: { body: 'Inter, sans-serif' },
  radii: { actionButton: '12px', connectButton: '50px', menuButton: '12px', modal: '24px', modalMobile: '24px' }
}
```

### Wallet Status Hook (hooks/useWalletStatus.ts):
- Returns: isConnected, address, ensName, ensAvatar, balance (in ETH), chainId, isCorrectNetwork
- If wrong network: shows "Switch Network" banner
- Auto-switch to target network on connect

### Network Guard Component:
- Wraps pages that require blockchain interaction
- If not connected: shows "Connect Wallet to Continue" overlay
- If wrong network: shows "Switch to Ethereum Sepolia" with switch button
- Animated, non-blocking (content still visible below overlay)

### Transaction Toast System:
Custom toast notifications for all blockchain actions:
- Pending: spinner + "Transaction pending..." + Etherscan link
- Success: checkmark + "Transaction confirmed!" + Etherscan link  
- Failed: X icon + "Transaction failed" + error message
- Toasts styled dark matching app theme, positioned top-right

### Transaction History (local state + localStorage):
- Track all transactions in Zustand store
- Persist to localStorage
- Small "Transactions" panel accessible from wallet dropdown
- Shows pending/confirmed/failed txs with links

Implement complete with TypeScript. Handle all edge cases: no MetaMask, rejected transaction, network congestion, insufficient funds (parse error message to show friendly text).
```

---

## 🔷 PROMPT 15 — SEARCH FUNCTIONALITY

```
Build a comprehensive search system:

### Global Search (components/layout/SearchBar.tsx):
- Trigger: Click or Ctrl+K keyboard shortcut
- Opens: full-screen modal search (Command Palette style) on desktop, or full-width on mobile
- Input: auto-focused, large, with magnifier icon
- Debounced 300ms search across:
  - NFTs: search by name, description, traits
  - Collections: search by name
  - Wallets/Users: search by address or ENS name

### Search Results Display:
Grouped sections in dropdown/modal:
```
🖼️ NFTs (showing 5 of 234 results)
  [thumbnail] Bored Ape #1234  |  Collection Name  |  2.5 ETH
  [thumbnail] CryptoPunk #456  |  Collection Name  |  Listed
  
📁 Collections (showing 3 results)  
  [logo] Bored Ape Yacht Club  |  Floor: 30 ETH  |  10K items
  
👤 Users (showing 2 results)
  [avatar] @vitalik.eth  |  0x1234...5678
  
🔥 Trending Searches: "Azuki" "BAYC" "Art Blocks"
```
- Recent searches (last 5, stored in localStorage)
- Keyboard navigation: ↑↓ arrows to navigate, Enter to go, Esc to close

### Search Results Page (app/search/page.tsx):
- Full results page for `?q=searchterm`
- Same grouped results as dropdown but paginated
- Tab filter: All / NFTs / Collections / Users
- Sort options for each category

Implement with TypeScript. Search NFTs by querying contract events (or The Graph subgraph if available). Show loading skeletons while searching.
```

---

## 🔷 PROMPT 16 — ADVANCED UI COMPONENTS

```
Build these essential shared UI components:

### Countdown Timer (components/ui/CountdownTimer.tsx):
- Takes `endTime: number` (unix timestamp)
- Displays: DD : HH : MM : SS with labels
- Color changes: Normal → yellow (< 1 hour) → red + pulse animation (< 5 minutes)
- Updates every second with no flicker
- Returns "Ended" with strike-through when time passes

### Price Display (components/ui/PriceDisplay.tsx):
- Props: `eth: string, showUSD?: boolean, size?: 'sm'|'md'|'lg'`
- Shows ETH amount with Ethereum diamond icon
- Below: USD equivalent (fetches ETH/USD price from CoinGecko API, cached 60s)
- Gradient text for large sizes

### NFT Skeleton (components/ui/NFTSkeleton.tsx):
- Animated shimmer skeleton matching exact NFTCard dimensions
- Used while data loads in grids

### Address Display (components/ui/AddressDisplay.tsx):
- Shows shortened address (0x1234...5678) or ENS name
- Copy button (clipboard icon, shows checkmark on copy)
- Etherscan link icon
- Optional avatar (useEnsAvatar or blockies/jazzicon)

### GradientButton (components/ui/GradientButton.tsx):
- Variants: primary (purple→blue), secondary (outlined gradient border), danger (red)
- Sizes: sm, md, lg, xl
- Loading state: spinner replaces text, disabled
- Shimmer animation on hover
- Ripple effect on click

### Modal Base (components/ui/Modal.tsx):
- Framer Motion slide-up + fade-in animation
- Backdrop: blur + dark overlay (click to close)
- Close button (X) top-right
- Scrollable content area
- Mobile: slides up from bottom (sheet behavior)

### Toast Notifications (lib/toast.ts):
- Custom wrapper around react-hot-toast
- Preset functions: `txPending(hash)`, `txSuccess(hash)`, `txError(error)`, `success(msg)`, `error(msg)`
- All dark-themed matching app design

### Infinite Scroll Grid (components/ui/InfiniteGrid.tsx):
- Wraps any grid content
- Uses Intersection Observer to detect bottom
- Calls `onLoadMore()` callback
- Shows loading spinner at bottom while loading
- Shows "All items loaded" when complete

### TraitBadge (components/ui/TraitBadge.tsx):
- Shows NFT trait/property
- Type: trait_type label (muted), value (bold white)
- Rarity %: small percentage below (color: green=common, blue=uncommon, purple=rare, gold=legendary)
- Glassmorphism card style

Build all components with complete TypeScript props interfaces and Storybook-ready documentation comments.
```

---

## 🔷 PROMPT 17 — RESPONSIVE DESIGN & ANIMATIONS

```
Implement responsive design and animation system across the entire app:

### Responsive Breakpoints (Tailwind custom config):
- xs: 375px (small phones)
- sm: 640px (large phones)
- md: 768px (tablets)
- lg: 1024px (small desktop)
- xl: 1280px (desktop)
- 2xl: 1536px (large desktop)

### Animation Variants (lib/animations.ts):
Create reusable Framer Motion variants:
```ts
export const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } }
export const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }
export const scaleIn = { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }
export const slideInLeft = { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0 } }
export const cardHover = { rest: { y: 0, boxShadow: '...' }, hover: { y: -8, boxShadow: '...' } }
```

### Global Animations:
- Page transitions: fade + slide between routes (Next.js App Router layout animation)
- Scroll-triggered animations: use `whileInView` on section headings, cards, stat numbers
- Animated gradient background: subtle moving gradient on main background using CSS keyframes
- Particle/orb effects on hero section: floating glowing orbs (CSS animation)
- Glassmorphism cards: backdrop-filter: blur(12px), semi-transparent backgrounds

### Performance:
- Use `will-change: transform` on animated cards
- Lazy-load NFT images (Next.js Image with blur placeholder)
- Virtualize long lists (react-virtual for activity feeds)
- Code-split heavy pages with `dynamic()` import
- Cache API responses with React Query

### Dark Theme CSS:
Add to globals.css:
- Custom scrollbar styling (dark, thin, purple thumb)
- Selection color: purple background
- Focus ring: purple outline
- Smooth scroll behavior
- CSS variables for all theme colors

### Mobile-Specific UX:
- Touch-friendly tap targets (min 44px)
- Swipe gestures on NFT image gallery (Framer Motion drag)
- Bottom navigation bar on mobile (Home, Explore, Create, Activity, Profile)
- Pull-to-refresh on marketplace/profile pages
- Haptic feedback hints (CSS)

Implement all animations with respect for `prefers-reduced-motion` media query.
```

---

## 🔷 PROMPT 18 — BACKEND API ROUTES

```
Create Next.js API routes (app/api/) for data that can't be fetched directly from blockchain:

### app/api/nfts/[tokenId]/route.ts
- GET: Fetch NFT metadata from IPFS via tokenURI
- Cache: 1 hour (ISR)
- Returns normalized NFT object including metadata

### app/api/nfts/route.ts
- GET: List NFTs with filters (collection, price_min, price_max, category)
- Fetches from marketplace contract + enriches with IPFS metadata
- Query params: ?page=1&limit=20&sort=price_asc&category=art

### app/api/collections/route.ts
- GET: List all collections with stats
- Stats calculated from contract events

### app/api/price/eth-usd/route.ts
- GET: Current ETH/USD price from CoinGecko
- Cache: 60 seconds
- Used by all price displays in app

### app/api/users/[address]/route.ts
- GET: User profile (username, bio, avatar stored in localStorage/Supabase optional)
- PATCH: Update user profile (with wallet signature verification)

### app/api/ipfs/upload/route.ts
- POST: Proxy IPFS upload through server (hides Pinata API key)
- Accepts: multipart/form-data
- Returns: { cid, url }

### app/api/activity/route.ts
- GET: Global activity from contract events
- Filters: type (sale, listing, bid, transfer)
- Pagination: cursor-based

### app/api/search/route.ts  
- GET ?q=query: Search across NFTs, collections, users
- Returns grouped results

Implement with proper TypeScript types, error handling (zod for input validation), and appropriate caching headers (Cache-Control, Revalidate).
```

---

## 🔷 PROMPT 19 — DEPLOYMENT & TESTING

```
Set up complete deployment pipeline:

### Smart Contract Deployment:
1. Hardhat config for Sepolia testnet and Ethereum mainnet
2. Deploy script (scripts/deploy.ts):
   - Deploy NFTCollection.sol
   - Deploy NFTMarketplace.sol with collection address
   - Deploy NFTAuction.sol with marketplace address
   - Save all addresses + ABIs to `deployments/[network].json`
   - Auto-verify on Etherscan after deploy
3. Post-deploy script: seed marketplace with test NFTs for demo

### Frontend Deployment (Vercel):
1. `vercel.json` configuration:
   - Environment variables
   - Edge runtime for API routes
2. GitHub Actions workflow (.github/workflows/deploy.yml):
   - On push to main: run tests → lint → type check → deploy to Vercel
   - On PR: deploy preview

### Environment Setup Guide:
Create `SETUP.md` with step-by-step instructions:
1. Get Alchemy API key
2. Get Pinata API key + JWT
3. Get WalletConnect Project ID
4. Fund deployer wallet with Sepolia ETH
5. Deploy contracts: `npm run deploy:sepolia`
6. Update .env.local with contract addresses
7. Run frontend: `npm run dev`

### E2E Testing (Playwright):
Write tests for:
- Connect wallet (mock MetaMask with playwright-metamask)
- Browse marketplace (filter + sort)
- View NFT detail page
- Mock mint NFT flow
- Mock buy NFT flow

### Unit Tests (Jest + Testing Library):
- NFTCard renders correctly
- CountdownTimer counts down
- PriceDisplay shows correct ETH/USD
- Filter state management
- Custom hook unit tests with mock wagmi

Output complete CI/CD configuration, Playwright config, and Jest config.
```

---

## 🔷 PROMPT 20 — FINAL POLISH & OPTIMIZATION

```
Apply final polish to make the NFT Marketplace 100% production-ready:

### SEO & Meta:
- Dynamic Open Graph images for each NFT page (Next.js OG image generation)
- Meta tags: title, description, og:image, og:type, twitter:card
- Structured data (JSON-LD) for NFTs
- Sitemap generation for collection/NFT pages
- robots.txt

### Performance:
- Next.js Image optimization for all NFT images (IPFS gateway)
- Font optimization: Inter font via next/font
- Bundle analysis: `npm run analyze` setup
- Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, FID < 100ms

### Accessibility (WCAG 2.1 AA):
- All interactive elements keyboard navigable
- ARIA labels on icon buttons
- Color contrast ratios compliant
- Screen reader announcements for price changes, auction updates

### Error Boundaries:
- Global error boundary (app/error.tsx)
- Per-section error boundaries with retry buttons
- Network error states (offline detection)

### Loading States:
- Route-level loading.tsx files (Next.js)
- Suspense boundaries with skeleton fallbacks
- Progressive image loading with blur placeholders

### Final UI Consistency Check:
- All buttons use GradientButton component
- All modals use Modal base component
- All prices use PriceDisplay component
- Typography scale consistent (use @/styles/typography.ts constants)
- Color tokens consistent (only use theme colors)
- Spacing scale consistent (Tailwind spacing)

### Notification System:
- Browser push notifications for: outbid alerts, auction ending soon, sale completed
- In-app notification bell with count badge
- Notification history panel (slide-in from right)
- Notification preferences settings

### Analytics:
- Vercel Analytics integration
- Custom event tracking: wallet_connected, nft_viewed, purchase_completed, bid_placed
- Conversion funnel tracking

Output final checklist, performance report template, and launch checklist.
```

---

## 🎨 DESIGN SYSTEM REFERENCE

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#0A0A0F` | Page background |
| `surface` | `#13131A` | Card backgrounds |
| `surface-alt` | `#1A1A2E` | Hover, secondary surfaces |
| `border` | `#1E1E2E` | All borders |
| `primary` | `#8B5CF6` | Primary actions, accents |
| `secondary` | `#06B6D4` | Secondary accents |
| `accent` | `#F59E0B` | Highlights, warnings |
| `text-primary` | `#F9FAFB` | Main text |
| `text-secondary` | `#9CA3AF` | Muted text |
| `success` | `#10B981` | Positive changes |
| `danger` | `#EF4444` | Errors, price drops |

### Gradient Presets
```css
.gradient-primary { background: linear-gradient(135deg, #8B5CF6, #06B6D4); }
.gradient-text { background: linear-gradient(135deg, #A855F7, #3B82F6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.gradient-card-border { background: linear-gradient(#13131A, #13131A) padding-box, linear-gradient(135deg, #8B5CF6, #06B6D4) border-box; border: 1px solid transparent; }
.glassmorphism { background: rgba(19, 19, 26, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); }
```

### Typography Scale
| Name | Size | Weight | Usage |
|------|------|--------|-------|
| `display` | 72px | 800 | Hero headings |
| `h1` | 48px | 700 | Page titles |
| `h2` | 36px | 700 | Section titles |
| `h3` | 24px | 600 | Card titles |
| `h4` | 20px | 600 | Sub-sections |
| `body-lg` | 18px | 400 | Intro text |
| `body` | 16px | 400 | Default body |
| `body-sm` | 14px | 400 | Secondary info |
| `caption` | 12px | 400 | Labels, hints |

---

## 🚀 EXECUTION ORDER

Run prompts in this sequence:
1. **Prompt 1** — Project setup
2. **Prompt 2** — Smart contracts
3. **Prompt 3** — Contract tests
4. **Prompt 4** — Hooks & utilities
5. **Prompt 5** — Layout & navbar
6. **Prompt 16** — UI component library
7. **Prompt 14** — Wallet connection
8. **Prompt 6** — Home page
9. **Prompt 7** — NFT Card component
10. **Prompt 8** — Marketplace page
11. **Prompt 9** — NFT Detail page
12. **Prompt 10** — Create/Mint page
13. **Prompt 11** — Profile page
14. **Prompt 12** — Collections pages
15. **Prompt 13** — Activity & Rankings
16. **Prompt 15** — Search
17. **Prompt 17** — Animations & responsive
18. **Prompt 18** — API routes
19. **Prompt 19** — Deployment
20. **Prompt 20** — Final polish

---

## 📋 CHECKLIST

### Blockchain Features
- [ ] Wallet connect (MetaMask, WalletConnect, Coinbase, Rainbow)
- [ ] Mint NFT (ERC-721 + IPFS)
- [ ] Fixed price listing
- [ ] Buy NFT
- [ ] Create auction
- [ ] Place bid (with anti-sniping)
- [ ] End auction
- [ ] Cancel listing / auction
- [ ] Creator royalties (ERC-2981)
- [ ] Platform fee (2.5%)
- [ ] NFT transfer
- [ ] Price history (from events)
- [ ] Real-time bid updates

### UI Features
- [ ] Home / Landing page
- [ ] Marketplace browse with filters
- [ ] NFT detail page
- [ ] Mint / Create page
- [ ] User profile page
- [ ] Collections browse & detail
- [ ] Global activity feed
- [ ] Rankings page
- [ ] Search (global)
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Dark theme consistent
- [ ] Loading skeletons
- [ ] Error states
- [ ] Empty states
- [ ] Toast notifications
- [ ] Transaction tracking

### Code Quality
- [ ] TypeScript strict mode
- [ ] Smart contract unit tests (>80% coverage)
- [ ] Frontend unit tests
- [ ] E2E tests (Playwright)
- [ ] ESLint + Prettier configured
- [ ] Husky pre-commit hooks
- [ ] CI/CD pipeline
- [ ] SEO meta tags
- [ ] Accessibility (WCAG AA)
- [ ] Performance optimized

---

*Generated for NFT Marketplace Community Figma Design — Full-Stack Web3 Project*
