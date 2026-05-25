Build a full Next.js + Tailwind CSS frontend for CurveKick — a World Cup prediction 
market where each match has 3 bonding curve outcome pools: HOME, DRAW, AWAY. 
Users buy shares with OKB (native token on X Layer, chainId 196). Price increases 
with every buy. Winners split the losing pools after resolution.

## Design direction
Dark trading terminal meets football stadium. Think Bloomberg terminal crossed with 
stadium floodlights at night. Obsidian black background (#080C0A), electric green 
primary accent (#00FF6A), amber for draw/neutral (#FFB800), red for away/down 
(#FF3D3D). Fonts: Bebas Neue for all display headings and match names, DM Mono for 
all prices, data, and body copy. The UI should feel urgent, alive, and data-rich — 
like you're watching live market data during a match.

## Pages to build

### 1. Home page — Match list (pages/index.tsx)
- Full-width hero with a scanline/grain texture overlay on the obsidian background
- Animated ticker tape across the top showing live price movements: 
  "BRA HOME +12.4% · FRA AWAY -3.2% · ARG HOME +8.1% ·" scrolling infinitely
- Section header: "LIVE MARKETS" with a pulsing green dot indicator
- Match cards in a 2-column grid (1-col mobile). Each card:
  - Team names in Bebas Neue, large, with country flag emoji
  - Kickoff time countdown timer (days/hours/mins/secs) that animates
  - A horizontal 3-segment bar showing current sentiment split 
    (green=HOME%, grey=DRAW%, red=AWAY%) that animates on load
  - 3 mini price chips showing current curve price for each outcome
  - Total OKB in pool
  - "TRADE NOW →" button that glows green on hover with a brief flash animation
  - Cards have a subtle green glow on hover, border brightens
  - LIVE badge (amber, pulsing) if match is currently being played
  - RESOLVED badge (green) if market is closed, UPCOMING (grey) if not started

### 2. Match detail page — Trading view (pages/match/[id].tsx)
This is the main action page. Make it feel like a live trading terminal.

Layout:
- Top: Match header — team names huge in Bebas Neue, vs divider, kickoff countdown
- Below: 3 outcome columns side by side (HOME | DRAW | AWAY), each column contains:

  Outcome column (the core UI element):
  - Outcome label (HOME / DRAW / AWAY) in Bebas Neue, colored accordingly
  - Current price in OKB, large DM Mono, with a live flash animation when price changes
    (green flash for price up, red flash for price down)
  - Price change % since market open — show with ↑ or ↓ arrow, colored green/red
  - A sparkline mini chart (last 20 price points) using recharts or a custom SVG path 
    that animates drawing itself on page load — green line for HOME, amber for DRAW, 
    red for AWAY
  - Total shares issued
  - Total OKB raised in this curve
  - Buy button: large, full-width, color-matched to outcome 
    (green for HOME, amber for DRAW, red for AWAY)
  - On hover: button glows and slightly scales up (scale 1.02)
  - Active/selected state: the column gets a glowing border in its color

  Buy panel (appears below or in a slide-up sheet on mobile when user clicks Buy):
  - OKB amount input (DM Mono font, large)
  - Estimated shares you'll receive (updates live as you type)
  - Price impact warning if >5% impact (amber warning)
  - New price after your buy (shows the curve moving)
  - "CONFIRM BUY" button — triggers wallet tx via Privy/wagmi
  - Small slippage tolerance setting

- Below the 3 columns: a full-width combined price history chart (recharts AreaChart)
  showing all 3 curves on the same chart with semi-transparent fills. 
  X-axis: time, Y-axis: price in OKB. Each curve in its respective color.
  Chart should animate in on page load (strokeDasharray animation).

- Right sidebar (desktop) or bottom section (mobile): 
  Recent trades feed — live list of last 10 trades showing:
  "0x1a2b...3c4d bought 42 HOME shares @ 0.0042 OKB — 2 min ago"
  New trades slide in from top with a brief highlight flash

- Bottom: Market info bar — matchId, market contract address (truncated + copy button), 
  total pool size, time until resolution

### 3. Portfolio page (pages/portfolio.tsx)
- Connected wallet's open positions across all markets
- Each position: match name, outcome held, shares owned, current value, P&L in OKB and %
- P&L colored green (positive) or red (negative) with animated number count-up on load
- "CLAIM" button appears for resolved winning positions — glows amber, triggers claim tx
- Empty state: clean illustration with "No positions yet. Pick a match." + link to home

## Animations (critical — this is what makes it feel alive)
- Page load: staggered card reveals using CSS animation-delay (0ms, 80ms, 160ms...)
- Price update flash: when a price prop changes, flash the number green (up) or red (down) 
  for 600ms using a keyframe animation, then return to white
- Ticker tape: infinite horizontal scroll CSS animation, no JS
- Pulsing live dot: CSS keyframe scale + opacity pulse, 1.5s loop
- Sparkline draw-on: SVG strokeDashoffset animation from full length to 0 on mount
- Chart area: recharts with animationDuration={1500} and animationEasing="ease-out"
- Buy button hover: CSS transform scale(1.02) + box-shadow glow in outcome color
- Trade feed: new items use CSS slide-in-from-top + background flash then fade
- Countdown timer: just a setInterval updating state, no animation needed
- Number count-up on portfolio P&L: use a simple useEffect counting from 0 to value

## Component architecture
components/
  MatchCard.tsx          — used on home page grid
  OutcomeColumn.tsx      — the HOME/DRAW/AWAY trading column
  BuyPanel.tsx           — buy input + confirmation
  PriceFlash.tsx         — wraps a number, flashes on value change
  Sparkline.tsx          — mini SVG price chart, animated draw-on
  CombinedChart.tsx      — full recharts AreaChart for match detail
  TradeFeed.tsx          — live scrolling recent trades
  CountdownTimer.tsx     — days/hours/mins/secs live countdown
  SentimentBar.tsx       — 3-segment horizontal bar (HOME%/DRAW%/AWAY%)
  TickerTape.tsx         — infinite scrolling top banner
  OutcomeBadge.tsx       — LIVE / RESOLVED / UPCOMING status badge

## Data shape (mock this with static data for now, wire to contracts later)
typescript
// Match
interface Match {
  id: string                    // e.g. "WC2026_GRP_A1"
  homeTeam: string              // "Brazil 🇧🇷"
  awayTeam: string              // "France 🇫🇷"
  kickoffTime: number           // unix timestamp
  status: 'upcoming' | 'live' | 'resolved'
  result?: 0 | 1 | 2           // 0=HOME 1=DRAW 2=AWAY
  curves: {
    home: CurveData
    draw: CurveData
    away: CurveData
  }
  totalPool: string             // OKB formatted
  contractAddress: string
}

// CurveData
interface CurveData {
  currentPrice: string          // "0.0042"
  priceChange24h: number        // +12.4 (percentage)
  totalShares: string           // "142"
  totalRaised: string           // "0.597 OKB"
  priceHistory: number[]        // last 20 price points for sparkline
}

// Trade
interface Trade {
  wallet: string                // "0x1a2b...3c4d"
  outcome: 'HOME' | 'DRAW' | 'AWAY'
  shares: string
  price: string
  timestamp: number
}


## Wallet integration
- Use Privy for wallet connection (email, Google, or external wallet)
- Custom X Layer chain config:
  id: 196 (mainnet), id: 1952 (testnet)
  RPC mainnet: https://rpc.xlayer.tech
  RPC testnet: https://testrpc.xlayer.tech/terigon
- useContractWrite from wagmi for buy() and claim() calls
- Show connected wallet address truncated in top right nav
- Privy accent color: #00FF6A, theme: dark

## Tailwind config additions needed
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        obsidian: '#080C0A',
        pitch: '#0A1A10',
        green: { DEFAULT: '#00FF6A', dim: '#00CC55', muted: '#1A3D28' },
        amber: '#FFB800',
        danger: '#FF3D3D',
        grey: { 400: '#8A9E92', 600: '#2A3D30', 700: '#1A2E22' },
      },
      keyframes: {
        'flash-up': {
          '0%': { color: '#00FF6A', textShadow: '0 0 8px #00FF6A' },
          '100%': { color: '#F0F5F1', textShadow: 'none' },
        },
        'flash-down': {
          '0%': { color: '#FF3D3D', textShadow: '0 0 8px #FF3D3D' },
          '100%': { color: '#F0F5F1', textShadow: 'none' },
        },
        'ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.8)' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'flash-up': 'flash-up 0.6s ease-out forwards',
        'flash-down': 'flash-down 0.6s ease-out forwards',
        'ticker': 'ticker 30s linear infinite',
        'pulse-dot': 'pulse-dot 1.5s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
}

## Google Fonts import (in globals.css)
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');

## Important notes
- Use mock/static data everywhere — no real contract calls yet. 
  The mock data should look realistic: 5-6 matches, prices varying, 
  some live some upcoming, realistic OKB amounts (0.001–0.01 range)
- Mobile responsive — match cards stack to 1 column, outcome columns 
  stack vertically on mobile with horizontal scroll option
- No white backgrounds anywhere — obsidian or pitch only
- Every price number should be wrapped in the PriceFlash component 
  so it's ready to animate when real data comes in
- recharts for all charts — already available in the project
- Keep component files clean and under 150 lines each — split logic 
  into hooks where needed (useCountdown, usePriceFlash, useTradeHistory)