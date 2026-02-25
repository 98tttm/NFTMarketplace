import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PINATA_JWT = process.env.PINATA_JWT || "";

async function uploadJSON(metadata: object): Promise<string> {
  if (!PINATA_JWT) throw new Error("PINATA_JWT not set in .env.local");

  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataOptions: { cidVersion: 1 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { IpfsHash: string };
  return data.IpfsHash;
}

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=600&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
  "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=600&q=80",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&q=80",
  "https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=600&q=80",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80",
];

const SAMPLE_NFTS = [
  {
    name: "Thiên hà số",
    description: "Tác phẩm nghệ thuật kỹ thuật số lấy cảm hứng từ vũ trụ bao la.",
    attributes: [
      { trait_type: "Thể loại", value: "Trừu tượng" },
      { trait_type: "Màu chủ đạo", value: "Tím" },
    ],
    royalty: 500,
  },
  {
    name: "Hoàng hôn gradient",
    description: "Bức tranh gradient mô phỏng hoàng hôn trên biển, tông ấm rực rỡ.",
    attributes: [
      { trait_type: "Thể loại", value: "Phong cảnh" },
      { trait_type: "Màu chủ đạo", value: "Cam" },
    ],
    royalty: 750,
  },
  {
    name: "Mèo pixel art",
    description: "NFT pixel art dễ thương, phong cách retro 8-bit.",
    attributes: [
      { trait_type: "Thể loại", value: "Pixel Art" },
      { trait_type: "Độ hiếm", value: "Hiếm" },
    ],
    royalty: 300,
  },
  {
    name: "Sóng neon",
    description: "Tác phẩm abstract với hiệu ứng neon rực rỡ trên nền tối.",
    attributes: [
      { trait_type: "Thể loại", value: "Neon" },
      { trait_type: "Phong cách", value: "Cyberpunk" },
    ],
    royalty: 500,
  },
  {
    name: "Dải ngân hà",
    description: "Hình ảnh dải ngân hà lung linh qua lăng kính nghệ thuật số.",
    attributes: [
      { trait_type: "Thể loại", value: "Vũ trụ" },
      { trait_type: "Độ hiếm", value: "Cực hiếm" },
    ],
    royalty: 1000,
  },
  {
    name: "Bức tranh sơn dầu #1",
    description: "Phiên bản kỹ thuật số của tranh sơn dầu cổ điển, kết hợp hiện đại.",
    attributes: [
      { trait_type: "Thể loại", value: "Cổ điển" },
      { trait_type: "Chất liệu", value: "Sơn dầu số" },
    ],
    royalty: 250,
  },
];

async function main() {
  const { ethers, networkName } = await network.connect();
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const buyer = signers[1];

  const deploymentPath = path.join(__dirname, "..", "deployments", `${networkName}.json`);
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`No deployment found for "${networkName}". Run deploy first.`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  const { NFTCollection, NFTMarketplace, NFTAuction } = deployment.contracts;

  console.log("\n" + "=".repeat(60));
  console.log("🌱 SEEDING MARKETPLACE DATA");
  console.log("=".repeat(60));
  console.log(`Network:     ${networkName}`);
  console.log(`Deployer:    ${deployer.address}`);
  console.log(`Buyer:       ${buyer.address}`);
  console.log(`NFT:         ${NFTCollection}`);
  console.log(`Marketplace: ${NFTMarketplace}`);
  console.log(`Auction:     ${NFTAuction}`);
  console.log("=".repeat(60));

  const nft = await ethers.getContractAt("NFTCollection", NFTCollection);
  const marketplace = await ethers.getContractAt("NFTMarketplace", NFTMarketplace);
  const auction = await ethers.getContractAt("NFTAuction", NFTAuction);
  const mintFee = await nft.mintFee();

  // ── Step 1: Upload metadata to IPFS and mint NFTs ──
  console.log("\n📦 Step 1: Minting NFTs...\n");

  const tokenIds: number[] = [];
  for (let i = 0; i < SAMPLE_NFTS.length; i++) {
    const sample = SAMPLE_NFTS[i];
    const imageUrl = SAMPLE_IMAGES[i % SAMPLE_IMAGES.length];

    console.log(`  [${i + 1}/${SAMPLE_NFTS.length}] "${sample.name}"`);

    const metadata = {
      name: sample.name,
      description: sample.description,
      image: imageUrl,
      attributes: sample.attributes,
    };

    console.log(`    ↳ Uploading metadata to IPFS...`);
    const cid = await uploadJSON(metadata);
    const tokenURI = `ipfs://${cid}`;
    console.log(`    ↳ CID: ${cid}`);

    const minter = i < 4 ? deployer : buyer;
    const tx = await nft.connect(minter).mint(minter.address, tokenURI, BigInt(sample.royalty), { value: mintFee });
    const receipt = await tx.wait();
    const tokenId = Number(await nft.totalSupply()) - 1;
    tokenIds.push(tokenId);
    console.log(`    ✓ Minted token #${tokenId} by ${minter.address.slice(0, 8)}...`);
  }

  // ── Step 2: List some NFTs for sale ──
  console.log("\n🏷️  Step 2: Listing NFTs for sale...\n");

  const listPrices = ["0.05", "0.1", "0.25"];
  for (let i = 0; i < 3 && i < tokenIds.length; i++) {
    const tokenId = tokenIds[i];
    const price = ethers.parseEther(listPrices[i]);

    console.log(`  Listing token #${tokenId} for ${listPrices[i]} ETH...`);
    const approveTx = await nft.connect(deployer).approve(NFTMarketplace, tokenId);
    await approveTx.wait();

    const listTx = await marketplace.connect(deployer).listNFT(NFTCollection, tokenId, price);
    await listTx.wait();
    console.log(`    ✓ Listed token #${tokenId}`);
  }

  // ── Step 3: Create an auction ──
  console.log("\n🔨 Step 3: Creating auction...\n");

  if (tokenIds.length >= 4) {
    const auctionTokenId = tokenIds[3];
    const startingPrice = ethers.parseEther("0.02");
    const duration = 3600 * 24; // 24 hours

    console.log(`  Creating auction for token #${auctionTokenId}...`);
    const approveTx = await nft.connect(deployer).approve(NFTAuction, auctionTokenId);
    await approveTx.wait();

    const auctionTx = await auction.connect(deployer).createAuction(
      NFTCollection,
      auctionTokenId,
      startingPrice,
      duration
    );
    await auctionTx.wait();
    console.log(`    ✓ Auction created: starting ${ethers.formatEther(startingPrice)} ETH, 24h duration`);

    // Place a bid from buyer account
    console.log(`  Placing a bid from buyer...`);
    const bidAmount = ethers.parseEther("0.05");
    const bidTx = await auction.connect(buyer).placeBid(0, { value: bidAmount });
    await bidTx.wait();
    console.log(`    ✓ Bid placed: ${ethers.formatEther(bidAmount)} ETH by ${buyer.address.slice(0, 8)}...`);
  }

  // ── Summary ──
  const totalSupply = await nft.totalSupply();
  const marketItems = await marketplace.fetchMarketItems();
  const activeListings = marketItems.filter((l: { active: boolean }) => l.active).length;
  const activeAuctions = await auction.fetchActiveAuctions();

  console.log("\n" + "=".repeat(60));
  console.log("✅ SEEDING COMPLETE");
  console.log("=".repeat(60));
  console.log(`  NFT đã tạo:      ${totalSupply}`);
  console.log(`  Đang bán:         ${activeListings}`);
  console.log(`  Phiên đấu giá:    ${activeAuctions.length}`);
  console.log(`  Deployer sở hữu:  token #0, #1, #2, #3`);
  console.log(`  Buyer sở hữu:     token #4, #5`);
  console.log("=".repeat(60));
  console.log("\n🚀 Mở http://localhost:3000 để xem!\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
