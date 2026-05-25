import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import Navbar from "@/components/Navbar";
import { MARKET_ABI } from "@/lib/contracts";
import { usePortfolio } from "@/hooks/usePortfolio";
import type { Position } from "@/hooks/usePortfolio";
import { useIsMobile } from "@/hooks/useIsMobile";

const OUTCOME_COLORS = ["#00FF6A", "#FFB800", "#FF3D3D"];
const OUTCOME_LABELS = ["HOME", "DRAW", "AWAY"];

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(id); }
      else setValue(start);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return value;
}

function ClaimButton({ marketAddress }: { marketAddress: `0x${string}` }) {
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  if (isSuccess) {
    return <span style={{ fontSize: 11, color: "#00FF6A", letterSpacing: "0.1em" }}>CLAIMED ✓</span>;
  }

  return (
    <button
      disabled={isPending || isConfirming}
      onClick={() => writeContract({ address: marketAddress, abi: MARKET_ABI, functionName: "claim" })}
      style={{
        background: isPending || isConfirming ? "#2A3D30" : "#FFB800",
        color: isPending || isConfirming ? "#8A9E92" : "#080C0A",
        border: "none", borderRadius: 6,
        padding: "8px 20px", fontSize: 11, fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.1em", fontWeight: 500,
        cursor: isPending || isConfirming ? "not-allowed" : "pointer",
        boxShadow: isPending || isConfirming ? "none" : "0 0 12px #FFB80044",
      }}
    >
      {isPending || isConfirming ? "CLAIMING..." : "CLAIM WINNINGS"}
    </button>
  );
}

function PositionCard({ pos, index, isMobile }: { pos: Position; index: number; isMobile: boolean }) {
  const animatedValue = useCountUp(pos.currentValue);
  const animatedPnl   = useCountUp(Math.abs(pos.pnl ?? 0));
  const color = OUTCOME_COLORS[pos.outcome];

  const pnlColor   = pos.pnl === null ? "#8A9E92" : pos.pnl >= 0 ? "#00FF6A" : "#FF3D3D";
  const pnlPrefix  = pos.pnl === null ? "" : pos.pnl >= 0 ? "+" : "−";
  const pnlDisplay = pos.pnl === null
    ? "..."
    : `${pnlPrefix}${animatedPnl.toFixed(4)} CKUSD (${pnlPrefix}${Math.abs(pos.pnlPct ?? 0).toFixed(1)}%)`;

  return (
    <div style={{
      background: "#0A1A10",
      border: `1px solid ${pos.pnl !== null && pos.pnl >= 0 ? "#2A3D30" : pos.pnl !== null ? "#3D2020" : "#2A3D30"}`,
      borderRadius: 10, padding: "20px 24px",
      opacity: 0, animation: `card-in 0.4s ease-out ${index * 80}ms forwards`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.15em", marginBottom: 6 }}>{pos.market.matchId}</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#F0F5F1", lineHeight: 1 }}>
            {pos.market.homeTeam} vs {pos.market.awayTeam}
          </div>
        </div>
        <span style={{ fontSize: 10, color, background: `${color}18`, border: `1px solid ${color}44`, padding: "3px 10px", borderRadius: 4, letterSpacing: "0.15em" }}>
          {OUTCOME_LABELS[pos.outcome]}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: "#8A9E92", letterSpacing: "0.15em", marginBottom: 4 }}>SHARES</div>
          <div style={{ fontSize: 12, color: "#F0F5F1", fontFamily: "'DM Mono', monospace" }}>{pos.shares}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#8A9E92", letterSpacing: "0.15em", marginBottom: 4 }}>CURRENT VALUE</div>
          <div style={{ fontSize: 12, color: "#F0F5F1", fontFamily: "'DM Mono', monospace" }}>{animatedValue.toFixed(4)} CKUSD</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#8A9E92", letterSpacing: "0.15em", marginBottom: 4 }}>AMOUNT SPENT</div>
          <div style={{ fontSize: 12, color: "#8A9E92", fontFamily: "'DM Mono', monospace" }}>
            {pos.netInvested !== null ? pos.netInvested.toFixed(4) + " CKUSD" : "..."}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#8A9E92", letterSpacing: "0.15em", marginBottom: 4 }}>P&amp;L</div>
          <div style={{ fontSize: 12, color: pnlColor, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
            {pnlDisplay}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #1A2E22" }}>
        <Link href={`/match/${pos.market.address}`} style={{ fontSize: 11, color: "#8A9E92", textDecoration: "none", letterSpacing: "0.1em" }}>
          VIEW MARKET →
        </Link>
        {pos.claimable && <ClaimButton marketAddress={pos.market.address} />}
      </div>
    </div>
  );
}

export default function Portfolio() {
  const { isConnected } = useAccount();
  const { positions, isLoading } = usePortfolio();
  const isMobile = useIsMobile();

  const totalValue    = positions.reduce((acc, p) => acc + p.currentValue, 0);
  const totalInvested = positions.every(p => p.netInvested !== null)
    ? positions.reduce((acc, p) => acc + (p.netInvested ?? 0), 0)
    : null;
  const totalPnl      = totalInvested !== null ? totalValue - totalInvested : null;
  const claimableCount = positions.filter(p => p.claimable).length;

  return (
    <>
      <Head><title>Portfolio — CurveKick</title></Head>
      <div style={{ minHeight: "100vh", background: "#080C0A" }}>
        <Navbar />
        <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.2em", marginBottom: 8 }}>MY PORTFOLIO</div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "#F0F5F1", margin: 0, letterSpacing: "0.04em" }}>
              OPEN POSITIONS
            </h1>
          </div>

          {!isConnected ? (
            <div style={{ textAlign: "center", padding: "80px 24px", border: "1px dashed #2A3D30", borderRadius: 12 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#2A3D30", marginBottom: 12 }}>WALLET NOT CONNECTED</div>
              <div style={{ fontSize: 13, color: "#8A9E92" }}>Connect your wallet to see your positions</div>
            </div>
          ) : isLoading ? (
            <div style={{ textAlign: "center", padding: "40px 24px", color: "#8A9E92", fontSize: 13 }}>Loading positions...</div>
          ) : (
            <>
              {/* Summary */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}>
                {[
                  { label: "OPEN POSITIONS", value: String(positions.length), color: "#F0F5F1" },
                  { label: "TOTAL VALUE",    value: totalValue.toFixed(4) + " CKUSD", color: "#F0F5F1" },
                  {
                    label: "TOTAL P&L",
                    value: totalPnl === null ? "..." : `${totalPnl >= 0 ? "+" : "−"}${Math.abs(totalPnl).toFixed(4)} CKUSD`,
                    color: totalPnl === null ? "#8A9E92" : totalPnl >= 0 ? "#00FF6A" : "#FF3D3D",
                  },
                  { label: "CLAIMABLE", value: claimableCount + " markets", color: "#F0F5F1" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#0A1A10", border: "1px solid #2A3D30", borderRadius: 8, padding: "16px 20px" }}>
                    <div style={{ fontSize: 9, color: "#8A9E92", letterSpacing: "0.2em", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {positions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 24px", border: "1px dashed #2A3D30", borderRadius: 12 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#2A3D30", marginBottom: 12 }}>NO POSITIONS YET</div>
                  <div style={{ fontSize: 13, color: "#8A9E92", marginBottom: 24 }}>Pick a match and start trading</div>
                  <Link href="/" style={{ color: "#00FF6A", fontSize: 12, letterSpacing: "0.15em", textDecoration: "none" }}>BROWSE MARKETS →</Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {positions.map((pos, i) => <PositionCard key={pos.market.address + pos.outcome} pos={pos} index={i} isMobile={isMobile} />)}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
