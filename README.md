# CurveKick

Prediction markets for World Cup 2026 matches using bonding curves on X Layer.

Each match has three outcome pools (HOME / DRAW / AWAY). Buy shares with CKUSD — price rises with every buy. Winners split the losing pools after resolution.

**Live:** [curvekick.com](https://curvekick.com) · **Network:** X Layer Testnet (chainId 1952)

---

## Architecture

```
contracts/          Solidity (Hardhat 3, 0.8.24)
  TestToken.sol     CKUSD ERC20 with 24h faucet
  BondingCurve.sol  Linear price curve per outcome
  MatchMarket.sol   Holds funds, buy/sell/claim logic
  MarketFactory.sol Deploys MatchMarkets
  Resolver.sol      Enforces 90-min post-match timelock

frontend/           Next.js 15 + wagmi v2 + Privy
listener/           Node.js auto-resolver (polls API-Football)
scripts/            Hardhat deploy + seed + batch market creation
```

## Bonding Curve

```
price(n) = BASE_PRICE + SLOPE × supply
         = 0.01 + 0.001 × supply   (CKUSD)
```

## Contract Addresses (X Layer Testnet)

| Contract | Address |
|----------|---------|
| CKUSD (TestToken) | `0x3Ba2394d0f28dA583D110def321C623d57f3e2C1` |
| Resolver | `0xEcCD02be055E36913F434Ca5fFF58d074DBda6Ea` |
| MarketFactory | `0xB84709d277a3134Fad667D68F5AB18295c1Fae25` |
| Sample Market (BRAZ-FRA-01) | `0xa1f36d7479eb4968dE607b95D8e31e93F4d12450` |

---

## Setup

### Prerequisites
- Node.js 20+
- An X Layer Testnet wallet with OKB for gas

### 1. Install dependencies

```bash
npm install                    # root (Hardhat)
cd frontend && npm install     # Next.js
cd ../listener && npm install  # listener service
```

### 2. Configure environment

```bash
# Root .env
PRIVATE_KEY=0x...
XLAYER_TESTNET_RPC=https://testrpc.xlayer.tech/terigon
API_FOOTBALL_KEY=...

# frontend/.env.local
NEXT_PUBLIC_PRIVY_APP_ID=...  # from https://privy.io/dashboard
```

### 3. Deploy contracts

```bash
npx hardhat run scripts/deploy.ts --network xlayer_testnet
```

Then update `FACTORY_ADDRESS` and `TOKEN_ADDRESS` in `frontend/lib/contracts.ts`.

### 4. Create markets

Via admin UI at `/admin` (connect the deployer wallet), or batch:

```bash
MARKET_FACTORY_ADDRESS=0x... npx hardhat run scripts/batchCreateMarkets.ts --network xlayer_testnet
```

### 5. Seed markets (optional liquidity)

```bash
MARKET_ADDRESS=0x... npx hardhat run scripts/seedMarket.ts --network xlayer_testnet
```

### 6. Run frontend locally

```bash
cd frontend && npm run dev
```

### 7. Deploy listener

```bash
cd listener
# Set secrets in .env (ADMIN_PRIVATE_KEY, RPC_URL, API_FOOTBALL_KEY, RESOLVER_ADDRESS, MARKET_FACTORY_ADDRESS)
fly launch   # or: npm run build && node dist/index.js
```

---

## Flow

1. User connects wallet via Privy (email, Google, or external)
2. Claims 1000 CKUSD from `/faucet`
3. Browses matches at `/markets`, opens a match
4. Approves CKUSD spend, buys shares in HOME / DRAW / AWAY outcome
5. After match ends + 90-min timelock, listener auto-resolves on-chain
6. Winners claim proportional share of the full pool at `/portfolio`

---

Built for the OKX X Layer hackathon · May 2026
