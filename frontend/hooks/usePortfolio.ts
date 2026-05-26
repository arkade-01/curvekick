import { useState, useEffect } from "react";
import { useReadContracts, usePublicClient, useAccount } from "wagmi";
import { parseAbiItem, type PublicClient } from "viem";
import { MARKET_ABI, CURVE_ABI, BASE_PRICE, SLOPE } from "@/lib/contracts";

// X Layer testnet caps eth_getLogs at 100 blocks per request.
// Fetch in 100-block chunks, 20 concurrent at a time.
async function fetchLogsChunked(
  client: PublicClient,
  params: Parameters<PublicClient["getLogs"]>[0],
  maxBlocks = 20_000n,
  chunkSize = 100n,
  concurrency = 20,
) {
  const latest = await client.getBlockNumber();
  const fromBlock = latest > maxBlocks ? latest - maxBlocks : 0n;

  const chunks: Array<{ from: bigint; to: bigint }> = [];
  for (let from = fromBlock; from <= latest; from += chunkSize) {
    chunks.push({ from, to: from + chunkSize - 1n < latest ? from + chunkSize - 1n : latest });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allLogs: any[] = [];
  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = await Promise.all(
      chunks.slice(i, i + concurrency).map(({ from, to }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client.getLogs({ ...params, fromBlock: from, toBlock: to } as any)
      )
    );
    allLogs.push(...batch.flat());
  }
  return allLogs;
}
import { useMarkets } from "./useMarkets";
import type { MarketInfo } from "./useMarkets";

export interface Position {
  market: MarketInfo;
  outcome: 0 | 1 | 2;
  shares: number;
  curveAddress: `0x${string}`;
  currentPrice: number;
  currentValue: number;
  netInvested: number | null;
  pnl: number | null;
  pnlPct: number | null;
  claimable: boolean;
}

const ZERO_ADDR = "0x0000000000000000000000000000000000000000" as `0x${string}`;

const BOUGHT_EVENT = parseAbiItem("event SharesBought(address indexed buyer, uint256 shares, uint256 cost)");
const SOLD_EVENT   = parseAbiItem("event SharesSold(address indexed seller, uint256 shares, uint256 refund)");

export function usePortfolio() {
  const { address: userAddress } = useAccount();
  const { markets } = useMarkets();
  const client = usePublicClient();

  // Phase 1: curve addresses
  const { data: curveAddrData } = useReadContracts({
    contracts: markets.flatMap(m => ([0n, 1n, 2n] as const).map(o => ({
      address: m.address,
      abi: MARKET_ABI,
      functionName: "curves" as const,
      args: [o],
    }))),
    query: { enabled: markets.length > 0 },
  });

  const curveAddrs = curveAddrData?.map(r => (r?.result ?? ZERO_ADDR) as `0x${string}`);

  // Phase 2: balances
  const { data: balanceData, isLoading } = useReadContracts({
    contracts: (curveAddrs ?? []).map(addr => ({
      address: addr,
      abi: CURVE_ABI,
      functionName: "balanceOf" as const,
      args: [userAddress ?? ZERO_ADDR],
    })),
    query: {
      enabled: !!userAddress && !!curveAddrs && curveAddrs.length > 0 && curveAddrs.every(a => a !== ZERO_ADDR),
    },
  });

  // Phase 3: cost basis from event logs
  const [costMap, setCostMap] = useState<Map<string, number>>(new Map());
  const [costLoading, setCostLoading] = useState(false);

  // Stable key — only changes when the set of curves with a balance changes
  const targetKey = curveAddrs && balanceData
    ? curveAddrs
        .filter((addr, i) => {
          const bal = balanceData[i]?.result as bigint | undefined;
          return bal && bal > 0n && addr !== ZERO_ADDR;
        })
        .join(",")
    : "";

  useEffect(() => {
    if (!client || !userAddress || !targetKey) return;

    const targets = targetKey.split(",") as `0x${string}`[];
    setCostLoading(true);

    (async () => {
      const entries = await Promise.all(
        targets.map(async addr => {
          // X Layer testnet caps getLogs at 100 blocks — chunked fetch.
          // Filter client-side to avoid relying on RPC topic filtering.
          const [allBuys, allSells] = await Promise.all([
            fetchLogsChunked(client, { address: addr, event: BOUGHT_EVENT }),
            fetchLogsChunked(client, { address: addr, event: SOLD_EVENT }),
          ]);

          const user = userAddress.toLowerCase();

          const spent = allBuys
            .filter(l => (l.args as { buyer: string }).buyer?.toLowerCase() === user)
            .reduce((s, l) => s + Number((l.args as { cost: bigint }).cost) / 1e18, 0);

          const received = allSells
            .filter(l => (l.args as { seller: string }).seller?.toLowerCase() === user)
            .reduce((s, l) => s + Number((l.args as { refund: bigint }).refund) / 1e18, 0);

          return [addr, spent - received] as const;
        })
      );

      setCostMap(new Map(entries));
    })()
      .catch(err => console.error("[usePortfolio] cost fetch failed:", err))
      .finally(() => setCostLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, userAddress, targetKey]);

  const positions: Position[] = [];

  if (curveAddrs && balanceData) {
    markets.forEach((market, mi) => {
      ([0, 1, 2] as const).forEach(o => {
        const idx = mi * 3 + o;
        const balance = balanceData[idx]?.result as bigint | undefined;
        if (!balance || balance === 0n) return;

        const priceKeys  = ["homePrice",  "drawPrice",  "awayPrice" ] as const;
        const supplyKeys = ["homeSupply", "drawSupply", "awaySupply"] as const;
        const currentPrice = parseFloat(market[priceKeys[o]]);
        const supply       = market[supplyKeys[o]];
        const shares       = Number(balance);
        const curveAddress = curveAddrs[idx];

        let currentValue: number;
        if (market.isResolved && market.resolvedOutcome === o) {
          // Winning outcome: expected claim payout = share of total pool
          currentValue = supply > 0
            ? (shares / supply) * parseFloat(market.totalPool)
            : 0;
        } else if (market.isResolved) {
          // Losing outcome: sell is blocked, shares have no value
          currentValue = 0;
        } else {
          // Live market: what you'd receive selling now (integral going back down the curve)
          currentValue = BASE_PRICE * shares + SLOPE * shares * (2 * supply - shares) / 2;
        }

        const netInvested = costMap.has(curveAddress) ? costMap.get(curveAddress)! : null;
        const pnl         = netInvested !== null ? currentValue - netInvested : null;
        const pnlPct      = netInvested !== null && netInvested > 0 ? (pnl! / netInvested) * 100 : null;

        positions.push({
          market,
          outcome: o,
          shares: Number(balance),
          curveAddress,
          currentPrice,
          currentValue,
          netInvested,
          pnl,
          pnlPct,
          claimable: market.isResolved && market.resolvedOutcome === o,
        });
      });
    });
  }

  return { positions, isLoading: isLoading || costLoading };
}
