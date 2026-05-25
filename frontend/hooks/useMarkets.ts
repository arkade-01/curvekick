import { useReadContract, useReadContracts } from "wagmi";
import { FACTORY_ADDRESS, FACTORY_ABI, MARKET_ABI, parseMatchId, BASE_PRICE, SLOPE } from "@/lib/contracts";

// Integral of linear bonding curve: BASE*n + SLOPE*n*(n+1)/2
function curveRaised(supply: number): number {
  return BASE_PRICE * supply + (SLOPE * supply * (supply + 1)) / 2;
}

export interface MarketInfo {
  address: `0x${string}`;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  matchTime: number;
  status: "upcoming" | "live" | "resolved";
  result?: 0 | 1 | 2;
  homePrice: string;
  drawPrice: string;
  awayPrice: string;
  homeSupply: number;
  drawSupply: number;
  awaySupply: number;
  totalPool: string;
  isResolved: boolean;
  resolvedOutcome: number;
}

function deriveStatus(matchTime: number, isResolved: boolean): "upcoming" | "live" | "resolved" {
  if (isResolved) return "resolved";
  const now = Date.now() / 1000;
  if (matchTime <= now) return "live";
  return "upcoming";
}

export function useMarkets() {
  const { data: addresses, isLoading: loadingAddresses } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getAllMarkets",
    query: { refetchInterval: 30_000 },
  });

  const addrs = (addresses as `0x${string}`[] | undefined) ?? [];

  const { data: results, isLoading: loadingData } = useReadContracts({
    contracts: addrs.flatMap(addr => [
      { address: addr, abi: MARKET_ABI, functionName: "matchId"         } as const,
      { address: addr, abi: MARKET_ABI, functionName: "matchTime"       } as const,
      { address: addr, abi: MARKET_ABI, functionName: "getMarketState"  } as const,
    ]),
    query: { enabled: addrs.length > 0, refetchInterval: 15_000 },
  });

  const markets: MarketInfo[] = addrs.map((addr, i) => {
    const base  = i * 3;
    const mid   = results?.[base]?.result   as string | undefined;
    const mtime = results?.[base+1]?.result as bigint | undefined;
    const state = results?.[base+2]?.result as readonly [bigint,bigint,bigint,bigint,bigint,bigint,boolean,number] | undefined;

    if (!mid || !mtime || !state) return null;

    const { home, away } = parseMatchId(mid);
    const isResolved = state[6];
    const matchTime  = Number(mtime);

    return {
      address: addr,
      matchId:  mid,
      homeTeam: home,
      awayTeam: away,
      matchTime,
      status:   deriveStatus(matchTime, isResolved),
      result:   isResolved ? (state[7] as 0 | 1 | 2) : undefined,
      homePrice: (Number(state[0]) / 1e18).toFixed(5),
      drawPrice: (Number(state[2]) / 1e18).toFixed(5),
      awayPrice: (Number(state[4]) / 1e18).toFixed(5),
      homeSupply: Number(state[1]),
      drawSupply: Number(state[3]),
      awaySupply: Number(state[5]),
      totalPool: (curveRaised(Number(state[1])) + curveRaised(Number(state[3])) + curveRaised(Number(state[5]))).toFixed(2),
      isResolved,
      resolvedOutcome: state[7],
    } satisfies MarketInfo;
  }).filter(Boolean) as MarketInfo[];

  return { markets, isLoading: loadingAddresses || loadingData };
}
