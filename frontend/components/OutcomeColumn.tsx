import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import PriceFlash from "./PriceFlash";
import Sparkline from "./Sparkline";
import BuyPanel from "./BuyPanel";
import SellPanel from "./SellPanel";
import { CURVE_ABI } from "@/lib/contracts";
import type { CurveData } from "@/lib/mockData";

const COLORS = ["#00FF6A", "#FFB800", "#FF3D3D"];
const LABELS = ["HOME", "DRAW", "AWAY"];

interface Props {
  outcome: 0 | 1 | 2;
  data: CurveData;
  isResolved: boolean;
  isWinner: boolean;
  marketAddress: `0x${string}`;
  curveAddress: `0x${string}` | undefined;
}

export default function OutcomeColumn({ outcome, data, isResolved, isWinner, marketAddress, curveAddress }: Props) {
  const [selected, setSelected] = useState(false);
  const [panel, setPanel] = useState<"buy" | "sell" | null>(null);
  const color = COLORS[outcome];
  const label = LABELS[outcome];

  const { address: userAddress } = useAccount();

  const { data: balanceData } = useReadContract({
    address: curveAddress,
    abi: CURVE_ABI,
    functionName: "balanceOf",
    args: [userAddress ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!curveAddress && !!userAddress, refetchInterval: 15_000 },
  });

  const userShares = balanceData ? Number(balanceData as bigint) : 0;

  return (
    <div
      onClick={() => !isResolved && setSelected(s => !s)}
      style={{
        background: "#0A1A10",
        border: `1px solid ${selected || isWinner ? color : "#2A3D30"}`,
        borderRadius: 10,
        padding: 20,
        cursor: isResolved ? "default" : "pointer",
        boxShadow: selected || isWinner ? `0 0 20px ${color}22` : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color, letterSpacing: "0.08em", lineHeight: 1 }}>
          {label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {userShares > 0 && (
            <span style={{ fontSize: 9, color, background: `${color}18`, border: `1px solid ${color}44`, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.1em" }}>
              {userShares} held
            </span>
          )}
          {isWinner && (
            <span style={{ fontSize: 9, color, background: `${color}18`, border: `1px solid ${color}44`, padding: "3px 8px", borderRadius: 4, letterSpacing: "0.15em" }}>
              WINNER
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <PriceFlash
        value={data.currentPrice}
        style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, color: "#F0F5F1", fontWeight: 500, display: "block", marginBottom: 4 }}
      />
      <div style={{ fontSize: 10, color: "#8A9E92", marginBottom: 2 }}>OKB per share</div>

      {/* Change since open */}
      <div style={{ fontSize: 13, color: data.priceChange24h >= 0 ? "#00FF6A" : "#FF3D3D", marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
        {data.priceChange24h >= 0 ? "↑" : "↓"} {Math.abs(data.priceChange24h).toFixed(1)}%
        <span style={{ fontSize: 9, color: "#8A9E92", marginLeft: 6 }}>since open</span>
      </div>

      {/* Sparkline */}
      <div style={{ marginBottom: 16 }}>
        <Sparkline data={data.priceHistory} color={color} width={180} height={40} />
      </div>

      {/* Stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, paddingTop: 12, borderTop: "1px solid #1A2E22", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#8A9E92" }}>Shares issued</span>
          <span style={{ color: "#F0F5F1" }}>{data.totalShares}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#8A9E92" }}>Pool</span>
          <span style={{ color: "#F0F5F1" }}>{data.totalRaised}</span>
        </div>
      </div>

      {/* Buy / Sell buttons */}
      {!isResolved && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={e => { e.stopPropagation(); setPanel(p => p === "buy" ? null : "buy"); }}
            style={{
              flex: 1, padding: "10px 0", fontSize: 12, letterSpacing: "0.1em",
              fontFamily: "'DM Mono', monospace", fontWeight: 500,
              background: panel === "buy" ? `${color}22` : color,
              color: panel === "buy" ? color : "#080C0A",
              border: panel === "buy" ? `1px solid ${color}` : "none",
              borderRadius: 6, cursor: "pointer",
              transition: "transform 0.1s, box-shadow 0.1s",
            }}
            onMouseEnter={e => { (e.currentTarget).style.transform = "scale(1.02)"; (e.currentTarget).style.boxShadow = `0 0 16px ${color}55`; }}
            onMouseLeave={e => { (e.currentTarget).style.transform = "scale(1)"; (e.currentTarget).style.boxShadow = "none"; }}
          >
            {panel === "buy" ? "CANCEL" : `BUY`}
          </button>

          {userShares > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setPanel(p => p === "sell" ? null : "sell"); }}
              style={{
                flex: 1, padding: "10px 0", fontSize: 12, letterSpacing: "0.1em",
                fontFamily: "'DM Mono', monospace", fontWeight: 500,
                background: panel === "sell" ? "#FF3D3D22" : "none",
                color: panel === "sell" ? "#FF3D3D" : "#FF3D3D",
                border: "1px solid #FF3D3D44",
                borderRadius: 6, cursor: "pointer",
                transition: "transform 0.1s, box-shadow 0.1s",
              }}
              onMouseEnter={e => { (e.currentTarget).style.transform = "scale(1.02)"; (e.currentTarget).style.boxShadow = "0 0 16px #FF3D3D33"; }}
              onMouseLeave={e => { (e.currentTarget).style.transform = "scale(1)"; (e.currentTarget).style.boxShadow = "none"; }}
            >
              {panel === "sell" ? "CANCEL" : "SELL"}
            </button>
          )}
        </div>
      )}

      {panel === "buy" && (
        <BuyPanel
          outcome={outcome}
          currentPrice={parseFloat(data.currentPrice)}
          currentSupply={parseInt(data.totalShares) || 0}
          marketAddress={marketAddress}
          curveAddress={curveAddress}
          onClose={() => setPanel(null)}
        />
      )}

      {panel === "sell" && (
        <SellPanel
          outcome={outcome}
          userShares={userShares}
          marketAddress={marketAddress}
          curveAddress={curveAddress}
          onClose={() => setPanel(null)}
        />
      )}
    </div>
  );
}
