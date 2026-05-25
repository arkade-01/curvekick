// ── Deployed addresses (update after each redeploy) ────────────────────────
export const FACTORY_ADDRESS = "0xB84709d277a3134Fad667D68F5AB18295c1Fae25" as const;
export const TOKEN_ADDRESS   = "0x3Ba2394d0f28dA583D110def321C623d57f3e2C1" as const;

// ── Bonding curve constants (must match contract BASE_PRICE / SLOPE) ────────
// Testnet: 0.01 CKUSD base, 0.001 CKUSD slope
export const BASE_PRICE = 0.01;
export const SLOPE      = 0.001;
export const TOKEN_SYMBOL = "CKUSD";
export const TOKEN_DECIMALS = 18;

/** Estimate shares buyable for a given token amount using the quadratic formula. */
export function estimateSharesFromAmount(amount: number, currentSupply: number): number {
  const a = SLOPE / 2;
  const b = BASE_PRICE + SLOPE * currentSupply;
  const discriminant = b * b + 4 * a * amount;
  if (discriminant < 0) return 0;
  return Math.floor((-b + Math.sqrt(discriminant)) / (2 * a));
}

// ── ABIs ───────────────────────────────────────────────────────────────────

export const TOKEN_ABI = [
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve",       outputs: [{ type: "bool" }],    stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "owner",   type: "address" }, { name: "spender", type: "address" }], name: "allowance",   outputs: [{ type: "uint256" }], stateMutability: "view",       type: "function" },
  { inputs: [{ name: "account", type: "address" }],                                        name: "balanceOf",   outputs: [{ type: "uint256" }], stateMutability: "view",       type: "function" },
  { inputs: [],                                                                             name: "faucet",      outputs: [],                    stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "user",    type: "address" }],                                        name: "nextClaimTime", outputs: [{ type: "uint256" }], stateMutability: "view",     type: "function" },
  { inputs: [],                                                                             name: "symbol",      outputs: [{ type: "string" }],  stateMutability: "view",       type: "function" },
] as const;

export const FACTORY_ABI = [
  { inputs: [],                                                                                                  name: "getAllMarkets", outputs: [{ type: "address[]" }], stateMutability: "view",       type: "function" },
  { inputs: [],                                                                                                  name: "admin",        outputs: [{ type: "address" }],   stateMutability: "view",       type: "function" },
  { inputs: [],                                                                                                  name: "token",        outputs: [{ type: "address" }],   stateMutability: "view",       type: "function" },
  { inputs: [{ name: "matchId", type: "string" }],                                                              name: "getMarket",    outputs: [{ type: "address" }],   stateMutability: "view",       type: "function" },
  { inputs: [{ name: "matchId", type: "string" }, { name: "matchTime", type: "uint256" }],                     name: "createMarket", outputs: [{ type: "address" }],   stateMutability: "nonpayable", type: "function" },
  { anonymous: false, inputs: [{ indexed: true, name: "market", type: "address" }, { indexed: false, name: "matchId", type: "string" }, { indexed: false, name: "matchTime", type: "uint256" }], name: "MarketCreated", type: "event" },
] as const;

export const MARKET_ABI = [
  { inputs: [],                                                                                                    name: "matchId",        outputs: [{ type: "string" }],  stateMutability: "view",       type: "function" },
  { inputs: [],                                                                                                    name: "matchTime",      outputs: [{ type: "uint256" }], stateMutability: "view",       type: "function" },
  { inputs: [],                                                                                                    name: "resolved",       outputs: [{ type: "bool" }],    stateMutability: "view",       type: "function" },
  { inputs: [],                                                                                                    name: "resolvedOutcome",outputs: [{ type: "uint8" }],   stateMutability: "view",       type: "function" },
  { inputs: [],                                                                                                    name: "totalPool",      outputs: [{ type: "uint256" }], stateMutability: "view",       type: "function" },
  { inputs: [],                                                                                                    name: "token",          outputs: [{ type: "address" }], stateMutability: "view",       type: "function" },
  { inputs: [{ name: "", type: "address" }],                                                                      name: "claimed",        outputs: [{ type: "bool" }],    stateMutability: "view",       type: "function" },
  { inputs: [{ name: "", type: "uint256" }],                                                                      name: "curves",         outputs: [{ type: "address" }], stateMutability: "view",       type: "function" },
  {
    inputs: [], name: "getMarketState",
    outputs: [
      { name: "homePrice",  type: "uint256" }, { name: "homeSupply", type: "uint256" },
      { name: "drawPrice",  type: "uint256" }, { name: "drawSupply", type: "uint256" },
      { name: "awayPrice",  type: "uint256" }, { name: "awaySupply", type: "uint256" },
      { name: "isResolved", type: "bool" },    { name: "outcome",    type: "uint8" },
    ],
    stateMutability: "view", type: "function",
  },
  // ERC20 buy: approve TOKEN_ADDRESS for marketAddress first, then call buy
  { inputs: [{ name: "outcome", type: "uint8" }, { name: "shares", type: "uint256" }, { name: "maxCost", type: "uint256" }], name: "buy",   outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "outcome", type: "uint8" }, { name: "shares", type: "uint256" }],                                        name: "sell",  outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [],                                                                                                                 name: "claim", outputs: [], stateMutability: "nonpayable", type: "function" },
  { anonymous: false, inputs: [{ indexed: true, name: "outcome", type: "uint8" }, { name: "totalPool", type: "uint256" }], name: "MarketResolved", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "winner",  type: "address" }, { name: "amount",    type: "uint256" }], name: "WinnerClaimed",  type: "event" },
] as const;

export const CURVE_ABI = [
  { inputs: [],                                                  name: "totalRaised",   outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [],                                                  name: "totalSupply",   outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "", type: "address" }],                    name: "balanceOf",     outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "shares", type: "uint256" }],              name: "getBuyCost",    outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "shares", type: "uint256" }],              name: "getSellRefund", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { anonymous: false, inputs: [{ indexed: true, name: "buyer",  type: "address" }, { name: "shares", type: "uint256" }, { name: "cost",   type: "uint256" }], name: "SharesBought", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "seller", type: "address" }, { name: "shares", type: "uint256" }, { name: "refund", type: "uint256" }], name: "SharesSold",   type: "event" },
] as const;

const TEAM_NAMES: Record<string, string> = {
  BRAZ: "Brazil 🇧🇷",    FRA:  "France 🇫🇷",       ARG:  "Argentina 🇦🇷",   ENG:  "England 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  GER:  "Germany 🇩🇪",   ESP:  "Spain 🇪🇸",         POR:  "Portugal 🇵🇹",    ITA:  "Italy 🇮🇹",
  NED:  "Netherlands 🇳🇱", BEL: "Belgium 🇧🇪",       URU:  "Uruguay 🇺🇾",     CHI:  "Chile 🇨🇱",
  MEX:  "Mexico 🇲🇽",    USA:  "USA 🇺🇸",           JPN:  "Japan 🇯🇵",       KOR:  "South Korea 🇰🇷",
  MAR:  "Morocco 🇲🇦",   SEN:  "Senegal 🇸🇳",       NGA:  "Nigeria 🇳🇬",     CIV:  "Ivory Coast 🇨🇮",
  AUS:  "Australia 🇦🇺", CRO:  "Croatia 🇭🇷",       SUI:  "Switzerland 🇨🇭", DEN:  "Denmark 🇩🇰",
  POL:  "Poland 🇵🇱",    SRB:  "Serbia 🇷🇸",        CZE:  "Czech Rep. 🇨🇿",  WAL:  "Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  ECU:  "Ecuador 🇪🇨",   GHA:  "Ghana 🇬🇭",         TUN:  "Tunisia 🇹🇳",     CMR:  "Cameroon 🇨🇲",
  QAT:  "Qatar 🇶🇦",     SAU:  "Saudi Arabia 🇸🇦",  IRN:  "Iran 🇮🇷",        CAN:  "Canada 🇨🇦",
};

export function parseMatchId(matchId: string): { home: string; away: string; label: string } {
  const parts = matchId.split("-");
  const home = TEAM_NAMES[parts[0]] ?? parts[0];
  const away = TEAM_NAMES[parts[1]] ?? parts[1];
  return { home, away, label: `${home} vs ${away}` };
}

export const OUTCOMES = ["HOME", "DRAW", "AWAY"] as const;
export type Outcome = 0 | 1 | 2;
