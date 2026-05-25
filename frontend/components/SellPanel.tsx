import { useState } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MARKET_ABI, CURVE_ABI } from "@/lib/contracts";

const OUTCOME_COLORS = ["#00FF6A", "#FFB800", "#FF3D3D"];
const OUTCOME_LABELS = ["HOME", "DRAW", "AWAY"];

interface Props {
  outcome: 0 | 1 | 2;
  userShares: number;
  marketAddress: `0x${string}`;
  curveAddress: `0x${string}` | undefined;
  onClose: () => void;
}

export default function SellPanel({ outcome, userShares, marketAddress, curveAddress, onClose }: Props) {
  const [shares, setShares] = useState(String(Math.min(userShares, 5)));
  const color = OUTCOME_COLORS[outcome];
  const label = OUTCOME_LABELS[outcome];

  const sharesBn = BigInt(Math.max(0, parseInt(shares) || 0));
  const exceeds  = sharesBn > BigInt(userShares);

  const { data: refundData } = useReadContract({
    address: curveAddress,
    abi: CURVE_ABI,
    functionName: "getSellRefund",
    args: [sharesBn],
    query: { enabled: !!curveAddress && sharesBn > 0n && !exceeds },
  });

  const refundWei  = refundData as bigint | undefined;
  const refundOkb  = refundWei ? Number(refundWei) / 1e18 : null;

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const canSell = sharesBn > 0n && !exceeds && !isPending && !isConfirming;

  function handleSell() {
    writeContract({
      address: marketAddress,
      abi: MARKET_ABI,
      functionName: "sell",
      args: [outcome, sharesBn],
    });
  }

  if (isSuccess) {
    return (
      <div style={{ background: "#0A1A10", border: `1px solid ${color}44`, borderRadius: 10, padding: 20, marginTop: 12, textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
        <div style={{ fontSize: 12, color, letterSpacing: "0.1em", marginBottom: 8 }}>SELL CONFIRMED</div>
        <div style={{ fontSize: 11, color: "#8A9E92", marginBottom: 16 }}>{shares} {label} shares sold</div>
        <button onClick={() => { reset(); onClose(); }} style={{ background: "none", border: `1px solid ${color}44`, color, borderRadius: 4, padding: "6px 20px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>CLOSE</button>
      </div>
    );
  }

  return (
    <div style={{ background: "#0A1A10", border: `1px solid ${color}44`, borderRadius: 10, padding: 20, marginTop: 12 }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 11, color, letterSpacing: "0.15em" }}>SELL {label}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A9E92", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
      </div>

      {/* Balance */}
      <div style={{ fontSize: 10, color: "#8A9E92", marginBottom: 10 }}>
        You hold <span style={{ color: "#F0F5F1" }}>{userShares}</span> {label} shares
      </div>

      {/* Shares input */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.15em", marginBottom: 6 }}>SHARES TO SELL</div>
        <input
          type="number" min="1" max={userShares} step="1" value={shares}
          onChange={e => setShares(e.target.value)}
          style={{ width: "100%", background: "#080C0A", border: `1px solid ${exceeds ? "#FF3D3D" : "#2A3D30"}`, borderRadius: 4, color: "#F0F5F1", fontFamily: "'DM Mono', monospace", fontSize: 18, padding: "10px 12px", boxSizing: "border-box" }}
        />
      </div>

      {/* Quick amounts */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[25, 50, 75, 100].map(pct => {
          const v = Math.max(1, Math.round(userShares * pct / 100));
          const label2 = pct === 100 ? "MAX" : `${pct}%`;
          return (
            <button key={pct} onClick={() => setShares(String(v))} style={{ flex: 1, padding: "4px 0", fontSize: 10, fontFamily: "'DM Mono', monospace", background: shares === String(v) ? color : "none", color: shares === String(v) ? "#080C0A" : "#8A9E92", border: `1px solid ${shares === String(v) ? color : "#2A3D30"}`, borderRadius: 4, cursor: "pointer" }}>
              {label2}
            </button>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ background: "#080C0A", borderRadius: 6, padding: "12px", marginBottom: 14, fontSize: 11, display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#8A9E92" }}>You receive</span>
          <span style={{ color: "#F0F5F1" }}>{refundOkb !== null ? refundOkb.toFixed(5) + " CKUSD" : sharesBn > 0n && !exceeds ? "..." : "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#8A9E92" }}>Shares remaining</span>
          <span style={{ color: "#F0F5F1" }}>{exceeds ? "—" : userShares - (parseInt(shares) || 0)}</span>
        </div>
      </div>

      {exceeds && (
        <div style={{ fontSize: 10, color: "#FF3D3D", background: "#FF3D3D10", border: "1px solid #FF3D3D30", borderRadius: 4, padding: "6px 10px", marginBottom: 12 }}>
          You only have {userShares} shares
        </div>
      )}

      {writeError && (
        <div style={{ fontSize: 10, color: "#FF3D3D", background: "#FF3D3D10", border: "1px solid #FF3D3D30", borderRadius: 4, padding: "6px 10px", marginBottom: 12, wordBreak: "break-all" }}>
          {writeError.message.slice(0, 140)}
        </div>
      )}

      <button
        disabled={!canSell}
        onClick={handleSell}
        style={{
          width: "100%", padding: "12px 0", fontSize: 13, letterSpacing: "0.1em",
          fontFamily: "'DM Mono', monospace", fontWeight: 500,
          background: !canSell ? "#1A2E22" : "#FF3D3D22",
          color: !canSell ? "#8A9E92" : "#FF3D3D",
          border: !canSell ? "none" : "1px solid #FF3D3D44",
          borderRadius: 6, cursor: !canSell ? "not-allowed" : "pointer",
          transition: "transform 0.1s, box-shadow 0.1s",
        }}
        onMouseEnter={e => { if (canSell) { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px #FF3D3D33"; }}}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
      >
        {isPending || isConfirming ? "CONFIRMING..." : `CONFIRM SELL ${label}`}
      </button>
    </div>
  );
}
