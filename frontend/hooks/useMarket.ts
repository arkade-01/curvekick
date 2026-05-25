import { useReadContract, useReadContracts } from "wagmi";
import { MARKET_ABI, CURVE_ABI, BASE_PRICE, SLOPE, parseMatchId } from "@/lib/contracts";
import type { CurveData } from "@/lib/mockData";

export interface MarketDetail {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  matchTime: number;
  isResolved: boolean;
  resolvedOutcome: number;
  totalPool: string;
  curves: { home: CurveData; draw: CurveData; away: CurveData };
  curveAddresses: [`0x${string}`, `0x${string}`, `0x${string}`];
}

function fakePriceHistory(currentPrice: number): number[] {
  const points: number[] = [];
  let p = currentPrice * 0.6;
  for (let i = 0; i < 20; i++) {
    p += (currentPrice - p) * 0.15 + (Math.random() - 0.45) * currentPrice * 0.05;
    points.push(parseFloat(p.toFixed(6)));
  }
  points[19] = currentPrice;
  return points;
}

export function useMarket(address: `0x${string}` | undefined) {
  const enabled = !!address;

  const { data: state }     = useReadContract({ address, abi: MARKET_ABI, functionName: "getMarketState", query: { enabled, refetchInterval: 10_000 } });
  const { data: matchId }   = useReadContract({ address, abi: MARKET_ABI, functionName: "matchId",        query: { enabled } });
  const { data: matchTime } = useReadContract({ address, abi: MARKET_ABI, functionName: "matchTime",      query: { enabled } });
  const { data: totalPool } = useReadContract({ address, abi: MARKET_ABI, functionName: "totalPool",      query: { enabled } });
  const { data: curve0 }    = useReadContract({ address, abi: MARKET_ABI, functionName: "curves", args: [0n], query: { enabled } });
  const { data: curve1 }    = useReadContract({ address, abi: MARKET_ABI, functionName: "curves", args: [1n], query: { enabled } });
  const { data: curve2 }    = useReadContract({ address, abi: MARKET_ABI, functionName: "curves", args: [2n], query: { enabled } });

  const curveAddrs = [curve0, curve1, curve2] as (`0x${string}` | undefined)[];

  const { data: raised } = useReadContracts({
    contracts: curveAddrs.map(a => ({ address: a!, abi: CURVE_ABI, functionName: "totalRaised" as const })),
    query: { enabled: curveAddrs.every(Boolean), refetchInterval: 10_000 },
  });

  if (!state || !matchId || !matchTime) return { market: undefined };

  const s = state as readonly [bigint,bigint,bigint,bigint,bigint,bigint,boolean,number];
  const { home, away } = parseMatchId(matchId as string);

  const prices  = [s[0], s[2], s[4]].map(p => Number(p) / 1e18);
  const supplies = [Number(s[1]), Number(s[3]), Number(s[5])];
  const raisedOkb = raised?.map(r => r?.result ? (Number(r.result as bigint) / 1e18).toFixed(4) + " CKUSD" : "0 CKUSD") ?? ["0 CKUSD","0 CKUSD","0 CKUSD"];

  // Sum curve raised amounts for live pool (totalPool contract var is only set post-resolution)
  const totalFromCurves = raised
    ? raised.reduce((sum, r) => sum + (r?.result ? Number(r.result as bigint) : 0), 0) / 1e18
    : 0;
  const resolvedPool = totalPool ? Number(totalPool as bigint) / 1e18 : 0;
  const poolDisplay = (resolvedPool > 0 ? resolvedPool : totalFromCurves).toFixed(4);

  // Actual price change from market open: price(0) = BASE_PRICE, price(now) = BASE_PRICE + SLOPE*supply
  const changes = prices.map(p => BASE_PRICE > 0 ? ((p - BASE_PRICE) / BASE_PRICE) * 100 : 0);

  const curveKeys = ["home", "draw", "away"] as const;

  const curvesData = curveKeys.reduce((acc, key, i) => {
    acc[key] = {
      currentPrice: prices[i].toFixed(5),
      priceChange24h: changes[i],
      totalShares: String(supplies[i]),
      totalRaised: raisedOkb[i],
      priceHistory: fakePriceHistory(prices[i]),
    };
    return acc;
  }, {} as Record<string, CurveData>);

  const market: MarketDetail = {
    matchId:         matchId as string,
    homeTeam:        home,
    awayTeam:        away,
    matchTime:       Number(matchTime as bigint),
    isResolved:      s[6],
    resolvedOutcome: s[7],
    totalPool:       poolDisplay,
    curves:          curvesData as MarketDetail["curves"],
    curveAddresses:  curveAddrs as [`0x${string}`,`0x${string}`,`0x${string}`],
  };

  return { market };
}
