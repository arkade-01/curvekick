import { useState } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { MARKET_ABI, CURVE_ABI, type Outcome } from "@/lib/contracts";

const OUTCOME_COLORS: Record<number, string> = { 0: "#00FF6A", 1: "#FFB800", 2: "#FF3D3D" };
const OUTCOME_LABELS = ["HOME", "DRAW", "AWAY"];

interface Props {
  marketAddress: `0x${string}`;
  outcome: Outcome;
  isResolved: boolean;
  winningOutcome: number;
}

export default function OutcomePanel({ marketAddress, outcome, isResolved, winningOutcome }: Props) {
  const [shares, setShares] = useState("1");
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const { address: userAddr } = useAccount();
  const color = OUTCOME_COLORS[outcome];
  const label = OUTCOME_LABELS[outcome];

  // Read curve address
  const { data: curveAddr } = useReadContract({ address: marketAddress, abi: MARKET_ABI, functionName: "curves", args: [BigInt(outcome)] });

  // Read curve stats
  const { data: totalRaised } = useReadContract({ address: curveAddr as `0x${string}`, abi: CURVE_ABI, functionName: "totalRaised", query: { enabled: !!curveAddr } });
  const { data: supply }      = useReadContract({ address: curveAddr as `0x${string}`, abi: CURVE_ABI, functionName: "totalSupply", query: { enabled: !!curveAddr } });
  const { data: userShares }  = useReadContract({ address: curveAddr as `0x${string}`, abi: CURVE_ABI, functionName: "balanceOf", args: [userAddr!], query: { enabled: !!curveAddr && !!userAddr } });

  // Quote for current input
  const sharesNum = Math.max(1, parseInt(shares) || 1);
  const { data: buyCost }    = useReadContract({ address: curveAddr as `0x${string}`, abi: CURVE_ABI, functionName: "getBuyCost",    args: [BigInt(sharesNum)], query: { enabled: !!curveAddr } });
  const { data: sellRefund } = useReadContract({ address: curveAddr as `0x${string}`, abi: CURVE_ABI, functionName: "getSellRefund", args: [BigInt(sharesNum)], query: { enabled: !!curveAddr } });

  // Write
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleBuy = () => {
    if (!buyCost) return;
    const cost = buyCost as bigint;
    const maxCost = cost * 102n / 100n; // 2% slippage
    writeContract({ address: marketAddress, abi: MARKET_ABI, functionName: "buy", args: [outcome, BigInt(sharesNum), maxCost] });
  };

  const handleSell = () => {
    writeContract({ address: marketAddress, abi: MARKET_ABI, functionName: "sell", args: [outcome, BigInt(sharesNum)] });
  };

  const busy = isPending || isConfirming;
  const isWinner = isResolved && winningOutcome === outcome;

  return (
    <div style={{
      background: "#0A1A10",
      border: `1px solid ${isWinner ? color : "#2A3D30"}`,
      borderRadius: 10,
      padding: "20px",
      boxShadow: isWinner ? `0 0 16px ${color}22` : "none",
    }}>
      {/* Label + badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.2em" }}>{label}</span>
        {isWinner && <span style={{ fontSize: 9, color, background: `${color}18`, border: `1px solid ${color}44`, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.15em" }}>WINNER</span>}
      </div>

      {/* Price */}
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, color: "#F0F5F1", fontWeight: 500, marginBottom: 4 }}>
        {buyCost ? Number(formatEther(buyCost as bigint)).toFixed(4) : "—"} CKUSD
      </div>
      <div style={{ fontSize: 10, color: "#8A9E92", marginBottom: 16 }}>
        per share · {supply?.toString() ?? "0"} shares issued
      </div>

      {/* Total raised */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8A9E92", marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #1A2E22" }}>
        <span>Pool</span>
        <span style={{ color: "#F0F5F1" }}>{totalRaised ? Number(formatEther(totalRaised as bigint)).toFixed(4) : "0"} CKUSD</span>
      </div>

      {/* Your shares */}
      {userAddr && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8A9E92", marginBottom: 16 }}>
          <span>Your shares</span>
          <span style={{ color: (userShares as bigint) > 0n ? color : "#8A9E92" }}>{userShares?.toString() ?? "0"}</span>
        </div>
      )}

      {/* Trading controls — hidden after resolution */}
      {!isResolved && (
        <>
          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {(["buy", "sell"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "6px 0", fontSize: 11, letterSpacing: "0.1em",
                fontFamily: "'DM Mono', monospace",
                background: mode === m ? color : "none",
                color: mode === m ? "#080C0A" : "#8A9E92",
                border: `1px solid ${mode === m ? color : "#2A3D30"}`,
                borderRadius: 4, cursor: "pointer",
              }}>{m.toUpperCase()}</button>
            ))}
          </div>

          {/* Shares input */}
          <input
            type="number" min="1" value={shares}
            onChange={e => setShares(e.target.value)}
            style={{
              width: "100%", background: "#080C0A", border: "1px solid #2A3D30",
              borderRadius: 4, color: "#F0F5F1", fontFamily: "'DM Mono', monospace",
              fontSize: 14, padding: "8px 12px", marginBottom: 8, boxSizing: "border-box",
            }}
          />

          {/* Quote */}
          <div style={{ fontSize: 10, color: "#8A9E92", marginBottom: 12, textAlign: "right" }}>
            {mode === "buy"
              ? `Cost: ${buyCost ? Number(formatEther(buyCost as bigint)).toFixed(5) : "—"} CKUSD`
              : `Refund: ${sellRefund ? Number(formatEther(sellRefund as bigint)).toFixed(5) : "—"} CKUSD`}
          </div>

          {/* CTA */}
          <button
            onClick={mode === "buy" ? handleBuy : handleSell}
            disabled={busy || !userAddr}
            style={{
              width: "100%", padding: "10px 0", fontSize: 12, letterSpacing: "0.1em",
              fontFamily: "'DM Mono', monospace", fontWeight: 500,
              background: busy ? "#1A2E22" : mode === "buy" ? color : "none",
              color: busy ? "#8A9E92" : mode === "buy" ? "#080C0A" : color,
              border: `1px solid ${busy ? "#2A3D30" : color}`,
              borderRadius: 6, cursor: busy || !userAddr ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "CONFIRMING..." : isSuccess ? "DONE ✓" : `${mode.toUpperCase()} ${label}`}
          </button>
        </>
      )}
    </div>
  );
}
