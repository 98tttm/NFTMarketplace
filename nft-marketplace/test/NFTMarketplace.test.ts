import { expect } from "chai";
import hre from "hardhat";

const { ethers, networkHelpers } = await hre.network.connect();

describe("NFTMarketplace", function () {
  const MINT_FEE = ethers.parseEther("0.001");
  const LIST_PRICE = ethers.parseEther("1");
  const TOKEN_URI = "ipfs://QmTest123/metadata.json";
  const ROYALTY_BPS = 500n; // 5%

  async function deployFixture() {
    const [owner, seller, buyer, creator, other] = await ethers.getSigners();

    const nft = await ethers.deployContract("NFTCollection", [
      "Test NFT", "TNFT", MINT_FEE, owner.address,
    ]);

    const marketplace = await ethers.deployContract("NFTMarketplace", [owner.address]);

    return { nft, marketplace, owner, seller, buyer, creator, other };
  }

  async function mintAndApproveFixture() {
    const { nft, marketplace, owner, seller, buyer, creator, other } =
      await networkHelpers.loadFixture(deployFixture);

    // Creator mints NFT to seller
    await nft.connect(creator).mint(seller.address, TOKEN_URI, ROYALTY_BPS, { value: MINT_FEE });

    // Seller approves marketplace
    const marketplaceAddr = await marketplace.getAddress();
    await nft.connect(seller).approve(marketplaceAddr, 0);

    return { nft, marketplace, owner, seller, buyer, creator, other };
  }

  describe("Listing", function () {
    it("Should list an NFT successfully", async function () {
      const { nft, marketplace, seller } = await networkHelpers.loadFixture(mintAndApproveFixture);
      const nftAddr = await nft.getAddress();

      await expect(
        marketplace.connect(seller).listNFT(nftAddr, 0, LIST_PRICE)
      ).to.emit(marketplace, "NFTListed")
        .withArgs(0n, nftAddr, 0n, seller.address, LIST_PRICE);

      // NFT should now be held by marketplace
      expect(await nft.ownerOf(0)).to.equal(await marketplace.getAddress());
    });

    it("Should fail listing without approval", async function () {
      const { nft, marketplace, creator, buyer } = await networkHelpers.loadFixture(deployFixture);
      const nftAddr = await nft.getAddress();

      await nft.connect(creator).mint(buyer.address, TOKEN_URI, ROYALTY_BPS, { value: MINT_FEE });

      await expect(
        marketplace.connect(buyer).listNFT(nftAddr, 0, LIST_PRICE)
      ).to.be.revertedWith("Marketplace not approved");
    });

    it("Should fail listing with zero price", async function () {
      const { nft, marketplace, seller } = await networkHelpers.loadFixture(mintAndApproveFixture);

      await expect(
        marketplace.connect(seller).listNFT(await nft.getAddress(), 0, 0)
      ).to.be.revertedWith("Price must be > 0");
    });

    it("Should fail if caller is not token owner", async function () {
      const { nft, marketplace, other } = await networkHelpers.loadFixture(mintAndApproveFixture);

      await expect(
        marketplace.connect(other).listNFT(await nft.getAddress(), 0, LIST_PRICE)
      ).to.be.revertedWith("Not token owner");
    });
  });

  describe("Buying", function () {
    async function listedFixture() {
      const fixtures = await networkHelpers.loadFixture(mintAndApproveFixture);
      const { nft, marketplace, seller } = fixtures;
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, LIST_PRICE);
      return fixtures;
    }

    it("Should buy an NFT and split fees correctly", async function () {
      const { nft, marketplace, owner, seller, buyer, creator } =
        await networkHelpers.loadFixture(listedFixture);

      const ownerBalBefore = await ethers.provider.getBalance(owner.address);
      const sellerBalBefore = await ethers.provider.getBalance(seller.address);
      const creatorBalBefore = await ethers.provider.getBalance(creator.address);

      await marketplace.connect(buyer).buyNFT(0, { value: LIST_PRICE });

      // NFT now owned by buyer
      expect(await nft.ownerOf(0)).to.equal(buyer.address);

      // Platform fee: 2.5% of 1 ETH = 0.025 ETH
      const platformFeeAmount = LIST_PRICE * 250n / 10000n;
      // Royalty: 5% of 1 ETH = 0.05 ETH
      const royaltyAmount = LIST_PRICE * 500n / 10000n;
      const sellerProceeds = LIST_PRICE - platformFeeAmount - royaltyAmount;

      const ownerBalAfter = await ethers.provider.getBalance(owner.address);
      const sellerBalAfter = await ethers.provider.getBalance(seller.address);
      const creatorBalAfter = await ethers.provider.getBalance(creator.address);

      expect(ownerBalAfter - ownerBalBefore).to.equal(platformFeeAmount);
      expect(sellerBalAfter - sellerBalBefore).to.equal(sellerProceeds);
      expect(creatorBalAfter - creatorBalBefore).to.equal(royaltyAmount);
    });

    it("Should emit NFTSold event with correct amounts", async function () {
      const { marketplace, buyer } = await networkHelpers.loadFixture(listedFixture);

      const platformFeeAmount = LIST_PRICE * 250n / 10000n;
      const royaltyAmount = LIST_PRICE * 500n / 10000n;

      await expect(
        marketplace.connect(buyer).buyNFT(0, { value: LIST_PRICE })
      ).to.emit(marketplace, "NFTSold")
        .withArgs(0n, buyer.address, LIST_PRICE, platformFeeAmount, royaltyAmount);
    });

    it("Should fail with insufficient payment", async function () {
      const { marketplace, buyer } = await networkHelpers.loadFixture(listedFixture);

      await expect(
        marketplace.connect(buyer).buyNFT(0, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should fail if seller tries to buy own listing", async function () {
      const { marketplace, seller } = await networkHelpers.loadFixture(listedFixture);

      await expect(
        marketplace.connect(seller).buyNFT(0, { value: LIST_PRICE })
      ).to.be.revertedWith("Seller cannot buy own NFT");
    });

    it("Should refund overpayment", async function () {
      const { marketplace, buyer } = await networkHelpers.loadFixture(listedFixture);

      const overpay = ethers.parseEther("2"); // 2 ETH for a 1 ETH listing
      const buyerBalBefore = await ethers.provider.getBalance(buyer.address);

      const tx = await marketplace.connect(buyer).buyNFT(0, { value: overpay });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const buyerBalAfter = await ethers.provider.getBalance(buyer.address);
      // Buyer should have paid exactly LIST_PRICE + gas, not the overpay amount
      expect(buyerBalBefore - buyerBalAfter - gasUsed).to.equal(LIST_PRICE);
    });

    it("Should fail buying an already sold listing", async function () {
      const { marketplace, buyer, other } = await networkHelpers.loadFixture(listedFixture);

      await marketplace.connect(buyer).buyNFT(0, { value: LIST_PRICE });

      await expect(
        marketplace.connect(other).buyNFT(0, { value: LIST_PRICE })
      ).to.be.revertedWith("Listing not active");
    });
  });

  describe("Cancel Listing", function () {
    it("Should cancel listing and return NFT", async function () {
      const { nft, marketplace, seller } = await networkHelpers.loadFixture(mintAndApproveFixture);
      const nftAddr = await nft.getAddress();

      await marketplace.connect(seller).listNFT(nftAddr, 0, LIST_PRICE);

      await expect(marketplace.connect(seller).cancelListing(0))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(0n);

      expect(await nft.ownerOf(0)).to.equal(seller.address);
    });

    it("Should fail if non-seller tries to cancel", async function () {
      const { nft, marketplace, seller, other } = await networkHelpers.loadFixture(mintAndApproveFixture);

      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, LIST_PRICE);

      await expect(
        marketplace.connect(other).cancelListing(0)
      ).to.be.revertedWith("Not the seller");
    });
  });

  describe("Price Update", function () {
    it("Should update listing price", async function () {
      const { nft, marketplace, seller } = await networkHelpers.loadFixture(mintAndApproveFixture);
      const newPrice = ethers.parseEther("2");

      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, LIST_PRICE);

      await expect(marketplace.connect(seller).updatePrice(0, newPrice))
        .to.emit(marketplace, "PriceUpdated")
        .withArgs(0n, LIST_PRICE, newPrice);

      const listing = await marketplace.listings(0);
      expect(listing.price).to.equal(newPrice);
    });

    it("Should fail with zero price", async function () {
      const { nft, marketplace, seller } = await networkHelpers.loadFixture(mintAndApproveFixture);
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, LIST_PRICE);

      await expect(
        marketplace.connect(seller).updatePrice(0, 0)
      ).to.be.revertedWith("Price must be > 0");
    });
  });

  describe("Fetch Market Items", function () {
    it("Should return only active listings", async function () {
      const { nft, marketplace, owner, seller, creator } =
        await networkHelpers.loadFixture(deployFixture);

      const nftAddr = await nft.getAddress();
      const mpAddr = await marketplace.getAddress();

      // Mint 3 NFTs
      for (let i = 0; i < 3; i++) {
        await nft.connect(creator).mint(seller.address, `ipfs://token${i}`, ROYALTY_BPS, { value: MINT_FEE });
        await nft.connect(seller).approve(mpAddr, i);
        await marketplace.connect(seller).listNFT(nftAddr, i, LIST_PRICE);
      }

      // Cancel listing 1
      await marketplace.connect(seller).cancelListing(1);

      const items = await marketplace.fetchMarketItems();
      expect(items.length).to.equal(2);
      expect(items[0].listingId).to.equal(0n);
      expect(items[1].listingId).to.equal(2n);
    });

    it("Should return empty array when no listings", async function () {
      const { marketplace } = await networkHelpers.loadFixture(deployFixture);
      const items = await marketplace.fetchMarketItems();
      expect(items.length).to.equal(0);
    });
  });

  describe("Platform Fee", function () {
    it("Should calculate platform fee correctly at different rates", async function () {
      const { nft, marketplace, owner, seller, buyer, creator } =
        await networkHelpers.loadFixture(mintAndApproveFixture);

      // Set fee to 5%
      await marketplace.connect(owner).setPlatformFee(500);

      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, LIST_PRICE);

      const ownerBalBefore = await ethers.provider.getBalance(owner.address);
      await marketplace.connect(buyer).buyNFT(0, { value: LIST_PRICE });
      const ownerBalAfter = await ethers.provider.getBalance(owner.address);

      // 5% of 1 ETH = 0.05 ETH
      expect(ownerBalAfter - ownerBalBefore).to.equal(ethers.parseEther("0.05"));
    });

    it("Should reject fee above maximum (10%)", async function () {
      const { marketplace, owner } = await networkHelpers.loadFixture(deployFixture);

      await expect(
        marketplace.connect(owner).setPlatformFee(1001)
      ).to.be.revertedWith("Fee exceeds maximum");
    });

    it("Should reject non-owner setting fee", async function () {
      const { marketplace, seller } = await networkHelpers.loadFixture(deployFixture);

      await expect(
        marketplace.connect(seller).setPlatformFee(100)
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pausable", function () {
    it("Should prevent listing when paused", async function () {
      const { nft, marketplace, owner, seller } = await networkHelpers.loadFixture(mintAndApproveFixture);

      await marketplace.connect(owner).pause();

      await expect(
        marketplace.connect(seller).listNFT(await nft.getAddress(), 0, LIST_PRICE)
      ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
    });

    it("Should resume after unpause", async function () {
      const { nft, marketplace, owner, seller } = await networkHelpers.loadFixture(mintAndApproveFixture);

      await marketplace.connect(owner).pause();
      await marketplace.connect(owner).unpause();

      await expect(
        marketplace.connect(seller).listNFT(await nft.getAddress(), 0, LIST_PRICE)
      ).to.emit(marketplace, "NFTListed");
    });
  });
});
