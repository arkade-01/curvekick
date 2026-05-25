import { network } from "hardhat";
import type { Log } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/**
 * Deploy order:
 *   1. TestToken      — CKUSD (testnet only; use real stablecoin address on mainnet)
 *   2. Resolver       — enforces the 90-min match-end timelock
 *   3. MarketFactory  — creates MatchMarkets with Resolver as their admin
 *   4. One sample MatchMarket via the factory (optional smoke-test)
 *
 * Run:
 *   npx hardhat run scripts/deploy.ts --network xlayer_testnet
 *
 * For mainnet, set TOKEN_ADDRESS env var to the real stablecoin (USDC/USDT on X Layer):
 *   TOKEN_ADDRESS=0x... npx hardhat run scripts/deploy.ts --network xlayer_mainnet
 */

async function main() {
  const { ethers } = await network.getOrCreate();
  const [deployer] = await ethers.getSigners();

  console.log("Deployer  :", deployer.address);
  console.log("Balance   :", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "OKB (gas)");
  console.log();

  let tokenAddr = process.env.TOKEN_ADDRESS;

  // ── 1. TestToken (testnet only) ───────────────────────────────────────────
  if (!tokenAddr) {
    console.log("Deploying TestToken (CKUSD)...");
    const Token = await ethers.getContractFactory("TestToken");
    const token = await Token.deploy();
    await token.waitForDeployment();
    tokenAddr = await token.getAddress();
    console.log("TestToken :", tokenAddr);
  } else {
    console.log("Using existing token:", tokenAddr);
  }

  // ── 2. Resolver ───────────────────────────────────────────────────────────
  console.log("\nDeploying Resolver...");
  const Resolver = await ethers.getContractFactory("Resolver");
  const resolver = await Resolver.deploy(deployer.address);
  await resolver.waitForDeployment();
  const resolverAddr = await resolver.getAddress();
  console.log("Resolver  :", resolverAddr);

  // ── 3. MarketFactory ──────────────────────────────────────────────────────
  console.log("\nDeploying MarketFactory...");
  const Factory = await ethers.getContractFactory("MarketFactory");
  const factory = await Factory.deploy(deployer.address, resolverAddr, tokenAddr);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("Factory   :", factoryAddr);

  // ── 4. Sample market ──────────────────────────────────────────────────────
  console.log("\nCreating sample market: BRAZ-FRA-01...");
  const matchTime = BigInt(Math.floor(Date.now() / 1000)) + 7200n;
  const tx = await factory.createMarket("BRAZ-FRA-01", matchTime);
  const receipt = await tx.wait();

  const iface = factory.interface;
  const event = receipt?.logs
    .map((l: Log) => { try { return iface.parseLog(l); } catch { return null; } })
    .find((e: ReturnType<typeof iface.parseLog>) => e?.name === "MarketCreated");

  const marketAddr = event?.args.market as string ?? "(parse failed)";
  console.log("Market    :", marketAddr);

  // ── Save deployment info ──────────────────────────────────────────────────
  const net = await ethers.provider.getNetwork();
  const isTestnet = net.chainId === 1952n;
  const filename = isTestnet ? "xlayer_testnet.json" : "xlayer_mainnet.json";
  const outPath = path.join(__dirname, "..", "deployments", filename);

  const deployment = {
    network:    isTestnet ? "X Layer Testnet" : "X Layer Mainnet",
    chainId:    Number(net.chainId),
    deployedAt: new Date().toISOString().slice(0, 10),
    deployer:   deployer.address,
    contracts: {
      TestToken:     isTestnet ? tokenAddr : "n/a (use real stablecoin)",
      Resolver:      resolverAddr,
      MarketFactory: factoryAddr,
      sampleMarket:  marketAddr,
    },
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));

  console.log("\n── Deployment complete ──────────────────────────────");
  console.log(JSON.stringify(deployment.contracts, null, 2));
  console.log(`\nSaved to deployments/${filename}`);
  console.log("\nNext steps:");
  console.log("  1. Update FACTORY_ADDRESS + TOKEN_ADDRESS in frontend/lib/contracts.ts");
  console.log("  2. MARKET_ADDRESS=<addr> npx hardhat run scripts/seedMarket.ts --network xlayer_testnet");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
