# CurveKick — Frontend

Next.js 15 frontend for CurveKick prediction markets. See the [root README](../README.md) for full project context.

## Stack

- **Next.js 15** (Pages Router)
- **wagmi v2** — contract reads/writes
- **Privy** — auth (email, Google, Twitter, external wallet)
- **@tanstack/react-query** — data fetching
- **X Layer Testnet** (Chain ID 1952, OKB gas)

## Run Locally

```bash
cp .env.local.example .env.local   # add NEXT_PUBLIC_PRIVY_APP_ID
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key Files

```
pages/
  index.tsx          Markets list
  match/[id].tsx     Match detail — buy / sell / claim
  portfolio.tsx      User positions
  faucet.tsx         CKUSD faucet + OKB gas link
  admin.tsx          Market creation (deployer wallet only)

components/
  Navbar.tsx         Privy login, CKUSD balance, copy address

lib/
  contracts.ts       ABIs, addresses, parseMatchId, bonding curve math
  wagmi.ts           wagmi + Privy config

hooks/
  useIsMobile.ts     SSR-safe responsive breakpoint
  usePortfolio.ts    Aggregate user positions across all markets
```
