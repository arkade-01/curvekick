import { useState } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { MARKET_ABI, CURVE_ABI, TOKEN_ABI, TOKEN_ADDRESS, BASE_PRICE, SLOPE, estimateSharesFromAmount, TOKEN_SYMBOL } from "@/lib/contracts";

const OUTCOME_COLORS = ["#00FF6A", "#FFB800", "#FF3D3D"];
const OUTCOME_LABELS = ["HOME", "DRAW", "AWAY"];
const SLIPPAGE_OPTIONS = ["0.5", "1", "2", "5"];

interface Props {
  outcome: 0 | 1 | 2;
  currentPrice: number;
  currentSupply: number;
  marketAddress: `0x${string}`;
  curveAddress: `0x${string}` | undefined;
  onClose: () => void;
}

export default function BuyPanel({ outcome, currentPrice, currentSupply, marketAddress, curveAddress, onClose }: Props) {
  const [amount, setAmount] = useState("10");
  const [slippage, setSlippage] = useState("1");
  const [step, setStep] = useState<"idle" | "approving" | "buying">("idle");

  const color = OUTCOME_COLORS[outcome];
  const label = OUTCOME_LABELS[outcome];
  const { address: userAddress } = useAccount();

  const amountNum = parseFloat(amount) || 0;
  const estimatedShares = amountNum > 0 ? estimateSharesFromAmount(amountNum, currentSupply) : 0;
  const sharesBn = BigInt(estimatedShares);

  const { data: buyCost } = useReadContract({
    address: curveAddress,
    abi: CURVE_ABI,
    functionName: "getBuyCost",
    args: [sharesBn],
    query: { enabled: !!curveAddress && sharesBn > 0n },
  });

  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: "allowance",
    args: [userAddress ?? "0x0000000000000000000000000000000000000000", marketAddress],
    query: { enabled: !!userAddress },
  });

  const exactCostWei  = buyCost as bigint | undefined;
  const exactCostNum  = exactCostWei ? Number(exactCostWei) / 1e18 : null;
  const allowance     = (allowanceData as bigint | undefined) ?? 0n;
  const slippageMul   = 1 + parseFloat(slippage) / 100;
  const maxCostWei    = exactCostWei ? BigInt(Math.ceil(Number(exactCostWei) * slippageMul)) : undefined;
  const needsApproval = maxCostWei !== undefined && allowance < maxCostWei;

  const newPrice    = currentPrice + SLOPE * estimatedShares;
  const priceImpact = currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice) * 100 : 0;

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const canProceed = estimatedShares > 0 && !!maxCostWei && !isPending && !isConfirming;

  async function handleApprove() {
    if (!maxCostWei) return;
    setStep("approving");
    writeContract({
      address: TOKEN_ADDRESS,
      abi: TOKEN_ABI,
      functionName: "approve",
      args: [marketAddress, maxCostWei],
    });
  }

  function handleBuy() {
    if (!maxCostWei) return;
    setStep("buying");
    writeContract({
      address: marketAddress,
      abi: MARKET_ABI,
      functionName: "buy",
      args: [outcome, sharesBn, maxCostWei],
    });
  }

  // After approval confirms, refetch allowance so UI moves to buy step
  if (isSuccess && step === "approving") {
    refetchAllowance();
    reset();
    setStep("idle");
  }

  if (isSuccess && step === "buying") {
    return (
      <div style={{ background: "#0A1A10", border: `1px solid ${color}44`, borderRadius: 10, padding: 20, marginTop: 12, textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
        <div style={{ fontSize: 12, color, letterSpacing: "0.1em", marginBottom: 8 }}>BUY CONFIRMED</div>
        <div style={{ fontSize: 11, color: "#8A9E92", marginBottom: 16 }}>{estimatedShares} {label} shares purchased</div>
        <button onClick={() => { reset(); onClose(); }} style={{ background: "none", border: `1px solid ${color}44`, color, borderRadius: 4, padding: "6px 20px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>CLOSE</button>
      </div>
    );
  }

  return (
    <div style={{ background: "#0A1A10", border: `1px solid ${color}44`, borderRadius: 10, padding: 20, marginTop: 12 }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 11, color, letterSpacing: "0.15em" }}>BUY {label}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A9E92", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
      </div>

      {/* Amount input */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.15em", marginBottom: 6 }}>AMOUNT ({TOKEN_SYMBOL})</div>
        <div style={{ position: "relative" }}>
          <input
            type="number" min="0" step="1" value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: "100%", background: "#080C0A", border: "1px solid #2A3D30", borderRadius: 4, color: "#F0F5F1", fontFamily: "'DM Mono', monospace", fontSize: 18, padding: "10px 64px 10px 12px", boxSizing: "border-box" }}
          />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#8A9E92" }}>{TOKEN_SYMBOL}</span>
        </div>
      </div>

      {/* Quick amounts */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["5", "10", "25", "50"].map(v => (
          <button key={v} onClick={() => setAmount(v)} style={{ flex: 1, padding: "4px 0", fontSize: 10, fontFamily: "'DM Mono', monospace", background: amount === v ? color : "none", color: amount === v ? "#080C0A" : "#8A9E92", border: `1px solid ${amount === v ? color : "#2A3D30"}`, borderRadius: 4, cursor: "pointer" }}>
            {v}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ background: "#080C0A", borderRadius: 6, padding: "12px", marginBottom: 12, fontSize: 11, display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#8A9E92" }}>Est. shares</span>
          <span style={{ color: "#F0F5F1" }}>{estimatedShares}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#8A9E92" }}>Exact cost</span>
          <span style={{ color: "#F0F5F1" }}>{exactCostNum !== null ? exactCostNum.toFixed(4) + ` ${TOKEN_SYMBOL}` : estimatedShares > 0 ? "..." : "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#8A9E92" }}>New price</span>
          <span style={{ color: "#F0F5F1" }}>{estimatedShares > 0 ? newPrice.toFixed(4) + ` ${TOKEN_SYMBOL}` : "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#8A9E92" }}>Price impact</span>
          <span style={{ color: priceImpact > 5 ? "#FFB800" : "#F0F5F1" }}>
            {estimatedShares > 0 ? `${priceImpact > 5 ? "⚠ " : ""}${priceImpact.toFixed(2)}%` : "—"}
          </span>
        </div>
      </div>

      {priceImpact > 5 && estimatedShares > 0 && (
        <div style={{ fontSize: 10, color: "#FFB800", background: "#FFB80010", border: "1px solid #FFB80030", borderRadius: 4, padding: "6px 10px", marginBottom: 12 }}>
          ⚠ High price impact — consider buying fewer shares
        </div>
      )}

      {/* Slippage */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.12em", marginBottom: 6 }}>SLIPPAGE TOLERANCE</div>
        <div style={{ display: "flex", gap: 6 }}>
          {SLIPPAGE_OPTIONS.map(s => (
            <button key={s} onClick={() => setSlippage(s)} style={{ flex: 1, padding: "4px 0", fontSize: 10, fontFamily: "'DM Mono', monospace", background: slippage === s ? "#2A3D30" : "none", color: slippage === s ? "#F0F5F1" : "#8A9E92", border: `1px solid ${slippage === s ? "#8A9E92" : "#2A3D30"}`, borderRadius: 4, cursor: "pointer" }}>
              {s}%
            </button>
          ))}
        </div>
      </div>

      {writeError && (
        <div style={{ fontSize: 10, color: "#FF3D3D", background: "#FF3D3D10", border: "1px solid #FF3D3D30", borderRadius: 4, padding: "6px 10px", marginBottom: 12, wordBreak: "break-all" }}>
          {writeError.message.slice(0, 140)}
        </div>
      )}

      {/* Two-step: Approve then Buy */}
      {needsApproval ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 10, color: "#8A9E92", textAlign: "center" }}>
            Step 1 of 2 — approve {TOKEN_SYMBOL} spend
          </div>
          <button
            disabled={!canProceed}
            onClick={handleApprove}
            style={{ width: "100%", padding: "12px 0", fontSize: 13, letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace", fontWeight: 500, background: !canProceed ? "#1A2E22" : "#FFB800", color: !canProceed ? "#8A9E92" : "#080C0A", border: "none", borderRadius: 6, cursor: !canProceed ? "not-allowed" : "pointer" }}
          >
            {isPending || isConfirming ? "APPROVING..." : `APPROVE ${TOKEN_SYMBOL}`}
          </button>
        </div>
      ) : (
        <button
          disabled={!canProceed}
          onClick={handleBuy}
          style={{ width: "100%", padding: "12px 0", fontSize: 13, letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace", fontWeight: 500, background: !canProceed ? "#1A2E22" : color, color: !canProceed ? "#8A9E92" : "#080C0A", border: "none", borderRadius: 6, cursor: !canProceed ? "not-allowed" : "pointer" }}
          onMouseEnter={e => { if (canProceed) { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 16px ${color}55`; }}}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
        >
          {isPending || isConfirming ? "CONFIRMING..." : `CONFIRM BUY ${label}`}
        </button>
      )}
    </div>
  );
}
