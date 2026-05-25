# CurveKick — Development Plan
> 10 days · Deadline: May 28, 23:59 UTC

---

## Day 1 — BondingCurve.sol

The core primitive. Everything builds on this.

- [ ] Init Hardhat project with TypeScript
- [ ] Install OpenZeppelin contracts
- [ ] Write `BondingCurve.sol`
  - Linear curve: `price = basePrice + (slope × supply)`
  - `buy()` payable — mint shares, increase price
  - `sell(uint256 shares)` — burn shares, return OKB
  - `getPrice(uint256 shares) view` — quote before tx
  - `totalRaised() view`
  - Events: `SharesBought`, `SharesSold`
- [ ] Write Hardhat tests for BondingCurve
  - Buy increases price
  - Sell decreases price
  - Overpayment refunded
  - Cannot sell more than owned

---

## Day 2 — MatchMarket.sol + MarketFactory.sol + Resolver.sol

- [ ] Write `MatchMarket.sol`
  - Deploys 3 BondingCurve instances on construction (HOME, DRAW, AWAY)
  - `resolve(uint8 outcome) onlyAdmin`
  - `claim()` — winners pull OKB after resolution
  - `getMarketState() view` — returns all 3 curve prices + supplies
  - Events: `MarketResolved`, `WinnerClaimed`
- [ ] Write `MarketFactory.sol`
  - `createMarket(string matchId, uint256 matchTime) onlyAdmin`
  - `getMarket(string matchId) view`
  - `getAllMarkets() view`
  - Event: `MarketCreated`
- [ ] Write `Resolver.sol`
  - Admin-only resolve wrapper
  - Timelock: cannot resolve before `matchTime + 90 min`
- [ ] Write tests for full market lifecycle
  - Create → buy all 3 outcomes → resolve → claim

---

## Day 3 — Deploy + Scripts

- [ ] Configure `hardhat.config.ts` for X Layer testnet (chainId 195)
- [ ] Write `scripts/deploy.ts` — deploy MarketFactory
- [ ] Write `scripts/createMarket.ts` — create a market by matchId
- [ ] Write `scripts/seedMarket.ts`
  - Buy from 3–5 different wallets across all 3 curves
  - Log all tx hashes
- [ ] Write `scripts/resolveMarket.ts` — resolve + verify claim works
- [ ] Deploy to X Layer testnet
- [ ] Verify contracts on testnet explorer
- [ ] Run seedMarket.ts — confirm 20+ transactions on explorer

---

## Day 4 — Listener service (Fly.io)

- [ ] Init Node.js TypeScript project in `/listener`
- [ ] Write `apifootball.ts`
  - Poll `GET /fixtures?live=all` every 60s
  - Only poll during active match windows (save req quota)
  - Detect `FT` (full time) status
  - Extract: matchId, home score, away score → derive outcome
- [ ] Write `resolver.ts`
  - Maps API result to contract `resolve(uint8)` call
  - Signs + broadcasts tx via admin wallet
  - Logs resolution tx hash
- [ ] Write `index.ts` — main polling loop with error handling
- [ ] Test against a past completed match fixture

---

## Day 5 — Deploy listener to Fly.io

- [ ] Install Fly CLI, init app
- [ ] Write `fly.toml`
  - Set `auto_stop_machines = false` (always-on)
- [ ] Set secrets: `ADMIN_PRIVATE_KEY`, `ALCHEMY_RPC_URL`, `API_FOOTBALL_KEY`
- [ ] Deploy to Fly.io free tier
- [ ] Confirm listener is polling without cold starts
- [ ] Test full flow: mock FT event → resolver calls contract → onchain tx confirmed

---

## Day 6 — Frontend scaffolding

- [ ] Init Next.js app with TypeScript in `/frontend`
- [ ] Install wagmi, viem, RainbowKit
- [ ] Configure wagmi for X Layer (chainId 196)
- [ ] Write `lib/contracts.ts` — ABI + deployed addresses
- [ ] Build match list page `pages/index.tsx`
  - Fetch all markets from MarketFactory
  - Show: teams, kickoff time, total OKB in each curve
  - Sort by kickoff time
- [ ] Build match detail page `pages/match/[id].tsx`
  - Show 3 curve panels (HOME / DRAW / AWAY)
  - Current price per outcome
  - Total OKB raised per curve

---

## Day 7 — Frontend trading UI

- [ ] Build `components/CurveChart.tsx`
  - Line chart of price over time (pull from events)
  - Updates on new SharesBought events via Alchemy websocket
- [ ] Build `components/BuyPanel.tsx`
  - Input: amount in OKB
  - Show: estimated shares + price impact
  - Button: Buy (calls `buy()` with msg.value)
  - Button: Sell (calls `sell(shares)`)
- [ ] Build `components/Leaderboard.tsx`
  - Top wallets by total OKB in winning positions
- [ ] Build claim page — show claimable amount after resolution
- [ ] Deploy frontend to Vercel
- [ ] Test full flow on testnet via browser

---

## Day 8 — Automation pipeline

- [ ] Create @CurveKick_XL X account
- [ ] Configure Alchemy Notify webhooks
  - Watch `MarketResolved` event on all MatchMarket addresses
  - Watch `SharesBought` events above 0.1 OKB threshold
  - Point webhook URL to Make.com scenario
- [ ] Build Make.com scenario
  - Trigger: incoming webhook from Alchemy
  - Parse event type (MarketResolved vs SharesBought)
  - Format tweet text based on event data
  - Post to X via Make's native X module
- [ ] Test end to end: resolve testnet market → tweet fires
- [ ] Schedule 7 build update tweets in Buffer (one per day)

---

## Day 9 — Mainnet deploy + seeding

- [ ] Switch hardhat config to X Layer mainnet (chainId 196)
- [ ] Deploy MarketFactory to mainnet
- [ ] Verify contracts on `oklink.com/xlayer`
- [ ] Create markets for 5 opening World Cup matches (June 11)
- [ ] Run seedMarket.ts across 3–5 wallets — generate 50+ transactions
- [ ] Confirm all tx visible on X Layer explorer
- [ ] Fix any frontend bugs against mainnet
- [ ] Record demo video (under 2 min)
  - Show: match list → buy shares → price moves → resolve → claim → auto-tweet fires

---

## Day 10 — Submit

- [ ] Push final code to GitHub (public repo)
- [ ] Write README with: what it is, how it works, contract addresses, live link
- [ ] Final X post tagging @XLayerOfficial with live link
- [ ] Fill Google Form before 23:59 UTC
- [ ] Double check: contracts verified, frontend live, X account active, demo video uploaded

---

## Contract addresses (fill as you deploy)

```
Network: X Layer Mainnet (chainId 196)

MarketFactory:  0x...
BondingCurve:   (deployed per market by factory)
Admin wallet:   0x...

Testnet (chainId 195):
MarketFactory:  0x...
```

---

## Environment variables

```bash
# contracts + scripts
PRIVATE_KEY=
ALCHEMY_API_KEY=
XLAYER_RPC=https://rpc.xlayer.tech

# listener
ADMIN_PRIVATE_KEY=
ALCHEMY_RPC_URL=
API_FOOTBALL_KEY=
MARKET_FACTORY_ADDRESS=

# frontend
NEXT_PUBLIC_ALCHEMY_KEY=
NEXT_PUBLIC_FACTORY_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=196
```
