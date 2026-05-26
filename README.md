# CurveKick

**Prediction markets for World Cup 2026 — powered by bonding curves on X Layer.**

Bet on HOME / DRAW / AWAY outcomes with CKUSD. Share price rises with every buy, falls with every sell. When the match ends, winners split the entire pool proportionally — no house cut.

**Live testnet:** [curvekick.fun](https://curvekick.fun) · **Network:** X Layer Testnet (Chain ID 1952)

---

## What Makes It Different

Most World Cup prediction apps use fixed odds set by a bookmaker. CurveKick replaces the bookmaker with a bonding curve — prices are set entirely by the crowd.

**Bonding curve pricing:** Each outcome has its own independent price curve.

```
price(n) = 0.01 + 0.001 × current_supply   (CKUSD per share)
```

Every buy pushes the price up for the next buyer. Every sell pushes it down. The share price at any moment is a live, crowd-derived probability — no oracle, no admin, no spread.

**No house edge:** The entire pool — all three sides — goes to winners.

```
payout = (your_shares / winning_outcome_supply) × total_pool
```

**Early conviction is rewarded:** A correct bet placed when supply was low earns a larger slice of a larger pool. This creates a genuine incentive to research, commit early, and take a position — not just follow the crowd.

**Exit any time:** Positions can be sold back to the curve before kickoff at the refund price:

```
refund = BASE_PRICE × shares + SLOPE × shares × (2 × supply − shares) / 2
```

---

## Market Potential

World Cup 2026 is the largest sporting event on the planet — 48 teams, 104 matches, a global audience of 5+ billion. CurveKick targets that traffic with the lowest possible onboarding friction:

- **No wallet required to start** — Privy embeds a wallet on email or social login (Google, Twitter). A user with zero crypto experience can place their first bet in under 2 minutes.
- **21 live WC2026 markets** — Brazil vs Argentina, England vs France, Germany vs Spain, and 18 more, live on X Layer Testnet today.
- **Micro-bets are viable** — X Layer's near-zero fees mean a 10 CKUSD bet doesn't get wiped out by gas. Every interaction is cheap enough to be casual.
- **Each bet is an X Layer transaction** — active markets generate sustained on-chain volume, not just wallet connections.

---

## What Was Built (Completion)

Full stack, fully deployed, end-to-end verifiable on testnet:

- [x] `BondingCurve.sol` — linear price curve, buy/sell/refund math
- [x] `MatchMarket.sol` — three curves per match, resolve + proportional claim
- [x] `MarketFactory.sol` — deploys and indexes markets by matchId
- [x] `Resolver.sol` — enforces 90-min post-kickoff timelock before resolution
- [x] `TestToken.sol` — CKUSD ERC20 with 24h faucet
- [x] Frontend — Next.js 15, Privy auth, wagmi v2, fully responsive
- [x] 21 markets live on X Layer Testnet
- [x] Listener service — polls API-Football, auto-resolves markets on-chain
- [x] Admin UI — create and manage markets from the browser

### Contract Addresses — X Layer Testnet

| Contract | Address |
|----------|---------|
| CKUSD (TestToken) | `0x3Ba2394d0f28dA583D110def321C623d57f3e2C1` |
| Resolver | `0xEcCD02be055E36913F434Ca5fFF58d074DBda6Ea` |
| MarketFactory | `0xB84709d277a3134Fad667D68F5AB18295c1Fae25` |

---

## User Flow

1. Visit [curvekick.fun](https://curvekick.fun) — sign in with email, Google, Twitter, or a wallet
2. Get testnet OKB for gas at [web3.okx.com/xlayer/faucet](https://web3.okx.com/xlayer/faucet)
3. Claim 1000 CKUSD from the in-app faucet
4. Pick a match, pick an outcome, buy shares
5. Watch the price move as others bet
6. Sell before kickoff or hold for the result
7. Winners claim their share of the full pool after resolution

---

## Architecture

```
contracts/          Solidity 0.8.24 (Hardhat 3)
  TestToken.sol     CKUSD ERC20 with 24h faucet
  BondingCurve.sol  Linear bonding curve per outcome
  MatchMarket.sol   Buy / sell / resolve / claim logic
  MarketFactory.sol Deploys and indexes MatchMarkets
  Resolver.sol      Admin resolver with 90-min post-kickoff timelock

frontend/           Next.js 15 · wagmi v2 · Privy auth
listener/           Node.js service — polls API-Football, auto-resolves markets
scripts/            Deploy · seed · batch market creation
```

---

## Why X Layer

Bonding curves generate one on-chain transaction per share buy or sell. On Ethereum mainnet, gas costs would exceed the value of small positions. X Layer's low fees make casual, small-stakes prediction markets economically viable for the first time — which is exactly what a mass World Cup audience needs.

---

## Local Setup

### Prerequisites

- Node.js 20+
- X Layer Testnet wallet with OKB for gas

### Install

```bash
npm install                    # root (Hardhat + scripts)
cd frontend && npm install     # Next.js app
cd ../listener && npm install  # auto-resolver service
```

### Environment

```bash
# .env (root)
PRIVATE_KEY=0x...
XLAYER_TESTNET_RPC=https://testrpc.xlayer.tech/terigon

# frontend/.env.local
NEXT_PUBLIC_PRIVY_APP_ID=...   # privy.io dashboard
```

### Deploy Contracts

```bash
npx hardhat run scripts/deploy.ts --network xlayer_testnet
```

Update `FACTORY_ADDRESS` and `TOKEN_ADDRESS` in `frontend/lib/contracts.ts`.

### Create Markets

Via the admin UI at `/admin` (connect the deployer wallet), or run the batch script:

```bash
npx hardhat run scripts/deploy20Markets.ts --network xlayer_testnet
```

### Seed Markets (optional)

```bash
MARKET_ADDRESS=0x... npx hardhat run scripts/seedMarket.ts --network xlayer_testnet
```

### Run Frontend

```bash
cd frontend && npm run dev
```

### Run Listener

```bash
cd listener
# Set ADMIN_PRIVATE_KEY, RPC_URL, API_FOOTBALL_KEY, RESOLVER_ADDRESS, MARKET_FACTORY_ADDRESS in .env
npm run build && node dist/index.js
# or: fly deploy
```

---

Built for the OKX X Layer Hackathon · May 2026
