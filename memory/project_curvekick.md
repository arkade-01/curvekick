---
name: project-curvekick
description: CurveKick project context — prediction market on X Layer, hackathon deadline, deployed contract addresses
metadata:
  type: project
---

CurveKick is a prediction market with bonding curves for football matches, built on X Layer blockchain for the X Cup Hackathon 2026.

**Deadline:** May 28, 2026 23:59 UTC

**Why:** Hackathon submission — World Cup prediction markets where HOME/DRAW/AWAY outcomes trade on bonding curves; winners split the full pool.

**X Layer Testnet Deployments (2026-05-22):**
- Deployer: `0xa4D3859D69B8105D5D24f703AE0f2b168Bb9EeDA`
- Resolver: `0xd6aB451f8DF1CC95Eca61fef838F2c35B5B546bA`
- MarketFactory: `0xC3bFc40bf7695DEEefB71A54551b819ED1C09F2A`
- Sample MatchMarket (BRAZ-FRA-01): `0x3b26D50D9DD40Fd6aB597998CD50DB69234A85F1`

**How to apply:** Use these addresses when wiring the frontend to contracts.

**Stack:** Hardhat 3 + TypeScript, Solidity 0.8.24, ethers v6, X Layer (OKB gas token)

**Architecture:**
- `BondingCurve.sol` — linear bonding curve per outcome
- `MatchMarket.sol` — 3 curves (HOME/DRAW/AWAY), resolve + claim logic
- `MarketFactory.sol` — creates markets, tracks by matchId
- `Resolver.sol` — admin wrapper with 90-min post-match timelock
