/**
 * CurveKick Listener
 * ------------------
 * Polls API-Football every POLL_INTERVAL_MS for completed matches
 * and auto-resolves the corresponding on-chain markets.
 *
 * Market → fixture mapping lives in markets.json next to this file:
 *   { "0xMARKET_ADDR": { fixtureId: 123, matchId: "ARG-FRA-01" } }
 *
 * Env: see .env.example
 */

import * as fs from "fs";
import * as path from "path";
import { getFixture, isMatchFinished, deriveOutcome } from "./apifootball";
import { createContracts, fetchMarkets, pendingMarkets, resolveMarket } from "./resolver";

// Dotenv — only needed in local dev; Fly.io injects secrets directly
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config();
} catch {}

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS ?? "60000", 10);
const MARKETS_FILE = path.join(__dirname, "..", "markets.json");

interface MarketConfig {
  fixtureId: number;
  matchId: string;
}

type MarketsConfig = Record<string, MarketConfig>;

function loadMarketsConfig(): MarketsConfig {
  if (!fs.existsSync(MARKETS_FILE)) {
    console.warn("[config] markets.json not found — no markets to watch");
    return {};
  }
  return JSON.parse(fs.readFileSync(MARKETS_FILE, "utf-8")) as MarketsConfig;
}

// Track which markets we've already resolved this run (avoid double-sends)
const resolved = new Set<string>();

async function tick(ctx: ReturnType<typeof createContracts>, config: MarketsConfig) {
  const now = new Date().toISOString();
  console.log(`\n[tick] ${now}`);

  let markets;
  try {
    markets = await fetchMarkets(ctx.factory, ctx.provider);
  } catch (err) {
    console.error("[tick] failed to fetch markets from chain:", err);
    return;
  }

  const pending = pendingMarkets(markets);
  console.log(`[tick] ${markets.length} total markets — ${pending.length} pending resolution`);

  for (const market of pending) {
    const addr = market.address.toLowerCase();

    if (resolved.has(addr)) {
      console.log(`[tick] ${market.matchId} already resolved this session — skipping`);
      continue;
    }

    // Find fixture config for this market address
    const cfg = Object.entries(config).find(
      ([key]) => key.toLowerCase() === addr,
    )?.[1];

    if (!cfg) {
      console.warn(`[tick] no fixture mapping for market ${addr} (${market.matchId}) — add to markets.json`);
      continue;
    }

    console.log(`[tick] checking ${market.matchId} → fixture #${cfg.fixtureId}`);

    let fixture;
    try {
      fixture = await getFixture(cfg.fixtureId);
    } catch (err) {
      console.error(`[tick] API error for fixture #${cfg.fixtureId}:`, err);
      continue;
    }

    if (!fixture) {
      console.log(`[tick] fixture #${cfg.fixtureId} not found in API`);
      continue;
    }

    console.log(
      `[tick] ${fixture.homeTeam} ${fixture.homeGoals} - ${fixture.awayGoals} ${fixture.awayTeam} [${fixture.status}]`,
    );

    if (!isMatchFinished(fixture.status)) {
      console.log(`[tick] match not finished yet (${fixture.status})`);
      continue;
    }

    const outcome = deriveOutcome(fixture.homeGoals, fixture.awayGoals);
    if (outcome === null) {
      console.error(`[tick] could not derive outcome — goals are null`);
      continue;
    }

    try {
      await resolveMarket(ctx.resolver, market.address, outcome);
      resolved.add(addr);
      console.log(`[tick] ✓ ${market.matchId} resolved`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Already resolved") || msg.includes("already")) {
        console.log(`[tick] contract says already resolved — marking done`);
        resolved.add(addr);
      } else {
        console.error(`[tick] resolve failed for ${market.matchId}:`, msg);
      }
    }
  }
}

async function main() {
  console.log("=== CurveKick Listener ===");
  console.log(`Poll interval: ${POLL_INTERVAL_MS / 1000}s`);

  let ctx;
  try {
    ctx = createContracts();
    const network = await ctx.provider.getNetwork();
    console.log(`Connected: chainId ${network.chainId} — wallet ${ctx.wallet.address}`);
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }

  const config = loadMarketsConfig();
  const watchedCount = Object.keys(config).length;
  console.log(`Markets config: ${watchedCount} market(s) mapped to API fixtures`);

  // Run immediately, then on interval
  await tick(ctx, config);
  setInterval(() => tick(ctx, config), POLL_INTERVAL_MS);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
