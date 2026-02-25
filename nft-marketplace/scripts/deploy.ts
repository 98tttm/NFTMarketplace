import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const { ethers, networkName } = await network.connect();
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log(`Network:  ${networkName}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("=".repeat(60));

  // ── 1. Deploy NFTCollection ──
  console.log("\n[1/3] Deploying NFTCollection...");
  const mintFee = ethers.parseEther("0.001");
  const nftCollection = await ethers.deployContract("NFTCollection", [
    "NFT Marketplace Collection",
    "NFTM",
    mintFee,
    deployer.address,
  ]);
  await nftCollection.waitForDeployment();
  const nftAddress = await nftCollection.getAddress();
  console.log(`  ✓ NFTCollection deployed at: ${nftAddress}`);

  // ── 2. Deploy NFTMarketplace ──
  console.log("\n[2/3] Deploying NFTMarketplace...");
  const marketplace = await ethers.deployContract("NFTMarketplace", [
    deployer.address,
  ]);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log(`  ✓ NFTMarketplace deployed at: ${marketplaceAddress}`);

  // ── 3. Deploy NFTAuction ──
  console.log("\n[3/3] Deploying NFTAuction...");
  const auction = await ethers.deployContract("NFTAuction", [
    deployer.address,
  ]);
  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();
  console.log(`  ✓ NFTAuction deployed at: ${auctionAddress}`);

  // ── Save deployment addresses ──
  const deploymentData = {
    network: networkName,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    contracts: {
      NFTCollection: nftAddress,
      NFTMarketplace: marketplaceAddress,
      NFTAuction: auctionAddress,
    },
    constructorArgs: {
      NFTCollection: ["NFT Marketplace Collection", "NFTM", mintFee.toString(), deployer.address],
      NFTMarketplace: [deployer.address],
      NFTAuction: [deployer.address],
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filePath = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n📄 Deployment data saved to: deployments/${networkName}.json`);

  // ── Etherscan verification ──
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("\n⏳ Waiting 30s for Etherscan indexing...");
    await new Promise((r) => setTimeout(r, 30_000));

    const contracts = [
      { name: "NFTCollection", address: nftAddress, args: deploymentData.constructorArgs.NFTCollection },
      { name: "NFTMarketplace", address: marketplaceAddress, args: deploymentData.constructorArgs.NFTMarketplace },
      { name: "NFTAuction", address: auctionAddress, args: deploymentData.constructorArgs.NFTAuction },
    ];

    for (const c of contracts) {
      try {
        console.log(`  Verifying ${c.name}...`);
        const { run } = await import("hardhat");
        await run("verify:verify", {
          address: c.address,
          constructorArguments: c.args,
        });
        console.log(`  ✓ ${c.name} verified`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("Already Verified")) {
          console.log(`  ✓ ${c.name} already verified`);
        } else {
          console.error(`  ✗ ${c.name} verification failed:`, message);
        }
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log(`  NFTCollection:  ${nftAddress}`);
  console.log(`  NFTMarketplace: ${marketplaceAddress}`);
  console.log(`  NFTAuction:     ${auctionAddress}`);
  console.log("=".repeat(60));
  if (networkName === "localhost") {
    console.log("\n⚠️  Cập nhật .env.local với 3 dòng sau:\n");
    console.log(`NEXT_PUBLIC_NFT_ADDRESS=${nftAddress}`);
    console.log(`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${marketplaceAddress}`);
    console.log(`NEXT_PUBLIC_AUCTION_ADDRESS=${auctionAddress}`);
    console.log("");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
