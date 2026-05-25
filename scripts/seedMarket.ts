import { network } from "hardhat";

/**
 * Seed a market with buys across all 3 outcomes.
 *
 * Usage:
 *   MARKET_ADDRESS=0x... npx hardhat run scripts/seedMarket.ts --network xlayer_testnet
 *
 * Optional:
 *   HOME_SHARES=10 DRAW_SHARES=5 AWAY_SHARES=8   (defaults: 10 / 5 / 8)
 *
 * The deployer wallet must hold CKUSD. The deploy script mints 1 000 000 to the deployer.
 */

const ERC20_ABI = [
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve",  outputs: [{ type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "account", type: "address" }],                                       name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view",      type: "function" },
];

const MARKET_ABI = [
  { inputs: [{ name: "outcome", type: "uint8" }, { name: "shares", type: "uint256" }, { name: "maxCost", type: "uint256" }], name: "buy",    outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "", type: "uint256" }],                                                                                   name: "curves", outputs: [{ type: "address" }],              stateMutability: "view",       type: "function" },
  { inputs: [],                                                                                                                 name: "token",  outputs: [{ type: "address" }],              stateMutability: "view",       type: "function" },
];

const CURVE_ABI = [
  { inputs: [{ name: "shares", type: "uint256" }], name: "getBuyCost", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
];

async function main() {
  const marketAddress = process.env.MARKET_ADDRESS;
  if (!marketAddress) {
    console.error("Usage: MARKET_ADDRESS=0x... npx hardhat run scripts/seedMarket.ts --network xlayer_testnet");
    process.exit(1);
  }

  const homeShares = BigInt(process.env.HOME_SHARES ?? "10");
  const drawShares = BigInt(process.env.DRAW_SHARES ?? "5");
  const awayShares = BigInt(process.env.AWAY_SHARES ?? "8");

  const { ethers } = await network.getOrCreate();
  const [buyer] = await ethers.getSigners();

  const market = await ethers.getContractAt(MARKET_ABI, marketAddress, buyer);
  const tokenAddress = await market.token();
  const token = await ethers.getContractAt(ERC20_ABI, tokenAddress, buyer);

  const tokenBalance = await token.balanceOf(buyer.address);
  console.log("Buyer     :", buyer.address);
  console.log("CKUSD bal :", ethers.formatEther(tokenBalance), "CKUSD");
  console.log("Market    :", marketAddress);
  console.log("Token     :", tokenAddress);
  console.log();

  const buys: [string, bigint, number][] = [
    ["HOME", homeShares, 0],
    ["DRAW", drawShares, 1],
    ["AWAY", awayShares, 2],
  ];

  // Calculate total cost for one upfront approval
  let totalCost = 0n;
  const costs: bigint[] = [];
  for (const [, shares, outcome] of buys) {
    const curveAddr = await market.curves(outcome);
    const curve = await ethers.getContractAt(CURVE_ABI, curveAddr, buyer);
    const cost = await curve.getBuyCost(shares);
    costs.push(cost);
    totalCost += cost;
  }

  console.log("Total cost:", ethers.formatEther(totalCost), "CKUSD");
  console.log("Approving market to spend CKUSD...");
  const approveTx = await token.approve(marketAddress, totalCost);
  await approveTx.wait();
  console.log("  ✓ Approved");
  console.log();

  for (let i = 0; i < buys.length; i++) {
    const [label, shares, outcome] = buys[i];
    const cost    = costs[i];
    const maxCost = cost * 102n / 100n; // 2% slippage buffer

    console.log(`Buying ${shares} ${label} shares — cost: ${ethers.formatEther(cost)} CKUSD`);
    const tx = await market.buy(outcome, shares, maxCost);
    console.log(`  Tx: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✓ Confirmed`);
  }

  console.log(`\n✓ Seeded ${homeShares + drawShares + awayShares} shares across HOME / DRAW / AWAY.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
