import { expect } from "chai";
import hre from "hardhat";

const { ethers, networkHelpers } = await hre.network.connect();

describe("NFTCollection", function () {
  const MINT_FEE = ethers.parseEther("0.001");
  const TOKEN_URI = "ipfs://QmTest123/metadata.json";
  const TOKEN_URI_2 = "ipfs://QmTest456/metadata.json";
  const ROYALTY_BPS = 500n; // 5%

  async function deployFixture() {
    const [owner, minter, receiver, other] = await ethers.getSigners();

    const nft = await ethers.deployContract("NFTCollection", [
      "Test NFT",
      "TNFT",
      MINT_FEE,
      owner.address,
    ]);

    return { nft, owner, minter, receiver, other };
  }

  describe("Deployment", function () {
    it("Should set correct name and symbol", async function () {
      const { nft } = await networkHelpers.loadFixture(deployFixture);
      expect(await nft.name()).to.equal("Test NFT");
      expect(await nft.symbol()).to.equal("TNFT");
    });

    it("Should set correct mint fee", async function () {
      const { nft } = await networkHelpers.loadFixture(deployFixture);
      expect(await nft.mintFee()).to.equal(MINT_FEE);
    });

    it("Should set correct owner", async function () {
      const { nft, owner } = await networkHelpers.loadFixture(deployFixture);
      expect(await nft.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should mint with correct ETH fee", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);

      await expect(
        nft.connect(minter).mint(minter.address, TOKEN_URI, ROYALTY_BPS, { value: MINT_FEE })
      ).to.emit(nft, "NFTMinted").withArgs(0n, minter.address, TOKEN_URI);

      expect(await nft.ownerOf(0)).to.equal(minter.address);
    });

    it("Should fail without sufficient ETH", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);
      const lowFee = ethers.parseEther("0.0001");

      await expect(
        nft.connect(minter).mint(minter.address, TOKEN_URI, ROYALTY_BPS, { value: lowFee })
      ).to.be.revertedWith("Insufficient mint fee");
    });

    it("Should fail with zero value when fee is set", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);

      await expect(
        nft.connect(minter).mint(minter.address, TOKEN_URI, ROYALTY_BPS, { value: 0 })
      ).to.be.revertedWith("Insufficient mint fee");
    });

    it("Should fail with royalty above 10%", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);

      await expect(
        nft.connect(minter).mint(minter.address, TOKEN_URI, 1001n, { value: MINT_FEE })
      ).to.be.revertedWith("Royalty max 10%");
    });

    it("Should set tokenURI correctly", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);

      await nft.connect(minter).mint(minter.address, TOKEN_URI, ROYALTY_BPS, { value: MINT_FEE });
      expect(await nft.tokenURI(0)).to.equal(TOKEN_URI);
    });

    it("Should increment tokenId on successive mints", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);

      await nft.connect(minter).mint(minter.address, TOKEN_URI, ROYALTY_BPS, { value: MINT_FEE });
      await nft.connect(minter).mint(minter.address, TOKEN_URI_2, ROYALTY_BPS, { value: MINT_FEE });

      expect(await nft.ownerOf(0)).to.equal(minter.address);
      expect(await nft.ownerOf(1)).to.equal(minter.address);
      expect(await nft.totalSupply()).to.equal(2n);
    });

    it("Should mint to a different recipient", async function () {
      const { nft, minter, receiver } = await networkHelpers.loadFixture(deployFixture);

      await nft.connect(minter).mint(receiver.address, TOKEN_URI, ROYALTY_BPS, { value: MINT_FEE });
      expect(await nft.ownerOf(0)).to.equal(receiver.address);
    });
  });

  describe("Royalty (ERC-2981)", function () {
    it("Should return correct royalty info", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);

      await nft.connect(minter).mint(minter.address, TOKEN_URI, ROYALTY_BPS, { value: MINT_FEE });

      const salePrice = ethers.parseEther("1");
      const [receiver, royaltyAmount] = await nft.royaltyInfo(0, salePrice);

      expect(receiver).to.equal(minter.address);
      // 5% of 1 ETH = 0.05 ETH
      expect(royaltyAmount).to.equal(ethers.parseEther("0.05"));
    });

    it("Should return zero royalty when royaltyFraction is 0", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);

      await nft.connect(minter).mint(minter.address, TOKEN_URI, 0n, { value: MINT_FEE });

      const salePrice = ethers.parseEther("1");
      const [, royaltyAmount] = await nft.royaltyInfo(0, salePrice);
      expect(royaltyAmount).to.equal(0n);
    });

    it("Should support ERC-2981 interface", async function () {
      const { nft } = await networkHelpers.loadFixture(deployFixture);
      // ERC-2981 interfaceId = 0x2a55205a
      expect(await nft.supportsInterface("0x2a55205a")).to.be.true;
    });
  });

  describe("Batch Minting", function () {
    it("Should batch mint multiple NFTs", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);
      const uris = [TOKEN_URI, TOKEN_URI_2, "ipfs://QmTest789/metadata.json"];
      const totalFee = MINT_FEE * BigInt(uris.length);

      await nft.connect(minter).batchMint(minter.address, uris, ROYALTY_BPS, { value: totalFee });

      expect(await nft.totalSupply()).to.equal(3n);
      expect(await nft.ownerOf(0)).to.equal(minter.address);
      expect(await nft.ownerOf(1)).to.equal(minter.address);
      expect(await nft.ownerOf(2)).to.equal(minter.address);
      expect(await nft.tokenURI(0)).to.equal(uris[0]);
      expect(await nft.tokenURI(1)).to.equal(uris[1]);
      expect(await nft.tokenURI(2)).to.equal(uris[2]);
    });

    it("Should fail with empty URI array", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);

      await expect(
        nft.connect(minter).batchMint(minter.address, [], ROYALTY_BPS, { value: MINT_FEE })
      ).to.be.revertedWith("Invalid batch size");
    });

    it("Should fail when batch exceeds max size (10)", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);
      const uris = Array(11).fill(TOKEN_URI);
      const totalFee = MINT_FEE * 11n;

      await expect(
        nft.connect(minter).batchMint(minter.address, uris, ROYALTY_BPS, { value: totalFee })
      ).to.be.revertedWith("Invalid batch size");
    });

    it("Should fail with insufficient ETH for batch", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);
      const uris = [TOKEN_URI, TOKEN_URI_2];

      await expect(
        nft.connect(minter).batchMint(minter.address, uris, ROYALTY_BPS, { value: MINT_FEE })
      ).to.be.revertedWith("Insufficient mint fee");
    });

    it("Should emit NFTMinted for each token in batch", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);
      const uris = [TOKEN_URI, TOKEN_URI_2];
      const totalFee = MINT_FEE * 2n;

      const tx = await nft.connect(minter).batchMint(minter.address, uris, ROYALTY_BPS, { value: totalFee });

      await expect(tx).to.emit(nft, "NFTMinted").withArgs(0n, minter.address, TOKEN_URI);
      await expect(tx).to.emit(nft, "NFTMinted").withArgs(1n, minter.address, TOKEN_URI_2);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to set mint fee", async function () {
      const { nft, owner } = await networkHelpers.loadFixture(deployFixture);
      const newFee = ethers.parseEther("0.01");

      await expect(nft.connect(owner).setMintFee(newFee))
        .to.emit(nft, "MintFeeUpdated")
        .withArgs(MINT_FEE, newFee);

      expect(await nft.mintFee()).to.equal(newFee);
    });

    it("Should reject non-owner setting mint fee", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);

      await expect(
        nft.connect(minter).setMintFee(ethers.parseEther("0.01"))
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to withdraw accumulated fees", async function () {
      const { nft, owner, minter } = await networkHelpers.loadFixture(deployFixture);

      // Mint 3 NFTs to accumulate fees
      for (let i = 0; i < 3; i++) {
        await nft.connect(minter).mint(minter.address, TOKEN_URI, ROYALTY_BPS, { value: MINT_FEE });
      }

      const expectedBalance = MINT_FEE * 3n;
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await nft.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + expectedBalance - gasUsed);
    });

    it("Should fail withdraw when no balance", async function () {
      const { nft, owner } = await networkHelpers.loadFixture(deployFixture);

      await expect(nft.connect(owner).withdraw()).to.be.revertedWith("No balance to withdraw");
    });

    it("Should reject non-owner withdraw", async function () {
      const { nft, minter } = await networkHelpers.loadFixture(deployFixture);

      await expect(
        nft.connect(minter).withdraw()
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  describe("tokensByOwner", function () {
    it("Should return correct tokens for owner", async function () {
      const { nft, minter, receiver } = await networkHelpers.loadFixture(deployFixture);

      await nft.connect(minter).mint(minter.address, TOKEN_URI, ROYALTY_BPS, { value: MINT_FEE });
      await nft.connect(minter).mint(minter.address, TOKEN_URI_2, ROYALTY_BPS, { value: MINT_FEE });
      await nft.connect(minter).mint(receiver.address, TOKEN_URI, ROYALTY_BPS, { value: MINT_FEE });

      const minterTokens = await nft.tokensByOwner(minter.address);
      expect(minterTokens.length).to.equal(2);
      expect(minterTokens[0]).to.equal(0n);
      expect(minterTokens[1]).to.equal(1n);

      const receiverTokens = await nft.tokensByOwner(receiver.address);
      expect(receiverTokens.length).to.equal(1);
      expect(receiverTokens[0]).to.equal(2n);
    });

    it("Should return empty array for address with no tokens", async function () {
      const { nft, other } = await networkHelpers.loadFixture(deployFixture);
      const tokens = await nft.tokensByOwner(other.address);
      expect(tokens.length).to.equal(0);
    });

    it("Should update after transfer", async function () {
      const { nft, minter, receiver } = await networkHelpers.loadFixture(deployFixture);

      await nft.connect(minter).mint(minter.address, TOKEN_URI, ROYALTY_BPS, { value: MINT_FEE });
      await nft.connect(minter).mint(minter.address, TOKEN_URI_2, ROYALTY_BPS, { value: MINT_FEE });

      // Transfer token 0 from minter to receiver
      await nft.connect(minter).transferFrom(minter.address, receiver.address, 0);

      const minterTokens = await nft.tokensByOwner(minter.address);
      expect(minterTokens.length).to.equal(1);
      expect(minterTokens[0]).to.equal(1n);

      const receiverTokens = await nft.tokensByOwner(receiver.address);
      expect(receiverTokens.length).to.equal(1);
      expect(receiverTokens[0]).to.equal(0n);
    });
  });
});
