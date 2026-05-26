import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/**
 * Deploy 20 WC2026 showcase markets for testnet demo.
 * Uses HOME-AWAY-NN matchId format so the frontend can display team names.
 *
 * Usage:
 *   npx hardhat run scripts/deploy20Markets.ts --network xlayer_testnet
 *
 * Set DRY_RUN=1 to preview without sending transactions.
 * Set FACTORY_ADDRESS env var to override the default.
 */

const FACTORY_ADDRESS =
  process.env.FACTORY_ADDRESS ?? "0xB84709d277a3134Fad667D68F5AB18295c1Fae25";

interface MatchDef {
  matchId: string;
  kickoffUtc: string;
}

// 20 marquee matchups for testnet demo — all WC2026 group stage / R16 window
const MATCHES: MatchDef[] = [
  // Group stage openers (June 11–14)
  { matchId: "BRAZ-ARG-01", kickoffUtc: "2026-06-11T20:00:00Z" },
  { matchId: "ENG-FRA-02",  kickoffUtc: "2026-06-11T23:00:00Z" },
  { matchId: "GER-ESP-03",  kickoffUtc: "2026-06-12T17:00:00Z" },
  { matchId: "POR-ITA-04",  kickoffUtc: "2026-06-12T20:00:00Z" },
  { matchId: "NED-BEL-05",  kickoffUtc: "2026-06-12T23:00:00Z" },
  { matchId: "MEX-USA-06",  kickoffUtc: "2026-06-13T17:00:00Z" },
  { matchId: "JPN-KOR-07",  kickoffUtc: "2026-06-13T20:00:00Z" },
  { matchId: "MAR-SEN-08",  kickoffUtc: "2026-06-13T23:00:00Z" },
  { matchId: "URU-CHI-09",  kickoffUtc: "2026-06-14T17:00:00Z" },
  { matchId: "CRO-NED-10",  kickoffUtc: "2026-06-14T20:00:00Z" },
  // Second round (June 15–19)
  { matchId: "ARG-FRA-11",  kickoffUtc: "2026-06-15T20:00:00Z" },
  { matchId: "BRAZ-ENG-12", kickoffUtc: "2026-06-16T20:00:00Z" },
  { matchId: "ESP-POR-13",  kickoffUtc: "2026-06-17T20:00:00Z" },
  { matchId: "GER-ITA-14",  kickoffUtc: "2026-06-17T23:00:00Z" },
  { matchId: "NGA-GHA-15",  kickoffUtc: "2026-06-18T17:00:00Z" },
  // Third round (June 20–25)
  { matchId: "ARG-ENG-16",  kickoffUtc: "2026-06-20T20:00:00Z" },
  { matchId: "BRAZ-FRA-17", kickoffUtc: "2026-06-21T20:00:00Z" },
  { matchId: "GER-POR-18",  kickoffUtc: "2026-06-22T20:00:00Z" },
  { matchId: "BEL-ESP-19",  kickoffUtc: "2026-06-23T20:00:00Z" },
  { matchId: "ITA-NED-20",  kickoffUtc: "2026-06-25T20:00:00Z" },
];

async function main() {
  const dryRun = process.env.DRY_RUN === "1";
  const { ethers } = await network.getOrCreate();
  const [admin] = await ethers.getSigners();

  console.log(`Admin    : ${admin.address}`);
  console.log(`Balance  : ${ethers.formatEther(await ethers.provider.getBalance(admin.address))} OKB`);
  console.log(`Factory  : ${FACTORY_ADDRESS}`);
  console.log(`Dry run  : ${dryRun}`);
  console.log(`Markets  : ${MATCHES.length}`);
  console.log();

  const factory = await ethers.getContractAt("MarketFactory", FACTORY_ADDRESS, admin);

  const marketsJsonPath = path.join(__dirname, "..", "listener", "markets.json");
  const marketsJson: Record<string, { fixtureId: number | null; matchId: string }> =
    fs.existsSync(marketsJsonPath) ? JSON.parse(fs.readFileSync(marketsJsonPath, "utf8")) : {};

  let created = 0;
  let skipped = 0;

  for (const m of MATCHES) {
    const kickoffTs = BigInt(Math.floor(new Date(m.kickoffUtc).getTime() / 1000));

    const existing = await factory.getMarket(m.matchId).catch(() => null);
    if (existing && existing !== ethers.ZeroAddress) {
      console.log(`SKIP  ${m.matchId} — already at ${existing}`);
      marketsJson[existing.toLowerCase()] = { fixtureId: null, matchId: m.matchId };
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`DRY   ${m.matchId} @ ${m.kickoffUtc}`);
      continue;
    }

    process.stdout.write(`CREATE ${m.matchId} @ ${m.kickoffUtc} ... `);
    const tx = await factory.createMarket(m.matchId, kickoffTs);
    const receipt = await tx.wait();

    const iface = factory.interface;
    const event = receipt?.logs
      .map((l: import("ethers").Log) => { try { return iface.parseLog(l); } catch { return null; } })
      .find((e: ReturnType<typeof iface.parseLog>) => e?.name === "MarketCreated");

    const marketAddr = (event?.args.market as string) ?? "unknown";
    console.log(marketAddr);

    marketsJson[marketAddr.toLowerCase()] = { fixtureId: null, matchId: m.matchId };
    created++;

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
