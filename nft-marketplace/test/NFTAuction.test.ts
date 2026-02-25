import { expect } from "chai";
import hre from "hardhat";

const { ethers, networkHelpers } = await hre.network.connect();

describe("NFTAuction", function () {
  const MINT_FEE = ethers.parseEther("0.001");
  const TOKEN_URI = "ipfs://QmTest123/metadata.json";
  const ROYALTY_BPS = 500n; // 5%
  const STARTING_PRICE = ethers.parseEther("0.5");
  const ONE_HOUR = 3600;
  const ONE_DAY = 86400;
  const FIVE_MINUTES = 300;

  async function deployFixture() {
    const [owner, seller, bidder1, bidder2, creator, other] = await ethers.getSigners();

    const nft = await ethers.deployContract("NFTCollection", [
      "Test NFT", "TNFT", MINT_FEE, owner.address,
    ]);

    const auction = await ethers.deployContract("NFTAuction", [owner.address]);

    return { nft, auction, owner, seller, bidder1, bidder2, creator, other };
  }

  async function mintAndApproveFixture() {
    const fixtures = await networkHelpers.loadFixture(deployFixture);
    const { nft, auction, creator, seller } = fixtures;

    await nft.connect(creator).mint(seller.address, TOKEN_URI, ROYALTY_BPS, { value: MINT_FEE });
    await nft.connect(seller).approve(await auction.getAddress(), 0);

    return fixtures;
  }

  async function activeAuctionFixture() {
    const fixtures = await networkHelpers.loadFixture(mintAndApproveFixture);
    const { nft, auction, seller } = fixtures;

    await auction.connect(seller).createAuction(
      await nft.getAddress(), 0, STARTING_PRICE, ONE_DAY
    );

    return fixtures;
  }

  describe("Auction Creation", function () {
    it("Should create an auction successfully", async function () {
      const { nft, auction, seller } = await networkHelpers.loadFixture(mintAndApproveFixture);
      const nftAddr = await nft.getAddress();

      const tx = await auction.connect(seller).createAuction(nftAddr, 0, STARTING_PRICE, ONE_DAY);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      const expectedEndTime = BigInt(block!.timestamp) + BigInt(ONE_DAY);

      await expect(tx)
        .to.emit(auction, "AuctionCreated")
        .withArgs(0n, nftAddr, 0n, seller.address, STARTING_PRICE, expectedEndTime);

      // NFT held by auction contract
      expect(await nft.ownerOf(0)).to.equal(await auction.getAddress());
    });

    it("Should fail with duration below minimum (1 hour)", async function () {
      const { nft, auction, seller } = await networkHelpers.loadFixture(mintAndApproveFixture);

      await expect(
        auction.connect(seller).createAuction(await nft.getAddress(), 0, STARTING_PRICE, 60)
      ).to.be.revertedWith("Duration too short");
    });

    it("Should fail with duration above maximum (30 days)", async function () {
      const { nft, auction, seller } = await networkHelpers.loadFixture(mintAndApproveFixture);

      await expect(
        auction.connect(seller).createAuction(
          await nft.getAddress(), 0, STARTING_PRICE, 31 * ONE_DAY
        )
      ).to.be.revertedWith("Duration too long");
    });

    it("Should fail with zero starting price", async function () {
      const { nft, auction, seller } = await networkHelpers.loadFixture(mintAndApproveFixture);

      await expect(
        auction.connect(seller).createAuction(await nft.getAddress(), 0, 0, ONE_DAY)
      ).to.be.revertedWith("Starting price must be > 0");
    });

    it("Should fail if caller is not token owner", async function () {
      const { nft, auction, other } = await networkHelpers.loadFixture(mintAndApproveFixture);

      await expect(
        auction.connect(other).createAuction(await nft.getAddress(), 0, STARTING_PRICE, ONE_DAY)
      ).to.be.revertedWith("Not token owner");
    });
  });

  describe("Bidding", function () {
    it("Should accept first bid at starting price", async function () {
      const { auction, bidder1 } = await networkHelpers.loadFixture(activeAuctionFixture);

      await expect(
        auction.connect(bidder1).placeBid(0, { value: STARTING_PRICE })
      ).to.emit(auction, "BidPlaced");

      const auctionData = await auction.auctions(0);
      expect(auctionData.highestBid).to.equal(STARTING_PRICE);
      expect(auctionData.highestBidder).to.equal(bidder1.address);
    });

    it("Should reject first bid below starting price", async function () {
      const { auction, bidder1 } = await networkHelpers.loadFixture(activeAuctionFixture);

      await expect(
        auction.connect(bidder1).placeBid(0, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Bid below starting price");
    });

    it("Should accept outbid with 5% increment", async function () {
      const { auction, bidder1, bidder2 } = await networkHelpers.loadFixture(activeAuctionFixture);

      await auction.connect(bidder1).placeBid(0, { value: STARTING_PRICE });

      // 5% increment: 0.5 * 1.05 = 0.525 ETH
      const minBid = STARTING_PRICE + (STARTING_PRICE * 500n / 10000n);

      await expect(
        auction.connect(bidder2).placeBid(0, { value: minBid })
      ).to.emit(auction, "BidPlaced");

      const auctionData = await auction.auctions(0);
      expect(auctionData.highestBidder).to.equal(bidder2.address);
    });

    it("Should reject bid below 5% increment", async function () {
      const { auction, bidder1, bidder2 } = await networkHelpers.loadFixture(activeAuctionFixture);

      await auction.connect(bidder1).placeBid(0, { value: STARTING_PRICE });

      // Bid only 1% above — should fail
      const lowBid = STARTING_PRICE + (STARTING_PRICE * 100n / 10000n);

      await expect(
        auction.connect(bidder2).placeBid(0, { value: lowBid })
      ).to.be.revertedWith("Bid below minimum increment");
    });

    it("Should auto-refund previous bidder on outbid", async function () {
      const { auction, bidder1, bidder2 } = await networkHelpers.loadFixture(activeAuctionFixture);

      await auction.connect(bidder1).placeBid(0, { value: STARTING_PRICE });

      const bidder1BalBefore = await ethers.provider.getBalance(bidder1.address);

      const minBid = STARTING_PRICE + (STARTING_PRICE * 500n / 10000n);
      await auction.connect(bidder2).placeBid(0, { value: minBid });

      const bidder1BalAfter = await ethers.provider.getBalance(bidder1.address);
      expect(bidder1BalAfter - bidder1BalBefore).to.equal(STARTING_PRICE);
    });

    it("Should reject bid from seller", async function () {
      const { auction, seller } = await networkHelpers.loadFixture(activeAuctionFixture);

      await expect(
        auction.connect(seller).placeBid(0, { value: STARTING_PRICE })
      ).to.be.revertedWith("Seller cannot bid");
    });

    it("Should reject bid after auction expires", async function () {
      const { auction, bidder1 } = await networkHelpers.loadFixture(activeAuctionFixture);

      await networkHelpers.time.increase(ONE_DAY + 1);

      await expect(
        auction.connect(bidder1).placeBid(0, { value: STARTING_PRICE })
      ).to.be.revertedWith("Auction has expired");
    });

    it("Should record bid history", async function () {
      const { auction, bidder1, bidder2 } = await networkHelpers.loadFixture(activeAuctionFixture);

      await auction.connect(bidder1).placeBid(0, { value: STARTING_PRICE });
      const minBid = STARTING_PRICE + (STARTING_PRICE * 500n / 10000n);
      await auction.connect(bidder2).placeBid(0, { value: minBid });

      const bids = await auction.getAuctionBids(0);
      expect(bids.length).to.equal(2);
      expect(bids[0].bidder).to.equal(bidder1.address);
      expect(bids[0].amount).to.equal(STARTING_PRICE);
      expect(bids[1].bidder).to.equal(bidder2.address);
      expect(bids[1].amount).to.equal(minBid);
    });
  });

  describe("Anti-Sniping", function () {
    it("Should extend auction if bid placed in last 5 minutes", async function () {
      const { auction, bidder1 } = await networkHelpers.loadFixture(activeAuctionFixture);

      const auctionBefore = await auction.auctions(0);
      const originalEndTime = auctionBefore.endTime;

      // Fast forward to 3 minutes before end
      await networkHelpers.time.increaseTo(originalEndTime - BigInt(FIVE_MINUTES - 120));

      await auction.connect(bidder1).placeBid(0, { value: STARTING_PRICE });

      const auctionAfter = await auction.auctions(0);
      // End time should have been extended by 5 minutes
      expect(auctionAfter.endTime).to.be.gt(originalEndTime);
    });

    it("Should NOT extend auction if bid placed well before end", async function () {
      const { auction, bidder1 } = await networkHelpers.loadFixture(activeAuctionFixture);

      const auctionBefore = await auction.auctions(0);
      const originalEndTime = auctionBefore.endTime;

      // Only 1 hour into a 24-hour auction
      await networkHelpers.time.increase(ONE_HOUR);

      await auction.connect(bidder1).placeBid(0, { value: STARTING_PRICE });

      const auctionAfter = await auction.auctions(0);
      expect(auctionAfter.endTime).to.equal(originalEndTime);
    });
  });

  describe("End Auction", function () {
    it("Should transfer NFT and ETH correctly on end", async function () {
      const { nft, auction, owner, seller, bidder1, creator } =
        await networkHelpers.loadFixture(activeAuctionFixture);

      const bidAmount = ethers.parseEther("1");
      await auction.connect(bidder1).placeBid(0, { value: bidAmount });

      await networkHelpers.time.increase(ONE_DAY + 1);

      const ownerBalBefore = await ethers.provider.getBalance(owner.address);
      const sellerBalBefore = await ethers.provider.getBalance(seller.address);
      const creatorBalBefore = await ethers.provider.getBalance(creator.address);

      await auction.connect(bidder1).endAuction(0);

      // NFT to winner
      expect(await nft.ownerOf(0)).to.equal(bidder1.address);

      // Fees: 2.5% platform + 5% royalty
      const platformFeeAmt = bidAmount * 250n / 10000n;
      const royaltyAmt = bidAmount * 500n / 10000n;
      const sellerProceeds = bidAmount - platformFeeAmt - royaltyAmt;

      const ownerBalAfter = await ethers.provider.getBalance(owner.address);
      const sellerBalAfter = await ethers.provider.getBalance(seller.address);
      const creatorBalAfter = await ethers.provider.getBalance(creator.address);

      expect(ownerBalAfter - ownerBalBefore).to.equal(platformFeeAmt);
      expect(sellerBalAfter - sellerBalBefore).to.equal(sellerProceeds);
      expect(creatorBalAfter - creatorBalBefore).to.equal(royaltyAmt);
    });

    it("Should return NFT to seller if no bids", async function () {
      const { nft, auction, seller, other } = await networkHelpers.loadFixture(activeAuctionFixture);

      await networkHelpers.time.increase(ONE_DAY + 1);
      await auction.connect(other).endAuction(0);

      expect(await nft.ownerOf(0)).to.equal(seller.address);
    });

    it("Should emit AuctionEnded event", async function () {
      const { auction, bidder1 } = await networkHelpers.loadFixture(activeAuctionFixture);

      const bidAmount = ethers.parseEther("1");
      await auction.connect(bidder1).placeBid(0, { value: bidAmount });

      await networkHelpers.time.increase(ONE_DAY + 1);

      const platformFeeAmt = bidAmount * 250n / 10000n;
      const royaltyAmt = bidAmount * 500n / 10000n;

      await expect(auction.connect(bidder1).endAuction(0))
        .to.emit(auction, "AuctionEnded")
        .withArgs(0n, bidder1.address, bidAmount, platformFeeAmt, royaltyAmt);
    });

    it("Should fail if auction not yet expired", async function () {
      const { auction, bidder1 } = await networkHelpers.loadFixture(activeAuctionFixture);

      await auction.connect(bidder1).placeBid(0, { value: STARTING_PRICE });

      await expect(
        auction.connect(bidder1).endAuction(0)
      ).to.be.revertedWith("Auction not yet expired");
    });

    it("Should fail if auction already ended", async function () {
      const { auction, bidder1 } = await networkHelpers.loadFixture(activeAuctionFixture);

      await auction.connect(bidder1).placeBid(0, { value: STARTING_PRICE });
      await networkHelpers.time.increase(ONE_DAY + 1);
      await auction.connect(bidder1).endAuction(0);

      await expect(
        auction.connect(bidder1).endAuction(0)
      ).to.be.revertedWith("Auction already finalized");
    });

    it("Anyone can call endAuction after expiry", async function () {
      const { nft, auction, bidder1, other } = await networkHelpers.loadFixture(activeAuctionFixture);

      await auction.connect(bidder1).placeBid(0, { value: STARTING_PRICE });
      await networkHelpers.time.increase(ONE_DAY + 1);

      // `other` (not seller, not bidder) can end it
      await auction.connect(other).endAuction(0);

      expect(await nft.ownerOf(0)).to.equal(bidder1.address);
    });
  });

  describe("Cancel Auction", function () {
    it("Should cancel before any bids and return NFT", async function () {
      const { nft, auction, seller } = await networkHelpers.loadFixture(activeAuctionFixture);

      await expect(auction.connect(seller).cancelAuction(0))
        .to.emit(auction, "AuctionCancelled")
        .withArgs(0n);

      expect(await nft.ownerOf(0)).to.equal(seller.address);

      const auctionData = await auction.auctions(0);
      expect(auctionData.cancelled).to.be.true;
    });

    it("Should fail to cancel after bid is placed", async function () {
      const { auction, seller, bidder1 } = await networkHelpers.loadFixture(activeAuctionFixture);

      await auction.connect(bidder1).placeBid(0, { value: STARTING_PRICE });

      await expect(
        auction.connect(seller).cancelAuction(0)
      ).to.be.revertedWith("Cannot cancel after bids");
    });

    it("Should fail if non-seller tries to cancel", async function () {
      const { auction, other } = await networkHelpers.loadFixture(activeAuctionFixture);

      await expect(
        auction.connect(other).cancelAuction(0)
      ).to.be.revertedWith("Not the seller");
    });

    it("Should fail to cancel already cancelled auction", async function () {
      const { auction, seller } = await networkHelpers.loadFixture(activeAuctionFixture);

      await auction.connect(seller).cancelAuction(0);

      await expect(
        auction.connect(seller).cancelAuction(0)
      ).to.be.revertedWith("Auction already finalized");
    });
  });

  describe("Fetch Active Auctions", function () {
    it("Should return only active auctions", async function () {
      const { nft, auction, owner, creator, seller } =
        await networkHelpers.loadFixture(deployFixture);

      const nftAddr = await nft.getAddress();
      const auctionAddr = await auction.getAddress();

      for (let i = 0; i < 3; i++) {
        await nft.connect(creator).mint(seller.address, `ipfs://token${i}`, ROYALTY_BPS, { value: MINT_FEE });
        await nft.connect(seller).approve(auctionAddr, i);
        await auction.connect(seller).createAuction(nftAddr, i, STARTING_PRICE, ONE_DAY);
      }

      // Cancel auction 1
      await auction.connect(seller).cancelAuction(1);

      const active = await auction.fetchActiveAuctions();
      expect(active.length).to.equal(2);
      expect(active[0].auctionId).to.equal(0n);
      expect(active[1].auctionId).to.equal(2n);
    });
  });

  describe("Platform Fee Admin", function () {
    it("Should allow owner to update platform fee", async function () {
      const { auction, owner } = await networkHelpers.loadFixture(deployFixture);

      await expect(auction.connect(owner).setPlatformFee(500))
        .to.emit(auction, "PlatformFeeUpdated")
        .withArgs(250, 500);

      expect(await auction.platformFee()).to.equal(500);
    });

    it("Should reject fee above maximum", async function () {
      const { auction, owner } = await networkHelpers.loadFixture(deployFixture);

      await expect(
        auction.connect(owner).setPlatformFee(1001)
      ).to.be.revertedWith("Fee exceeds maximum");
    });
  });
});
