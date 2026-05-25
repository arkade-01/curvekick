import Head from "next/head";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import OutcomeColumn from "@/components/OutcomeColumn";
import CombinedChart from "@/components/CombinedChart";
import TradeFeed from "@/components/TradeFeed";
import CountdownTimer from "@/components/CountdownTimer";
import SentimentBar from "@/components/SentimentBar";
import OutcomeBadge from "@/components/OutcomeBadge";
import { useMarket } from "@/hooks/useMarket";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function MatchPage() {
  const router  = useRouter();
  const address = router.query.id as `0x${string}` | undefined;
  const { market } = useMarket(address);
  const isMobile = useIsMobile();

  if (!market) return (
    <div style={{ minHeight: "100vh", background: "#080C0A" }}>
      <Navbar />
      <div style={{ textAlign: "center", padding: "80px 24px", color: "#8A9E92", fontSize: 13 }}>
        {router.isReady ? "Loading market data..." : "Loading..."}
      </div>
    </div>
  );

  const { curves, curveAddresses } = market;
  const isResolved = market.isResolved;
  const totalShares = [curves.home, curves.draw, curves.away].map(c => parseInt(c.totalShares));
  const status = isResolved ? "resolved" : (market.matchTime <= Date.now() / 1000 ? "live" : "upcoming");

  return (
    <>
      <Head><title>{market.homeTeam} vs {market.awayTeam} — CurveKick</title></Head>

      <div style={{ minHeight: "100vh", background: "#080C0A" }}>
        <Navbar />

        <main style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "24px 16px" : "40px 24px" }}>
          {/* Back */}
          <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#8A9E92", fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", marginBottom: 28, padding: 0, fontFamily: "'DM Mono', monospace" }}>
            ← ALL MARKETS
          </button>

          {/* Match header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 32 }}>
            <div>
              <div style={{ marginBottom: 10 }}>
                <OutcomeBadge status={status} result={isResolved ? (market.resolvedOutcome as 0 | 1 | 2) : undefined} />
              </div>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, letterSpacing: "0.04em", lineHeight: 1, color: "#F0F5F1", margin: 0 }}>
                {market.homeTeam}
                <span style={{ fontSize: 28, color: "#2A3D30", margin: "0 16px" }}>VS</span>
                {market.awayTeam}
              </h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.15em", marginBottom: 6 }}>
                {isResolved ? "FINAL" : "KICKOFF IN"}
              </div>
              {!isResolved && <CountdownTimer targetTime={market.matchTime} style={{ fontSize: 22, color: "#F0F5F1" }} />}
              <div style={{ marginTop: 8, fontSize: 13, color: "#F0F5F1" }}>
                <span style={{ color: "#8A9E92", fontSize: 10 }}>POOL </span>{market.totalPool} CKUSD
              </div>
            </div>
          </div>

          {/* Sentiment */}
          <div style={{ marginBottom: 40 }}>
            <SentimentBar home={totalShares[0]} draw={totalShares[1]} away={totalShares[2]} height={6} />
          </div>

          {/* 3 outcome columns */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
            {([0, 1, 2] as const).map(o => (
              <OutcomeColumn
                key={o}
                outcome={o}
                data={[curves.home, curves.draw, curves.away][o]}
                isResolved={isResolved}
                isWinner={isResolved && market.resolvedOutcome === o}
                marketAddress={address!}
                curveAddress={curveAddresses[o]}
              />
            ))}
          </div>

          {/* Combined chart */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.2em", marginBottom: 14 }}>PRICE HISTORY</div>
            <CombinedChart home={curves.home} draw={curves.draw} away={curves.away} />
          </div>

          {/* Trade feed + market info row */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 24, alignItems: "start" }}>
            <TradeFeed curveAddresses={curveAddresses} />

            {/* Market info */}
            <div style={{ background: "#0A1A10", border: "1px solid #2A3D30", borderRadius: 10, padding: 20, fontSize: 11 }}>
              <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.2em", marginBottom: 16 }}>MARKET INFO</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={{ color: "#8A9E92", marginBottom: 2, fontSize: 10 }}>MATCH ID</div>
                  <div style={{ color: "#F0F5F1" }}>{market.matchId}</div>
                </div>
                <div>
                  <div style={{ color: "#8A9E92", marginBottom: 2, fontSize: 10 }}>CONTRACT</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <a href={`https://www.okx.com/web3/explorer/xlayer-test/address/${address}`}
                      target="_blank" rel="noreferrer"
                      style={{ color: "#8A9E92", textDecoration: "none", fontSize: 10 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#00FF6A")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#8A9E92")}>
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </a>
                    <button onClick={() => address && navigator.clipboard.writeText(address)}
                      style={{ background: "none", border: "1px solid #2A3D30", color: "#8A9E92", borderRadius: 3, padding: "1px 6px", fontSize: 9, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
                      COPY
                    </button>
                  </div>
                </div>
                <div>
                  <div style={{ color: "#8A9E92", marginBottom: 2, fontSize: 10 }}>TOTAL POOL</div>
                  <div style={{ color: "#F0F5F1" }}>{market.totalPool} CKUSD</div>
                </div>
                {!isResolved && (
                  <div>
                    <div style={{ color: "#8A9E92", marginBottom: 2, fontSize: 10 }}>RESOLVES AFTER</div>
                    <CountdownTimer targetTime={market.matchTime + 90 * 60} style={{ color: "#F0F5F1" }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
