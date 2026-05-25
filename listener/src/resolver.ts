/**
 * On-chain resolver: reads market state from MarketFactory and calls
 * Resolver.resolve(market, outcome) via the admin wallet.
 */

import { ethers } from "ethers";

const FACTORY_ABI = [
  { inputs: [], name: "getAllMarkets", outputs: [{ type: "address[]" }], stateMutability: "view", type: "function" },
];

const MARKET_ABI = [
  { inputs: [], name: "matchId",         outputs: [{ type: "string" }],  stateMutability: "view", type: "function" },
  { inputs: [], name: "matchTime",       outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "resolved",        outputs: [{ type: "bool" }],    stateMutability: "view", type: "function" },
  { inputs: [], name: "resolvedOutcome", outputs: [{ type: "uint8" }],   stateMutability: "view", type: "function" },
];

const RESOLVER_ABI = [
  {
    inputs: [
      { name: "market", type: "address" },
      { name: "outcome", type: "uint8" },
    ],
    name: "resolve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const OUTCOME_LABELS = ["HOME", "DRAW", "AWAY"] as const;
const TIMELOCK_SECONDS = 90 * 60; // 90 minutes

export interface MarketRecord {
  address: string;
  matchId: string;
  matchTime: number;   // unix seconds
  resolved: boolean;
}

export function createContracts() {
  const rpcUrl    = process.env.RPC_URL;
  const privKey   = process.env.ADMIN_PRIVATE_KEY;
  const factoryAddr  = process.env.MARKET_FACTORY_ADDRESS;
  const resolverAddr = process.env.RESOLVER_ADDRESS;

  if (!rpcUrl || !privKey || !factoryAddr || !resolverAddr) {
    throw new Error("Missing env: RPC_URL, ADMIN_PRIVATE_KEY, MARKET_FACTORY_ADDRESS, RESOLVER_ADDRESS");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet   = new ethers.Wallet(privKey, provider);

  const factory  = new ethers.Contract(factoryAddr,  FACTORY_ABI,  wallet);
  const resolver = new ethers.Contract(resolverAddr, RESOLVER_ABI, wallet);

  return { provider, wallet, factory, resolver };
}

/** Fetch all markets from the factory and return their state. */
export async function fetchMarkets(
  factory: ethers.Contract,
  provider: ethers.Provider,
): Promise<MarketRecord[]> {
  const addresses: string[] = await factory.getAllMarkets();

  const records = await Promise.all(
    addresses.map(async (addr): Promise<MarketRecord> => {
      const market   = new ethers.Contract(addr, MARKET_ABI, provider);
      const [matchId, matchTime, resolved] = await Promise.all([
        market.matchId() as Promise<string>,
        market.matchTime() as Promise<bigint>,
        market.resolved() as Promise<boolean>,
      ]);
      return {
        address: addr,
        matchId,
        matchTime: Number(matchTime),
        resolved,
      };
    }),
  );

  return records;
}

/**
 * Returns markets that are:
 * - not yet resolved
 * - past the 90-minute timelock
 */
export function pendingMarkets(markets: MarketRecord[]): MarketRecord[] {
  const now = Math.floor(Date.now() / 1000);
  return markets.filter(m => !m.resolved && now >= m.matchTime + TIMELOCK_SECONDS);
}

/** Call Resolver.resolve(market, outcome) and wait for confirmation. */
export async function resolveMarket(
  resolver: ethers.Contract,
  marketAddress: string,
  outcome: 0 | 1 | 2,
): Promise<string> {
  console.log(`[resolver] resolve(${marketAddress}, ${outcome} = ${OUTCOME_LABELS[outcome]})`);
  const tx: ethers.TransactionResponse = await resolver.resolve(marketAddress, outcome);
  console.log(`[resolver] tx sent: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`[resolver] confirmed in block ${receipt?.blockNumber} — gas used: ${receipt?.gasUsed}`);
  return tx.hash;
}
