import { network } from "hardhat";
import type { Log } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/**
 * Create a single market on the deployed factory.
 *
 * Usage:
 *   MATCH_ID="BRAZ-FRA-01" KICKOFF_UTC="2026-06-14T18:00:00Z" FIXTURE_ID=1035135 \
 *   npx hardhat run scripts/createMarket.ts --network xlayer_testnet
 *
 * MATCH_ID   : {HOME_CODE}-{AWAY_CODE}-{NN}   e.g. "ARG-ENG-03"
 * KICKOFF_UTC: ISO-8601 string in UTC           e.g. "2026-06-14T18:00:00Z"
 * FIXTURE_ID : API-Football fixture ID (optional — used by the listener service)
 */

// Paste the factory address here (or keep it in the deployments file).
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS ?? "0xC3bFc40bf7695DEEefB71A54551b819ED1C09F2A";

async function main() {
  const matchId    = process.env.MATCH_ID;
  const kickoffUtc = process.env.KICKOFF_UTC;

  if (!matchId || !kickoffUtc) {
    console.error("Missing env vars.\n");
    console.error("  MATCH_ID=BRAZ-FRA-01 KICKOFF_UTC=2026-06-14T18:00:00Z \\");
    console.error("  npx hardhat run scripts/createMarket.ts --network xlayer_testnet");
    process.exit(1);
  }

  const kickoffMs = new Date(kickoffUtc).getTime();
  if (isNaN(kickoffMs)) {
    console.error(`Invalid KICKOFF_UTC: "${kickoffUtc}". Use ISO-8601, e.g. 2026-06-14T18:00:00Z`);
    process.exit(1);
  }

  const matchTime = BigInt(Math.floor(kickoffMs / 1000));

  const { ethers } = await network.getOrCreate();
  const [admin] = await ethers.getSigners();

  console.log("Admin   :", admin.address);
  console.log("Balance :", ethers.formatEther(await ethers.provider.getBalance(admin.address)), "OKB");
  console.log("Factory :", FACTORY_ADDRESS);
  console.log("Match   :", matchId);
  console.log("Kickoff :", new Date(Number(matchTime) * 1000).toUTCString(), `(${matchTime})`);
  console.log();

  const factory = await ethers.getContractAt("MarketFactory", FACTORY_ADDRESS, admin);

  const tx = await factory.createMarket(matchId, matchTime);
  console.log("Tx      :", tx.hash);
  const receipt = await tx.wait();

  const iface = factory.interface;
  const parsed = receipt?.logs
    .map((l: Log) => { try { return iface.parseLog(l); } catch { return null; } })
    .find((e: ReturnType<typeof iface.parseLog>) => e?.name === "MarketCreated");

  const marketAddr = parsed?.args?.market as string ?? "(parse failed)";
  console.log("Market  :", marketAddr);
  console.log("\n✓ Market created successfully.");

  // Update listener/markets.json with the fixture mapping if FIXTURE_ID was provided
  const fixtureId = process.env.FIXTURE_ID ? parseInt(process.env.FIXTURE_ID, 10) : null;
  if (fixtureId && marketAddr !== "(parse failed)") {
    const marketsFile = path.join(__dirname, "..", "listener", "markets.json");
    let existing: Record<string, { fixtureId: number; matchId: string }> = {};
    if (fs.existsSync(marketsFile)) {
      existing = JSON.parse(fs.readFileSync(marketsFile, "utf-8"));
    }
    existing[marketAddr.toLowerCase()] = { fixtureId, matchId };
    fs.writeFileSync(marketsFile, JSON.stringify(existing, null, 2));
    console.log(`  listener/markets.json updated with fixture #${fixtureId}`);
  } else if (!fixtureId) {
    console.log("  Tip: set FIXTURE_ID=<api-football-id> to auto-update listener/markets.json");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
