import { useState, useEffect, useRef } from "react";
import { usePublicClient, useWatchContractEvent } from "wagmi";
import { parseAbiItem, type PublicClient } from "viem";
import { CURVE_ABI } from "@/lib/contracts";

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

export interface TradeEvent {
  id: string;           // txHash + logIndex, for React keys
  wallet: string;       // "0x1a2b...3c4d"
  outcome: 0 | 1 | 2;
  shares: number;
  costOkb: number;
  blockNumber: bigint;
  timestamp: number;    // unix seconds, 0 if unavailable
  isBuy: boolean;
}

const BOUGHT_EVENT = parseAbiItem("event SharesBought(address indexed buyer, uint256 shares, uint256 cost)");
const SOLD_EVENT   = parseAbiItem("event SharesSold(address indexed seller, uint256 shares, uint256 refund)");

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function useTradeFeed(
  curveAddresses: readonly [`0x${string}`, `0x${string}`, `0x${string}`] | undefined
) {
  const client = usePublicClient();
  const [trades, setTrades] = useState<TradeEvent[]>([]);
  const seenIds = useRef(new Set<string>());

  function addTrades(incoming: TradeEvent[]) {
    const fresh = incoming.filter(t => !seenIds.current.has(t.id));
    if (fresh.length === 0) return;
    fresh.forEach(t => seenIds.current.add(t.id));
    setTrades(prev =>
      [...fresh, ...prev]
        .sort((a, b) => Number(b.blockNumber - a.blockNumber))
        .slice(0, 20)
    );
  }

  // Fetch historical logs on mount / when curve addresses change
  useEffect(() => {
    if (!client || !curveAddresses) return;

    (async () => {
      try {
        const results = await Promise.all(
          curveAddresses.map(async (addr, outcome) => {
            const [buyLogs, sellLogs] = await Promise.all([
              fetchLogsChunked(client, { address: addr, event: BOUGHT_EVENT }),
              fetchLogsChunked(client, { address: addr, event: SOLD_EVENT }),
            ]);

            const all = [
              ...buyLogs.map(l => ({
                id: `${l.transactionHash}-${l.logIndex}`,
                wallet: truncate(l.args.buyer as string),
                outcome: outcome as 0 | 1 | 2,
                shares: Number(l.args.shares),
                costOkb: Number(l.args.cost) / 1e18,
                blockNumber: l.blockNumber ?? 0n,
                timestamp: 0,
                isBuy: true,
              })),
              ...sellLogs.map(l => ({
                id: `${l.transactionHash}-${l.logIndex}`,
                wallet: truncate(l.args.seller as string),
                outcome: outcome as 0 | 1 | 2,
                shares: Number(l.args.shares),
                costOkb: Number(l.args.refund) / 1e18,
                blockNumber: l.blockNumber ?? 0n,
                timestamp: 0,
                isBuy: false,
              })),
            ];

            return all;
          })
        );

        const allTrades = results.flat().sort((a, b) => Number(b.blockNumber - a.blockNumber));

        // Fetch timestamps for up to 10 unique block numbers
        const uniqueBlocks = [...new Set(allTrades.map(t => t.blockNumber))].slice(0, 10);
        const blockData = await Promise.all(
          uniqueBlocks.map(bn => client.getBlock({ blockNumber: bn }).catch(() => null))
        );
        const blockTs = new Map(blockData.filter(Boolean).map(b => [b!.number, Number(b!.timestamp)]));

        addTrades(
          allTrades.map(t => ({ ...t, timestamp: blockTs.get(t.blockNumber) ?? 0 }))
        );
      } catch {
        // RPC error — silently ignore, feed stays empty
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, curveAddresses?.join(",")]);

  // Watch for new buy events in real time (3 separate watchers for each curve)
  useWatchContractEvent({
    address: curveAddresses?.[0],
    abi: CURVE_ABI,
    eventName: "SharesBought",
    enabled: !!curveAddresses?.[0],
    onLogs: logs => logs.forEach(l => {
      const e = l as typeof l & { args: { buyer: string; shares: bigint; cost: bigint }; blockNumber: bigint; transactionHash: string; logIndex: number };
      addTrades([{ id: `${e.transactionHash}-${e.logIndex}`, wallet: truncate(e.args.buyer), outcome: 0, shares: Number(e.args.shares), costOkb: Number(e.args.cost) / 1e18, blockNumber: e.blockNumber ?? 0n, timestamp: Date.now() / 1000, isBuy: true }]);
    }),
  });
  useWatchContractEvent({
    address: curveAddresses?.[1],
    abi: CURVE_ABI,
    eventName: "SharesBought",
    enabled: !!curveAddresses?.[1],
    onLogs: logs => logs.forEach(l => {
      const e = l as typeof l & { args: { buyer: string; shares: bigint; cost: bigint }; blockNumber: bigint; transactionHash: string; logIndex: number };
      addTrades([{ id: `${e.transactionHash}-${e.logIndex}`, wallet: truncate(e.args.buyer), outcome: 1, shares: Number(e.args.shares), costOkb: Number(e.args.cost) / 1e18, blockNumber: e.blockNumber ?? 0n, timestamp: Date.now() / 1000, isBuy: true }]);
    }),
  });
  useWatchContractEvent({
    address: curveAddresses?.[2],
    abi: CURVE_ABI,
    eventName: "SharesBought",
    enabled: !!curveAddresses?.[2],
    onLogs: logs => logs.forEach(l => {
      const e = l as typeof l & { args: { buyer: string; shares: bigint; cost: bigint }; blockNumber: bigint; transactionHash: string; logIndex: number };
      addTrades([{ id: `${e.transactionHash}-${e.logIndex}`, wallet: truncate(e.args.buyer), outcome: 2, shares: Number(e.args.shares), costOkb: Number(e.args.cost) / 1e18, blockNumber: e.blockNumber ?? 0n, timestamp: Date.now() / 1000, isBuy: true }]);
    }),
  });

  return { trades };
}

export function relativeTime(timestamp: number): string {
  if (!timestamp) return "recently";
  const diff = Math.floor(Date.now() / 1000 - timestamp);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
