import Head from "next/head";
import Navbar from "@/components/Navbar";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useIsMobile } from "@/hooks/useIsMobile";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { entries, isLoading } = useLeaderboard();
  const isMobile = useIsMobile();

  return (
    <>
      <Head>
        <title>Leaderboard — CurveKick</title>
      </Head>

      <div style={{ minHeight: "100vh", background: "#050E08", color: "#F0F5F1", fontFamily: "'DM Mono', monospace" }}>
        <Navbar />

        <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "24px 16px" : "40px 24px" }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 36 : 48, color: "#00FF6A", letterSpacing: "0.06em", margin: 0, lineHeight: 1 }}>
              LEADERBOARD
            </h1>
            <p style={{ fontSize: 12, color: "#8A9E92", marginTop: 8 }}>
              Top traders by total CKUSD deployed across all markets
            </p>
          </div>

          {/* Column headers */}
          {!isMobile && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "48px 1fr 140px 140px 80px",
              gap: 12,
              padding: "8px 16px",
              fontSize: 10,
              color: "#8A9E92",
              letterSpacing: "0.12em",
              borderBottom: "1px solid #1A2E22",
              marginBottom: 8,
            }}>
              <span>#</span>
              <span>WALLET</span>
              <span style={{ textAlign: "right" }}>CKUSD DEPLOYED</span>
              <span style={{ textAlign: "right" }}>IN WINNERS</span>
              <span style={{ textAlign: "right" }}>MARKETS</span>
            </div>
          )}

          {/* Rows */}
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: 64, background: "#0A1A10", borderRadius: 8, opacity: 0.5 + i * 0.1 }} />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 24px", color: "#8A9E92", fontSize: 13 }}>
              No trades found yet. Be the first on the board.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {entries.map((entry, idx) => {
                const isTop3 = idx < 3;
                const color = isTop3 ? ["#FFD700", "#C0C0C0", "#CD7F32"][idx] : "#F0F5F1";

                return (
                  <div
                    key={entry.wallet}
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "40px 1fr" : "48px 1fr 140px 140px 80px",
                      gap: 12,
                      alignItems: "center",
                      padding: "14px 16px",
                      background: isTop3 ? `${color}08` : "#0A1A10",
                      border: `1px solid ${isTop3 ? `${color}22` : "#1A2E22"}`,
                      borderRadius: 8,
                    }}
                  >
                    {/* Rank */}
                    <span style={{ fontSize: isTop3 ? 20 : 13, color, fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
                      {isTop3 ? MEDAL[idx] : idx + 1}
                    </span>

                    {/* Wallet + mobile stats */}
                    <div>
                      <div style={{ fontSize: 13, color: "#F0F5F1", letterSpacing: "0.05em" }}>
                        {entry.walletShort}
                      </div>
                      {isMobile && (
                        <div style={{ fontSize: 10, color: "#8A9E92", marginTop: 4, display: "flex", gap: 12 }}>
                          <span><span style={{ color: "#F0F5F1" }}>{entry.totalOkbDeployed.toFixed(4)}</span> CKUSD</span>
                          <span><span style={{ color: "#00FF6A" }}>{entry.okbInWinners.toFixed(4)}</span> won</span>
                          <span>{entry.marketsCount} market{entry.marketsCount !== 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>

                    {/* Desktop columns */}
                    {!isMobile && (
                      <>
                        <span style={{ fontSize: 13, color: "#F0F5F1", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {entry.totalOkbDeployed.toFixed(4)} CKUSD
                        </span>
                        <span style={{ fontSize: 13, color: entry.okbInWinners > 0 ? "#00FF6A" : "#8A9E92", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {entry.okbInWinners > 0 ? `${entry.okbInWinners.toFixed(4)} CKUSD` : "—"}
                        </span>
                        <span style={{ fontSize: 13, color: "#8A9E92", textAlign: "right" }}>
                          {entry.marketsCount}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && entries.length > 0 && (
            <p style={{ fontSize: 10, color: "#8A9E92", textAlign: "center", marginTop: 24 }}>
              Showing top {entries.length} traders · Data from on-chain events
            </p>
          )}
        </div>
      </div>
    </>
  );
}
