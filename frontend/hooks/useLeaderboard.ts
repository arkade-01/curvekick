import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem, type PublicClient } from "viem";
import { MARKET_ABI } from "@/lib/contracts";
import { useMarkets } from "./useMarkets";

const BOUGHT_EVENT = parseAbiItem("event SharesBought(address indexed buyer, uint256 shares, uint256 cost)");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchLogsChunked(client: PublicClient, params: any, maxBlocks = 20_000n, chunkSize = 100n, concurrency = 20) {
  const latest = await client.getBlockNumber();
  const fromBlock = latest > maxBlocks ? latest - maxBlocks : 0n;

  const chunks: { from: bigint; to: bigint }[] = [];
  for (let from = fromBlock; from <= latest; from += chunkSize) {
    chunks.push({ from, to: from + chunkSize - 1n < latest ? from + chunkSize - 1n : latest });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allLogs: any[] = [];
  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chunks.slice(i, i + concurrency).map(({ from, to }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client.getLogs({ ...params, fromBlock: from, toBlock: to } as any).catch(() => [] as any[])
      )
    );
    allLogs.push(...batch.flat());
  }
  return allLogs;
}

export interface LeaderboardEntry {
  wallet: string;
  walletShort: string;
  totalOkbDeployed: number;
  okbInWinners: number;
  marketsCount: number;
}

export function useLeaderboard() {
  const { markets } = useMarkets();
  const client = usePublicClient();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const marketKey = markets.map(m => m.address).join(",");

  useEffect(() => {
    if (!client || markets.length === 0) return;

    setIsLoading(true);

    (async () => {
      try {
        const aggregate = new Map<string, { totalOkb: number; winnerOkb: number; marketSet: Set<string> }>();

        for (const market of markets) {
          // Fetch the 3 curve addresses for this market
          const curveAddrs = await Promise.all(
            [0n, 1n, 2n].map(i =>
              client.readContract({
                address: market.address,
                abi: MARKET_ABI,
                functionName: "curves",
                args: [i],
              }) as Promise<`0x${string}`>
            )
          );

          const winnerOutcome: number | undefined =
            market.isResolved && market.result !== undefined ? market.result : undefined;

          // Fetch SharesBought logs for each curve in parallel
          const curveLogs = await Promise.all(
            curveAddrs.map(addr =>
              fetchLogsChunked(client, { address: addr, event: BOUGHT_EVENT })
            )
          );

          curveLogs.forEach((logs, outcomeIdx) => {
            for (const log of logs) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const buyer: string = ((log.args) as any).buyer?.toLowerCase();
              if (!buyer) continue;

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const okb = Number(BigInt((log.args as any).cost ?? 0n)) / 1e18;
              const rec = aggregate.get(buyer) ?? { totalOkb: 0, winnerOkb: 0, marketSet: new Set() };
              rec.totalOkb += okb;
              if (winnerOutcome !== undefined && outcomeIdx === winnerOutcome) {
                rec.winnerOkb += okb;
              }
              rec.marketSet.add(market.address);
              aggregate.set(buyer, rec);
            }
          });
        }

        const ranked: LeaderboardEntry[] = Array.from(aggregate.entries())
          .map(([wallet, data]) => ({
            wallet,
            walletShort: `${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
            totalOkbDeployed: data.totalOkb,
            okbInWinners: data.winnerOkb,
            marketsCount: data.marketSet.size,
          }))
          .sort((a, b) => b.totalOkbDeployed - a.totalOkbDeployed)
          .slice(0, 20);

        setEntries(ranked);
      } catch {
        // RPC failure — leave entries empty
      } finally {
        setIsLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, marketKey]);

  return { entries, isLoading };
}
