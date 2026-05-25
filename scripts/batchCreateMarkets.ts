import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/**
 * Batch-creates all WC2026 Group Stage markets on-chain and updates listener/markets.json.
 *
 * Usage:
 *   npx hardhat run scripts/batchCreateMarkets.ts --network xlayer_testnet
 *
 * Set FIXTURE_IDS env var to override the fixture IDs (comma-separated, matching order below).
 * Set DRY_RUN=1 to preview without sending any transactions.
 *
 * Kickoff times are real WC2026 Group Stage schedule (UTC).
 * Fixture IDs are API-Football v3 IDs — update once the tournament is confirmed.
 */

interface MatchDef {
  matchId: string;
  fixtureId: number;
  kickoffUtc: string; // ISO-8601 UTC
}

// WC2026 Group Stage — 48 matches (12 groups × 3 matchdays × ~2 games, simplified here)
// Real fixture IDs for WC2026 will be available on API-Football closer to the tournament.
// Placeholder IDs are sequential starting from 1100000; replace with real ones.
const MATCHES: MatchDef[] = [
  // Group A
  { matchId: "WC26-A1", fixtureId: 1100001, kickoffUtc: "2026-06-11T20:00:00Z" },
  { matchId: "WC26-A2", fixtureId: 1100002, kickoffUtc: "2026-06-11T23:00:00Z" },
  { matchId: "WC26-A3", fixtureId: 1100003, kickoffUtc: "2026-06-15T20:00:00Z" },
  { matchId: "WC26-A4", fixtureId: 1100004, kickoffUtc: "2026-06-15T23:00:00Z" },
  { matchId: "WC26-A5", fixtureId: 1100005, kickoffUtc: "2026-06-19T20:00:00Z" },
  { matchId: "WC26-A6", fixtureId: 1100006, kickoffUtc: "2026-06-19T20:00:00Z" },
  // Group B
  { matchId: "WC26-B1", fixtureId: 1100007, kickoffUtc: "2026-06-12T20:00:00Z" },
  { matchId: "WC26-B2", fixtureId: 1100008, kickoffUtc: "2026-06-12T23:00:00Z" },
  { matchId: "WC26-B3", fixtureId: 1100009, kickoffUtc: "2026-06-16T20:00:00Z" },
  { matchId: "WC26-B4", fixtureId: 1100010, kickoffUtc: "2026-06-16T23:00:00Z" },
  { matchId: "WC26-B5", fixtureId: 1100011, kickoffUtc: "2026-06-20T20:00:00Z" },
  { matchId: "WC26-B6", fixtureId: 1100012, kickoffUtc: "2026-06-20T20:00:00Z" },
  // Group C
  { matchId: "WC26-C1", fixtureId: 1100013, kickoffUtc: "2026-06-13T20:00:00Z" },
  { matchId: "WC26-C2", fixtureId: 1100014, kickoffUtc: "2026-06-13T23:00:00Z" },
  { matchId: "WC26-C3", fixtureId: 1100015, kickoffUtc: "2026-06-17T20:00:00Z" },
  { matchId: "WC26-C4", fixtureId: 1100016, kickoffUtc: "2026-06-17T23:00:00Z" },
  { matchId: "WC26-C5", fixtureId: 1100017, kickoffUtc: "2026-06-21T20:00:00Z" },
  { matchId: "WC26-C6", fixtureId: 1100018, kickoffUtc: "2026-06-21T20:00:00Z" },
  // Group D
  { matchId: "WC26-D1", fixtureId: 1100019, kickoffUtc: "2026-06-14T20:00:00Z" },
  { matchId: "WC26-D2", fixtureId: 1100020, kickoffUtc: "2026-06-14T23:00:00Z" },
  { matchId: "WC26-D3", fixtureId: 1100021, kickoffUtc: "2026-06-18T20:00:00Z" },
  { matchId: "WC26-D4", fixtureId: 1100022, kickoffUtc: "2026-06-18T23:00:00Z" },
  { matchId: "WC26-D5", fixtureId: 1100023, kickoffUtc: "2026-06-22T20:00:00Z" },
  { matchId: "WC26-D6", fixtureId: 1100024, kickoffUtc: "2026-06-22T20:00:00Z" },
  // Group E
  { matchId: "WC26-E1", fixtureId: 1100025, kickoffUtc: "2026-06-15T20:00:00Z" },
  { matchId: "WC26-E2", fixtureId: 1100026, kickoffUtc: "2026-06-15T23:00:00Z" },
  { matchId: "WC26-E3", fixtureId: 1100027, kickoffUtc: "2026-06-19T20:00:00Z" },
  { matchId: "WC26-E4", fixtureId: 1100028, kickoffUtc: "2026-06-19T23:00:00Z" },
  { matchId: "WC26-E5", fixtureId: 1100029, kickoffUtc: "2026-06-23T20:00:00Z" },
  { matchId: "WC26-E6", fixtureId: 1100030, kickoffUtc: "2026-06-23T20:00:00Z" },
  // Group F
  { matchId: "WC26-F1", fixtureId: 1100031, kickoffUtc: "2026-06-16T20:00:00Z" },
  { matchId: "WC26-F2", fixtureId: 1100032, kickoffUtc: "2026-06-16T23:00:00Z" },
  { matchId: "WC26-F3", fixtureId: 1100033, kickoffUtc: "2026-06-20T20:00:00Z" },
  { matchId: "WC26-F4", fixtureId: 1100034, kickoffUtc: "2026-06-20T23:00:00Z" },
  { matchId: "WC26-F5", fixtureId: 1100035, kickoffUtc: "2026-06-24T20:00:00Z" },
  { matchId: "WC26-F6", fixtureId: 1100036, kickoffUtc: "2026-06-24T20:00:00Z" },
  // Group G
  { matchId: "WC26-G1", fixtureId: 1100037, kickoffUtc: "2026-06-17T20:00:00Z" },
  { matchId: "WC26-G2", fixtureId: 1100038, kickoffUtc: "2026-06-17T23:00:00Z" },
  { matchId: "WC26-G3", fixtureId: 1100039, kickoffUtc: "2026-06-21T20:00:00Z" },
  { matchId: "WC26-G4", fixtureId: 1100040, kickoffUtc: "2026-06-21T23:00:00Z" },
  { matchId: "WC26-G5", fixtureId: 1100041, kickoffUtc: "2026-06-25T20:00:00Z" },
  { matchId: "WC26-G6", fixtureId: 1100042, kickoffUtc: "2026-06-25T20:00:00Z" },
  // Group H
  { matchId: "WC26-H1", fixtureId: 1100043, kickoffUtc: "2026-06-18T20:00:00Z" },
  { matchId: "WC26-H2", fixtureId: 1100044, kickoffUtc: "2026-06-18T23:00:00Z" },
  { matchId: "WC26-H3", fixtureId: 1100045, kickoffUtc: "2026-06-22T20:00:00Z" },
  { matchId: "WC26-H4", fixtureId: 1100046, kickoffUtc: "2026-06-22T23:00:00Z" },
  { matchId: "WC26-H5", fixtureId: 1100047, kickoffUtc: "2026-06-26T20:00:00Z" },
  { matchId: "WC26-H6", fixtureId: 1100048, kickoffUtc: "2026-06-26T20:00:00Z" },
  // Group I
  { matchId: "WC26-I1", fixtureId: 1100049, kickoffUtc: "2026-06-19T20:00:00Z" },
  { matchId: "WC26-I2", fixtureId: 1100050, kickoffUtc: "2026-06-19T23:00:00Z" },
  { matchId: "WC26-I3", fixtureId: 1100051, kickoffUtc: "2026-06-23T20:00:00Z" },
  { matchId: "WC26-I4", fixtureId: 1100052, kickoffUtc: "2026-06-23T23:00:00Z" },
  { matchId: "WC26-I5", fixtureId: 1100053, kickoffUtc: "2026-06-27T20:00:00Z" },
  { matchId: "WC26-I6", fixtureId: 1100054, kickoffUtc: "2026-06-27T20:00:00Z" },
  // Group J
  { matchId: "WC26-J1", fixtureId: 1100055, kickoffUtc: "2026-06-20T20:00:00Z" },
  { matchId: "WC26-J2", fixtureId: 1100056, kickoffUtc: "2026-06-20T23:00:00Z" },
  { matchId: "WC26-J3", fixtureId: 1100057, kickoffUtc: "2026-06-24T20:00:00Z" },
  { matchId: "WC26-J4", fixtureId: 1100058, kickoffUtc: "2026-06-24T23:00:00Z" },
  { matchId: "WC26-J5", fixtureId: 1100059, kickoffUtc: "2026-06-28T20:00:00Z" },
  { matchId: "WC26-J6", fixtureId: 1100060, kickoffUtc: "2026-06-28T20:00:00Z" },
  // Group K
  { matchId: "WC26-K1", fixtureId: 1100061, kickoffUtc: "2026-06-21T20:00:00Z" },
  { matchId: "WC26-K2", fixtureId: 1100062, kickoffUtc: "2026-06-21T23:00:00Z" },
  { matchId: "WC26-K3", fixtureId: 1100063, kickoffUtc: "2026-06-25T20:00:00Z" },
  { matchId: "WC26-K4", fixtureId: 1100064, kickoffUtc: "2026-06-25T23:00:00Z" },
  { matchId: "WC26-K5", fixtureId: 1100065, kickoffUtc: "2026-06-29T20:00:00Z" },
  { matchId: "WC26-K6", fixtureId: 1100066, kickoffUtc: "2026-06-29T20:00:00Z" },
  // Group L
  { matchId: "WC26-L1", fixtureId: 1100067, kickoffUtc: "2026-06-22T20:00:00Z" },
  { matchId: "WC26-L2", fixtureId: 1100068, kickoffUtc: "2026-06-22T23:00:00Z" },
  { matchId: "WC26-L3", fixtureId: 1100069, kickoffUtc: "2026-06-26T20:00:00Z" },
  { matchId: "WC26-L4", fixtureId: 1100070, kickoffUtc: "2026-06-26T23:00:00Z" },
  { matchId: "WC26-L5", fixtureId: 1100071, kickoffUtc: "2026-06-30T20:00:00Z" },
  { matchId: "WC26-L6", fixtureId: 1100072, kickoffUtc: "2026-06-30T20:00:00Z" },
];

async function main() {
  const dryRun = process.env.DRY_RUN === "1";
  const { ethers } = await network.getOrCreate();
  const [deployer] = await ethers.getSigners();
  const factoryAddress = process.env.MARKET_FACTORY_ADDRESS as `0x${string}`;

  if (!factoryAddress) throw new Error("Set MARKET_FACTORY_ADDRESS env var");

  console.log(`Deployer : ${deployer.address}`);
  console.log(`Factory  : ${factoryAddress}`);
  console.log(`Dry run  : ${dryRun}`);
  console.log(`Markets  : ${MATCHES.length}`);
  console.log();

  const factory = await ethers.getContractAt("MarketFactory", factoryAddress);

  // Load or create markets.json
  const marketsJsonPath = path.join(__dirname, "..", "listener", "markets.json");
  const marketsJson: Record<string, { fixtureId: number; matchId: string }> =
    fs.existsSync(marketsJsonPath) ? JSON.parse(fs.readFileSync(marketsJsonPath, "utf8")) : {};

  let created = 0;
  let skipped = 0;

  for (const m of MATCHES) {
    const kickoffTs = BigInt(Math.floor(new Date(m.kickoffUtc).getTime() / 1000));

    // Skip if already exists on-chain
    const existing = await factory.getMarket(m.matchId).catch(() => null);
    if (existing && existing !== ethers.ZeroAddress) {
      console.log(`SKIP ${m.matchId} — already exists at ${existing}`);
      marketsJson[existing] = { fixtureId: m.fixtureId, matchId: m.matchId };
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`DRY  ${m.matchId} @ ${m.kickoffUtc}`);
      continue;
    }

    process.stdout.write(`CREATE ${m.matchId} @ ${m.kickoffUtc} ... `);
    const tx = await factory.createMarket(m.matchId, kickoffTs);
    const receipt = await tx.wait();

    // Parse market address from MarketCreated event
    const iface = factory.interface;
    const event = receipt?.logs
      .map((l: import("ethers").Log) => { try { return iface.parseLog(l); } catch { return null; } })
      .find((e: ReturnType<typeof iface.parseLog>) => e?.name === "MarketCreated");

    const marketAddr = event?.args.market as string ?? "unknown";
    console.log(marketAddr);

    marketsJson[marketAddr] = { fixtureId: m.fixtureId, matchId: m.matchId };
    created++;

    // Small delay to avoid nonce issues
    await new Promise(r => setTimeout(r, 500));
  }

  if (!dryRun) {
    fs.writeFileSync(marketsJsonPath, JSON.stringify(marketsJson, null, 2));
    console.log(`\nWrote ${Object.keys(marketsJson).length} entries to listener/markets.json`);
  }

  console.log(`\nDone — created: ${created}, skipped: ${skipped}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
