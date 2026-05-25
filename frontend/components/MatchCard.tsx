import Link from "next/link";
import type { MarketInfo } from "@/hooks/useMarkets";
import OutcomeBadge from "./OutcomeBadge";
import CountdownTimer from "./CountdownTimer";
import SentimentBar from "./SentimentBar";

interface Props {
  match: MarketInfo;
  index?: number;
}

export default function MatchCard({ match, index = 0 }: Props) {
  const prices = [
    { label: "HOME", price: match.homePrice, color: "#00FF6A" },
    { label: "DRAW", price: match.drawPrice, color: "#FFB800" },
    { label: "AWAY", price: match.awayPrice, color: "#FF3D3D" },
  ];

  return (
    <Link href={`/match/${match.address}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "#0A1A10",
          border: "1px solid #2A3D30",
          borderRadius: 10,
          padding: "20px 24px",
          cursor: "pointer",
          transition: "border-color 0.2s, box-shadow 0.2s",
          opacity: 0,
          animation: `card-in 0.4s ease-out ${index * 80}ms forwards`,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#00FF6A"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 20px #00FF6A18"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#2A3D30"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
      >
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <CountdownTimer targetTime={match.matchTime} style={{ fontSize: 11, color: "#8A9E92" }} />
          <OutcomeBadge status={match.status} result={match.result} />
        </div>

        {/* Teams */}
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "0.05em", color: "#F0F5F1", lineHeight: 1, marginBottom: 16 }}>
          {match.homeTeam}<br />
          <span style={{ fontSize: 16, color: "#8A9E92", letterSpacing: "0.2em" }}>VS</span><br />
          {match.awayTeam}
        </div>

        {/* Sentiment bar */}
        <div style={{ marginBottom: 16 }}>
          <SentimentBar
            home={match.homeSupply}
            draw={match.drawSupply}
            away={match.awaySupply}
          />
        </div>

        {/* Price chips */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {prices.map(p => (
            <div key={p.label} style={{ flex: 1, background: "#080C0A", border: `1px solid ${p.color}33`, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#8A9E92", letterSpacing: "0.15em", marginBottom: 2 }}>{p.label}</div>
              <div style={{ fontSize: 12, color: p.color, fontFamily: "'DM Mono', monospace" }}>{p.price}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #1A2E22" }}>
          <span style={{ fontSize: 11, color: "#8A9E92" }}>
            <span style={{ color: "#F0F5F1" }}>{match.totalPool}</span> CKUSD pool
          </span>
          <span style={{ fontSize: 11, color: "#00FF6A", letterSpacing: "0.1em" }}>TRADE NOW →</span>
        </div>
      </div>
    </Link>
  );
}
