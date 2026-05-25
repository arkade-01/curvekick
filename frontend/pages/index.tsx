import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import MatchCard from "@/components/MatchCard";
import { useMarkets } from "@/hooks/useMarkets";
import { useStats } from "@/hooks/useStats";
import { useIsMobile } from "@/hooks/useIsMobile";

// Animated bonding curve SVG
function BondingCurveViz() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setProgress(p => (p >= 1 ? 0 : p + 0.004)), 16);
    return () => clearInterval(id);
  }, []);

  const W = 360, H = 180;
  const pts = Array.from({ length: 80 }, (_, i) => {
    const x = (i / 79) * W;
    const supply = i / 79;
    const price = 0.001 + 0.0001 * supply * 79;
    const y = H - (price / (0.001 + 0.0001 * 79)) * H * 0.88 - 10;
    return `${x},${y}`;
  });
  const full = `M ${pts.join(" L ")}`;

  // Animated dot position
  const dotIdx = Math.floor(progress * 79);
  const dotPts = pts[dotIdx]?.split(",").map(Number) ?? [0, 0];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ opacity: 0.9 }}>
      <defs>
        <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00FF6A" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#00FF6A" stopOpacity="0.9" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={0} y1={H * t} x2={W} y2={H * t} stroke="#1A2E22" strokeWidth="0.5" />
      ))}
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={W * t} y1={0} x2={W * t} y2={H} stroke="#1A2E22" strokeWidth="0.5" />
      ))}
      {/* Curve fill */}
      <path d={`${full} L ${W},${H} L 0,${H} Z`} fill="url(#curveGrad)" opacity="0.15" />
      {/* Curve line */}
      <path d={full} fill="none" stroke="#00FF6A" strokeWidth="2" filter="url(#glow)" />
      {/* Animated dot */}
      <circle cx={dotPts[0]} cy={dotPts[1]} r={5} fill="#00FF6A" filter="url(#glow)" />
      <circle cx={dotPts[0]} cy={dotPts[1]} r={10} fill="#00FF6A" opacity={0.2} />
      {/* Axis labels */}
      <text x={4} y={H - 4} fill="#2A3D30" fontSize={9} fontFamily="monospace">SUPPLY →</text>
      <text x={4} y={12} fill="#2A3D30" fontSize={9} fontFamily="monospace">PRICE ↑</text>
    </svg>
  );
}

function StatTile({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 24px" }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, color: "#F0F5F1", fontWeight: 500, marginBottom: 6 }}>
        {loading ? <span style={{ color: "#2A3D30" }}>—</span> : value}
      </div>
      <div style={{ fontSize: 9, color: "#8A9E92", letterSpacing: "0.2em" }}>{label}</div>
    </div>
  );
}

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "PICK A SIDE",
    body: "Choose HOME win, DRAW, or AWAY win for any World Cup match. Each outcome has its own bonding curve.",
    color: "#00FF6A",
  },
  {
    n: "02",
    title: "BUY SHARES",
    body: "Every buy moves the price up along the curve. The earlier you buy, the cheaper your shares.",
    color: "#FFB800",
  },
  {
    n: "03",
    title: "CLAIM WINNINGS",
    body: "After the final whistle, winners claim their share of the entire losing pool. Proportional to shares held.",
    color: "#FF3D3D",
  },
];

export default function LandingPage() {
  const { markets } = useMarkets();
  const { stats, marketsCount } = useStats();
  const isMobile = useIsMobile();

  const preview = markets
    .filter(m => m.status !== "resolved")
    .slice(0, 3);

  const statsLoading = stats === null;
  const volDisplay = stats ? (stats.totalVolumeOkb >= 1000 ? `${(stats.totalVolumeOkb / 1000).toFixed(1)}K` : stats.totalVolumeOkb.toFixed(1)) : "—";

  return (
    <>
      <Head>
        <title>CurveKick — World Cup 2026 Prediction Markets</title>
        <meta name="description" content="Trade World Cup 2026 outcomes on bonding curves. Winners take all. Built on X Layer." />
        <meta property="og:title" content="CurveKick — World Cup 2026 Prediction Markets" />
        <meta property="og:description" content="Trade HOME / DRAW / AWAY outcomes on bonding curves. Every buy moves the price." />
        <meta property="og:url" content="https://curvekick.com" />
      </Head>

      <div style={{ minHeight: "100vh", background: "#050E08", color: "#F0F5F1", fontFamily: "'DM Mono', monospace", overflowX: "hidden" }}>

        {/* ── Nav ── */}
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "16px 20px" : "20px 48px", borderBottom: "1px solid #0D1F10" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="#1A3D28"/>
              <path d="M6 30 Q12 28 18 20 Q24 12 34 10" stroke="#00FF6A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <circle cx="34" cy="10" r="3.5" fill="#00FF6A"/>
              <line x1="6" y1="10" x2="6" y2="34" stroke="#2A3D30" strokeWidth="0.5"/>
              <line x1="6" y1="34" x2="34" y2="34" stroke="#2A3D30" strokeWidth="0.5"/>
            </svg>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: "0.08em", color: "#F0F5F1", lineHeight: 1 }}>CURVEKICK</div>
              <div style={{ fontSize: 8, color: "#00FF6A", letterSpacing: "0.2em" }}>PREDICTION MARKETS</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 16 : 32 }}>
            {!isMobile && (
              <>
                <a href="#how" style={{ fontSize: 11, color: "#8A9E92", textDecoration: "none", letterSpacing: "0.12em" }}>HOW IT WORKS</a>
                <a href="#markets" style={{ fontSize: 11, color: "#8A9E92", textDecoration: "none", letterSpacing: "0.12em" }}>MARKETS</a>
              </>
            )}
            <Link href="/markets">
              <button style={{ background: "#00FF6A", color: "#080C0A", border: "none", borderRadius: 6, padding: isMobile ? "8px 16px" : "10px 24px", fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer" }}>
                LAUNCH APP
              </button>
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "60px 20px 40px" : "100px 48px 60px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: "#00FF6A", letterSpacing: "0.3em", marginBottom: 16, background: "#00FF6A10", border: "1px solid #00FF6A22", display: "inline-block", padding: "4px 12px", borderRadius: 4 }}>
              WORLD CUP 2026 · X LAYER
            </div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 52 : 76, letterSpacing: "0.04em", lineHeight: 0.95, color: "#F0F5F1", margin: "0 0 24px" }}>
              TRADE THE<br />
              <span style={{ color: "#00FF6A" }}>BEAUTIFUL</span><br />
              GAME
            </h1>
            <p style={{ fontSize: 14, color: "#8A9E92", lineHeight: 1.8, maxWidth: 420, margin: "0 0 36px" }}>
              Pick the outcome. Buy shares on a bonding curve. Every trade moves the price.
              Winners take the entire pool after the final whistle.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/markets">
                <button
                  style={{ background: "#00FF6A", color: "#080C0A", border: "none", borderRadius: 8, padding: "14px 32px", fontSize: 14, fontFamily: "'DM Mono', monospace", fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer", boxShadow: "0 0 32px #00FF6A44" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.03)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
                >
                  TRADE NOW →
                </button>
              </Link>
              <a href="#how">
                <button style={{ background: "none", color: "#8A9E92", border: "1px solid #2A3D30", borderRadius: 8, padding: "14px 32px", fontSize: 14, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", cursor: "pointer" }}>
                  HOW IT WORKS
                </button>
              </a>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: 20, marginTop: 40, flexWrap: "wrap" }}>
              {[["⛓️", "ON-CHAIN"], ["🔒", "NON-CUSTODIAL"], ["⚡", "X LAYER"]].map(([icon, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#8A9E92", letterSpacing: "0.12em" }}>
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Viz */}
          {!isMobile && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ background: "#080C0A", border: "1px solid #1A2E22", borderRadius: 12, padding: "24px", position: "relative" }}>
                <div style={{ fontSize: 9, color: "#8A9E92", letterSpacing: "0.2em", marginBottom: 12 }}>BONDING CURVE · LIVE PRICE</div>
                <BondingCurveViz />
                <div style={{ position: "absolute", top: 20, right: 20, fontSize: 9, color: "#00FF6A", letterSpacing: "0.15em" }}>● LIVE</div>
              </div>

              {/* Outcome chips */}
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                {[["HOME", "#00FF6A", "0.0089"], ["DRAW", "#FFB800", "0.0034"], ["AWAY", "#FF3D3D", "0.0021"]].map(([label, color, price]) => (
                  <div key={label} style={{ flex: 1, background: "#080C0A", border: `1px solid ${color}33`, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#8A9E92", letterSpacing: "0.15em", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 14, color, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{price} CKUSD</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Stats bar ── */}
        <section style={{ borderTop: "1px solid #0D1F10", borderBottom: "1px solid #0D1F10", background: "#080C0A" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 0 }}>
            <StatTile label="CKUSD VOLUME" value={`${volDisplay} CKUSD`} loading={statsLoading} />
            <div style={{ borderLeft: "1px solid #0D1F10" }}>
              <StatTile label="TRADERS" value={String(stats?.uniqueTraders ?? 0)} loading={statsLoading} />
            </div>
            <div style={{ borderLeft: "1px solid #0D1F10" }}>
              <StatTile label="MARKETS" value={String(marketsCount)} loading={false} />
            </div>
            <div style={{ borderLeft: "1px solid #0D1F10" }}>
              <StatTile label="TOTAL TRADES" value={String(stats?.totalTrades ?? 0)} loading={statsLoading} />
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "60px 20px" : "100px 48px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.25em", marginBottom: 12 }}>THE MECHANISM</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 36 : 52, letterSpacing: "0.05em", color: "#F0F5F1", margin: 0 }}>
              HOW IT WORKS
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 24 }}>
            {HOW_IT_WORKS.map(step => (
              <div key={step.n} style={{ background: "#080C0A", border: `1px solid ${step.color}22`, borderRadius: 12, padding: "32px 28px" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: `${step.color}33`, lineHeight: 1, marginBottom: 16 }}>{step.n}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: step.color, letterSpacing: "0.08em", marginBottom: 12 }}>{step.title}</div>
                <p style={{ fontSize: 13, color: "#8A9E92", lineHeight: 1.8, margin: 0 }}>{step.body}</p>
              </div>
            ))}
          </div>

          {/* Bonding curve explainer */}
          <div style={{ marginTop: 48, background: "#080C0A", border: "1px solid #1A2E22", borderRadius: 12, padding: isMobile ? "24px" : "36px 48px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 40, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, color: "#00FF6A", letterSpacing: "0.2em", marginBottom: 12 }}>BONDING CURVE MECHANICS</div>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 28 : 36, color: "#F0F5F1", margin: "0 0 16px", letterSpacing: "0.05em" }}>
                PRICE = BASE + SLOPE × SUPPLY
              </h3>
              <p style={{ fontSize: 13, color: "#8A9E92", lineHeight: 1.8, margin: "0 0 16px" }}>
                Each outcome starts at <span style={{ color: "#F0F5F1" }}>0.01 CKUSD</span> per share. Every share bought increases the price by <span style={{ color: "#F0F5F1" }}>0.001 CKUSD</span>. Early buyers get cheaper shares and higher upside.
              </p>
              <p style={{ fontSize: 13, color: "#8A9E92", lineHeight: 1.8, margin: 0 }}>
                The market can't be manipulated — the price function is deterministic, transparent, and lives entirely on-chain.
              </p>
            </div>
            {!isMobile && (
              <div style={{ background: "#050E08", borderRadius: 8, padding: 20, textAlign: "center" }}>
                <BondingCurveViz />
                <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.15em", marginTop: 12 }}>price rises with each buy</div>
              </div>
            )}
          </div>
        </section>

        {/* ── Live markets preview ── */}
        {preview.length > 0 && (
          <section id="markets" style={{ background: "#080C0A", borderTop: "1px solid #0D1F10", borderBottom: "1px solid #0D1F10" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "60px 20px" : "80px 48px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.25em", marginBottom: 8 }}>OPEN MARKETS</div>
                  <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 32 : 44, color: "#F0F5F1", margin: 0, letterSpacing: "0.05em" }}>
                    PICK YOUR MATCH
                  </h2>
                </div>
                <Link href="/markets" style={{ fontSize: 12, color: "#00FF6A", textDecoration: "none", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                  VIEW ALL →
                </Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(preview.length, isMobile ? 1 : 3)}, 1fr)`, gap: 16 }}>
                {preview.map((m, i) => <MatchCard key={m.address} match={m} index={i} />)}
              </div>
            </div>
          </section>
        )}

        {/* ── Built on X Layer ── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "60px 20px" : "80px 48px", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.25em", marginBottom: 20 }}>POWERED BY</div>
          <div style={{ fontSize: isMobile ? 14 : 18, color: "#F0F5F1", letterSpacing: "0.15em", marginBottom: 16, fontFamily: "'Bebas Neue', sans-serif" }}>
            X LAYER · ZERO KNOWLEDGE EVM
          </div>
          <p style={{ fontSize: 12, color: "#8A9E92", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.8 }}>
            Built on OKX&apos;s ZK-powered Ethereum Layer 2. Low gas fees, fast finality, and CKUSD stablecoin as the settlement currency.
          </p>
          <Link href="/markets">
            <button
              style={{ background: "none", color: "#00FF6A", border: "1px solid #00FF6A44", borderRadius: 8, padding: "14px 40px", fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: "0.15em", cursor: "pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#00FF6A10"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
            >
              START TRADING
            </button>
          </Link>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: "1px solid #0D1F10", padding: isMobile ? "24px 20px" : "32px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="#1A3D28"/>
              <path d="M6 30 Q12 28 18 20 Q24 12 34 10" stroke="#00FF6A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <circle cx="34" cy="10" r="3.5" fill="#00FF6A"/>
            </svg>
            <span style={{ fontSize: 11, color: "#8A9E92", letterSpacing: "0.1em" }}>CURVEKICK · #XCUPHACKATHON 2026</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <Link href="/markets" style={{ fontSize: 10, color: "#8A9E92", textDecoration: "none", letterSpacing: "0.12em" }}>MARKETS</Link>
            <Link href="/leaderboard" style={{ fontSize: 10, color: "#8A9E92", textDecoration: "none", letterSpacing: "0.12em" }}>LEADERBOARD</Link>
            <Link href="/portfolio" style={{ fontSize: 10, color: "#8A9E92", textDecoration: "none", letterSpacing: "0.12em" }}>PORTFOLIO</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
