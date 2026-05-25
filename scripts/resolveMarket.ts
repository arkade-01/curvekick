import { network } from "hardhat";

/**
 * Resolve a market via the Resolver contract (enforces 90-min timelock).
 *
 * Usage:
 *   MARKET_ADDRESS=0x... OUTCOME=0 \
 *   npx hardhat run scripts/resolveMarket.ts --network xlayer_testnet
 *
 * OUTCOME: 0 = HOME win, 1 = DRAW, 2 = AWAY win
 *
 * Note: will revert if called before matchTime + 90 minutes.
 * Use FORCE=true to skip the timelock check in the script (the contract still enforces it).
 */

const RESOLVER_ADDRESS = process.env.RESOLVER_ADDRESS ?? "0xd6aB451f8DF1CC95Eca61fef838F2c35B5B546bA";

const RESOLVER_ABI = [
  { inputs: [{ name: "market", type: "address" }, { name: "outcome", type: "uint8" }], name: "resolve", outputs: [], stateMutability: "nonpayable", type: "function" },
];

const MARKET_ABI = [
  { inputs: [], name: "matchTime",       outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "resolved",        outputs: [{ type: "bool" }],    stateMutability: "view", type: "function" },
  { inputs: [], name: "matchId",         outputs: [{ type: "string" }],  stateMutability: "view", type: "function" },
  { inputs: [], name: "resolvedOutcome", outputs: [{ type: "uint8" }],   stateMutability: "view", type: "function" },
];

const OUTCOME_LABELS = ["HOME", "DRAW", "AWAY"];

async function main() {
  const marketAddress = process.env.MARKET_ADDRESS;
  const outcomeStr    = process.env.OUTCOME;

  if (!marketAddress || outcomeStr === undefined) {
    console.error("Usage: MARKET_ADDRESS=0x... OUTCOME=0|1|2 npx hardhat run scripts/resolveMarket.ts --network xlayer_testnet");
    process.exit(1);
  }

  const outcome = parseInt(outcomeStr) as 0 | 1 | 2;
  if (![0, 1, 2].includes(outcome)) {
    console.error("OUTCOME must be 0 (HOME), 1 (DRAW), or 2 (AWAY)");
    process.exit(1);
  }

  const { ethers } = await network.getOrCreate();
  const [admin] = await ethers.getSigners();

  const market   = await ethers.getContractAt(MARKET_ABI, marketAddress, admin);
  const resolver = await ethers.getContractAt(RESOLVER_ABI, RESOLVER_ADDRESS, admin);

  const matchId   = await market.matchId();
  const matchTime = await market.matchTime();
  const isResolved = await market.resolved();
  const now        = BigInt(Math.floor(Date.now() / 1000));
  const unlockAt   = matchTime + 5400n; // matchTime + 90 min
  const timeLeft   = unlockAt > now ? unlockAt - now : 0n;

  console.log("Admin    :", admin.address);
  console.log("Resolver :", RESOLVER_ADDRESS);
  console.log("Market   :", marketAddress);
  console.log("Match ID :", matchId);
  console.log("Kickoff  :", new Date(Number(matchTime) * 1000).toUTCString());
  console.log("Unlocks  :", new Date(Number(unlockAt) * 1000).toUTCString());
  console.log("Outcome  :", OUTCOME_LABELS[outcome]);
  console.log();

  if (isResolved) {
    const existing = await market.resolvedOutcome();
    console.log(`✗ Already resolved — outcome: ${OUTCOME_LABELS[existing]} (${existing})`);
    process.exit(0);
  }

  if (timeLeft > 0n && !process.env.FORCE) {
    console.error(`✗ Too early — timelock expires in ${Math.ceil(Number(timeLeft) / 60)} minutes.`);
    console.error("  Wait until after the match finishes, or set FORCE=true to attempt anyway.");
    process.exit(1);
  }

  console.log(`Sending resolve(${marketAddress}, ${outcome})...`);
  const tx = await resolver.resolve(marketAddress, outcome);
  console.log("Tx      :", tx.hash);
  await tx.wait();
  console.log(`\n✓ Market resolved — ${OUTCOME_LABELS[outcome]} wins.`);
  console.log("  Winners can now claim their OKB from the frontend.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
