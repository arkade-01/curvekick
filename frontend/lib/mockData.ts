export interface CurveData {
  currentPrice: string;
  priceChange24h: number;
  totalShares: string;
  totalRaised: string;
  priceHistory: number[];
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: number;
  status: "upcoming" | "live" | "resolved";
  result?: 0 | 1 | 2;
  curves: { home: CurveData; draw: CurveData; away: CurveData };
  totalPool: string;
  contractAddress: string;
}

export interface Trade {
  wallet: string;
  outcome: "HOME" | "DRAW" | "AWAY";
  shares: string;
  price: string;
  timestamp: number;
}

const now = Date.now() / 1000;

function makeCurve(price: number, change: number, shares: number, raised: number): CurveData {
  const base = price * 0.7;
  return {
    currentPrice: price.toFixed(4),
    priceChange24h: change,
    totalShares: String(shares),
    totalRaised: raised.toFixed(3) + " CKUSD",
    priceHistory: Array.from({ length: 20 }, (_, i) =>
      parseFloat((base + (price - base) * (i / 19) + (Math.random() - 0.5) * price * 0.1).toFixed(5))
    ),
  };
}

export const MOCK_MATCHES: Match[] = [
  {
    id: "WC2026_GRP_A1",
    homeTeam: "Brazil 🇧🇷",
    awayTeam: "France 🇫🇷",
    kickoffTime: now + 3600 * 2,
    status: "upcoming",
    curves: {
      home: makeCurve(0.0058, 14.2, 142, 0.823),
      draw: makeCurve(0.0021, 3.1, 89, 0.187),
      away: makeCurve(0.0038, -5.4, 127, 0.483),
    },
    totalPool: "1.493",
    contractAddress: "0x3b26D50D9DD40Fd6aB597998CD50DB69234A85F1",
  },
  {
    id: "WC2026_GRP_B1",
    homeTeam: "Argentina 🇦🇷",
    awayTeam: "Germany 🇩🇪",
    kickoffTime: now + 3600 * 26,
    status: "upcoming",
    curves: {
      home: makeCurve(0.0071, 8.1, 201, 1.426),
      draw: makeCurve(0.0019, -1.2, 67, 0.127),
      away: makeCurve(0.0044, 2.3, 155, 0.682),
    },
    totalPool: "2.235",
    contractAddress: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "WC2026_GRP_C1",
    homeTeam: "England 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    awayTeam: "Spain 🇪🇸",
    kickoffTime: now - 3600 * 0.5,
    status: "live",
    curves: {
      home: makeCurve(0.0063, 19.4, 312, 1.967),
      draw: makeCurve(0.0017, -8.2, 44, 0.075),
      away: makeCurve(0.0049, 6.7, 289, 1.416),
    },
    totalPool: "3.458",
    contractAddress: "0x0000000000000000000000000000000000000002",
  },
  {
    id: "WC2026_GRP_D1",
    homeTeam: "Portugal 🇵🇹",
    awayTeam: "Netherlands 🇳🇱",
    kickoffTime: now + 3600 * 48,
    status: "upcoming",
    curves: {
      home: makeCurve(0.0052, 5.9, 178, 0.926),
      draw: makeCurve(0.0023, 1.4, 95, 0.219),
      away: makeCurve(0.0041, -3.1, 140, 0.574),
    },
    totalPool: "1.719",
    contractAddress: "0x0000000000000000000000000000000000000003",
  },
  {
    id: "WC2026_GRP_E1",
    homeTeam: "Morocco 🇲🇦",
    awayTeam: "Belgium 🇧🇪",
    kickoffTime: now - 3600 * 96,
    status: "resolved",
    result: 0,
    curves: {
      home: makeCurve(0.0091, 42.3, 521, 4.741),
      draw: makeCurve(0.0018, -12.1, 31, 0.056),
      away: makeCurve(0.0022, -28.7, 88, 0.194),
    },
    totalPool: "4.991",
    contractAddress: "0x0000000000000000000000000000000000000004",
  },
  {
    id: "WC2026_GRP_F1",
    homeTeam: "USA 🇺🇸",
    awayTeam: "Mexico 🇲🇽",
    kickoffTime: now + 3600 * 72,
    status: "upcoming",
    curves: {
      home: makeCurve(0.0046, 11.3, 203, 0.934),
      draw: makeCurve(0.0024, 2.8, 111, 0.266),
      away: makeCurve(0.0039, 7.4, 189, 0.737),
    },
    totalPool: "1.937",
    contractAddress: "0x0000000000000000000000000000000000000005",
  },
];

export const MOCK_TRADES: Trade[] = [
  { wallet: "0x1a2b...3c4d", outcome: "HOME", shares: "42",  price: "0.0058", timestamp: now - 120 },
  { wallet: "0x9f8e...1a2b", outcome: "AWAY", shares: "18",  price: "0.0038", timestamp: now - 340 },
  { wallet: "0x4d3c...9f8e", outcome: "HOME", shares: "75",  price: "0.0055", timestamp: now - 600 },
  { wallet: "0x7b6a...4d3c", outcome: "DRAW", shares: "30",  price: "0.0021", timestamp: now - 900 },
  { wallet: "0x2c1b...7b6a", outcome: "HOME", shares: "12",  price: "0.0052", timestamp: now - 1200 },
  { wallet: "0x5e4d...2c1b", outcome: "AWAY", shares: "55",  price: "0.0036", timestamp: now - 1800 },
  { wallet: "0x8a79...5e4d", outcome: "HOME", shares: "88",  price: "0.0049", timestamp: now - 2400 },
  { wallet: "0x3f2e...8a79", outcome: "DRAW", shares: "20",  price: "0.0020", timestamp: now - 3000 },
  { wallet: "0x6c5b...3f2e", outcome: "AWAY", shares: "33",  price: "0.0034", timestamp: now - 3600 },
  { wallet: "0x0d9c...6c5b", outcome: "HOME", shares: "60",  price: "0.0045", timestamp: now - 4200 },
];
