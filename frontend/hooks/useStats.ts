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
  const all: any[] = [];
  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chunks.slice(i, i + concurrency).map(({ from, to }) => client.getLogs({ ...params, fromBlock: from, toBlock: to } as any).catch(() => [] as any[]))
    );
    all.push(...batch.flat());
  }
  return all;
}

export interface Stats {
  marketsCount: number;
  totalVolumeOkb: number;
  uniqueTraders: number;
  totalTrades: number;
}

export function useStats() {
  const { markets } = useMarkets();
  const client = usePublicClient();
  const [stats, setStats] = useState<Stats | null>(null);

  const marketKey = markets.map(m => m.address).join(",");

  useEffect(() => {
    if (!client || markets.length === 0) return;

    (async () => {
      try {
        const traders = new Set<string>();
        let totalTrades = 0;
        let totalVolume = 0;

        for (const market of markets) {
          const curveAddrs = await Promise.all(
            [0n, 1n, 2n].map(i =>
              client.readContract({ address: market.address, abi: MARKET_ABI, functionName: "curves", args: [i] }) as Promise<`0x${string}`>
            )
          );

          const curveLogs = await Promise.all(
            curveAddrs.map(addr => fetchLogsChunked(client, { address: addr, event: BOUGHT_EVENT }))
          );

          for (const logs of curveLogs) {
            for (const log of logs) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const buyer: string = (log.args as any).buyer?.toLowerCase();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const cost = Number(BigInt((log.args as any).cost ?? 0n)) / 1e18;
              if (buyer) traders.add(buyer);
              totalVolume += cost;
              totalTrades++;
            }
          }
        }

        setStats({
          marketsCount: markets.length,
          totalVolumeOkb: totalVolume,
          uniqueTraders: traders.size,
          totalTrades,
        });
      } catch {
        // RPC failure — set minimal stats from what we know
        setStats({ marketsCount: markets.length, totalVolumeOkb: 0, uniqueTraders: 0, totalTrades: 0 });
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, marketKey]);

  return { stats, marketsCount: markets.length };
}
