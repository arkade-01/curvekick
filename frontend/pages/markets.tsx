import Head from "next/head";
import Navbar from "@/components/Navbar";
import TickerTape from "@/components/TickerTape";
import MatchCard from "@/components/MatchCard";
import { useMarkets } from "@/hooks/useMarkets";
import { useIsMobile } from "@/hooks/useIsMobile";

function LoadingSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ background: "#0A1A10", border: "1px solid #2A3D30", borderRadius: 10, padding: "20px 24px", height: 220, opacity: 0.4, animation: `card-in 0.4s ease-out ${i * 80}ms forwards` }} />
      ))}
    </div>
  );
}

export default function Markets() {
  const { markets, isLoading } = useMarkets();
  const isMobile = useIsMobile();

  const live     = markets.filter(m => m.status === "live");
  const upcoming = markets.filter(m => m.status === "upcoming");
  const resolved = markets.filter(m => m.status === "resolved");

  return (
    <>
      <Head>
        <title>CurveKick — World Cup Prediction Markets</title>
        <meta name="description" content="Trade World Cup match outcomes on bonding curves. Built on X Layer." />
      </Head>

      <div className="scanlines" style={{ minHeight: "100vh", background: "#080C0A" }}>
        <Navbar />
        <TickerTape />

        <main style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "32px 16px" : "48px 24px" }}>
          {/* Hero */}
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 10, color: "#00FF6A", letterSpacing: "0.25em", marginBottom: 10 }}>
              WORLD CUP 2026 · X LAYER
            </div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 44 : 64, letterSpacing: "0.04em", lineHeight: 1, color: "#F0F5F1", marginBottom: 16, margin: "0 0 16px" }}>
              TRADE THE BEAUTIFUL GAME
            </h1>
            <p style={{ fontSize: 13, color: "#8A9E92", maxWidth: 480, lineHeight: 1.7 }}>
              HOME / DRAW / AWAY outcomes trade on bonding curves — every buy moves the price.
              Winners split the entire pool after the final whistle.
            </p>
          </div>

          {isLoading && <LoadingSkeleton />}

          {!isLoading && markets.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 24px", border: "1px dashed #2A3D30", borderRadius: 12 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#2A3D30", marginBottom: 12 }}>NO MARKETS YET</div>
              <div style={{ fontSize: 13, color: "#8A9E92" }}>The admin hasn't created any markets yet.</div>
            </div>
          )}

          {/* Live markets */}
          {live.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFB800", display: "inline-block", animation: "pulse-dot 1.5s ease-in-out infinite" }} />
                <span style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.2em" }}>LIVE MARKETS</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {live.map((m, i) => <MatchCard key={m.address} match={m} index={i} />)}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.2em", marginBottom: 20 }}>
                UPCOMING · {upcoming.length} MATCHES
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {upcoming.map((m, i) => <MatchCard key={m.address} match={m} index={live.length + i} />)}
              </div>
            </section>
          )}

          {/* Resolved */}
          {resolved.length > 0 && (
            <section>
              <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.2em", marginBottom: 20 }}>
                RESOLVED
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {resolved.map((m, i) => <MatchCard key={m.address} match={m} index={live.length + upcoming.length + i} />)}
              </div>
            </section>
          )}
        </main>

        <footer style={{ textAlign: "center", padding: "40px 24px", fontSize: 10, color: "#2A3D30", letterSpacing: "0.15em", borderTop: "1px solid #0A1A10" }}>
          CURVEKICK · BUILT ON X LAYER · #XCUPHACKATHON 2026
        </footer>
      </div>
    </>
  );
}
