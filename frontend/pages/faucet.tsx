import Head from "next/head";
import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import Navbar from "@/components/Navbar";
import { TOKEN_ABI, TOKEN_ADDRESS, TOKEN_SYMBOL } from "@/lib/contracts";
import { useIsMobile } from "@/hooks/useIsMobile";

const FAUCET_AMOUNT = 1_000;
const COOLDOWN_HOURS = 24;

export default function FaucetPage() {
  const { authenticated, login } = usePrivy();
  const { address: userAddress } = useAccount();
  const isMobile = useIsMobile();

  const { data: nextClaim, refetch: refetchNext } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: "nextClaimTime",
    args: [userAddress ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!userAddress, refetchInterval: 10_000 },
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: "balanceOf",
    args: [userAddress ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!userAddress, refetchInterval: 15_000 },
  });

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const nextClaimTs   = nextClaim ? Number(nextClaim as bigint) : 0;
  const now           = Math.floor(Date.now() / 1000);
  const onCooldown    = nextClaimTs > now;
  const cooldownMins  = onCooldown ? Math.ceil((nextClaimTs - now) / 60) : 0;
  const balanceNum    = balance ? Number(balance as bigint) / 1e18 : 0;

  function handleClaim() {
    writeContract({ address: TOKEN_ADDRESS, abi: TOKEN_ABI, functionName: "faucet" });
  }

  if (isSuccess) {
    refetchBalance();
    refetchNext();
  }

  return (
    <>
      <Head>
        <title>Faucet — CurveKick</title>
      </Head>

      <div style={{ minHeight: "100vh", background: "#050E08", color: "#F0F5F1", fontFamily: "'DM Mono', monospace" }}>
        <Navbar />

        <div style={{ maxWidth: 520, margin: isMobile ? "32px auto" : "60px auto", padding: "0 20px" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 10, color: "#00FF6A", letterSpacing: "0.3em", marginBottom: 12 }}>TESTNET</div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 40 : 52, letterSpacing: "0.05em", color: "#F0F5F1", margin: "0 0 12px", lineHeight: 1 }}>
              {TOKEN_SYMBOL} FAUCET
            </h1>
            <p style={{ fontSize: 13, color: "#8A9E92", lineHeight: 1.7, margin: 0 }}>
              Claim {FAUCET_AMOUNT} {TOKEN_SYMBOL} every {COOLDOWN_HOURS} hours to test CurveKick on testnet.
              {TOKEN_SYMBOL} has no real value — it&apos;s for testing only.
            </p>
          </div>

          {/* Card */}
          <div style={{ background: "#0A1A10", border: "1px solid #1A2E22", borderRadius: 12, padding: 32 }}>

            {!authenticated ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#8A9E92", marginBottom: 24 }}>
                  Connect your wallet to claim testnet {TOKEN_SYMBOL}.
                </p>
                <button
                  onClick={login}
                  style={{ background: "#00FF6A", color: "#080C0A", border: "none", borderRadius: 8, padding: "14px 40px", fontSize: 13, fontFamily: "'DM Mono', monospace", fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer" }}
                >
                  CONNECT WALLET
                </button>
              </div>
            ) : (
              <>
                {/* Balance */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #1A2E22" }}>
                  <span style={{ fontSize: 11, color: "#8A9E92", letterSpacing: "0.15em" }}>YOUR BALANCE</span>
                  <span style={{ fontSize: 20, color: "#F0F5F1", fontWeight: 500 }}>
                    {balanceNum.toFixed(2)} <span style={{ color: "#00FF6A" }}>{TOKEN_SYMBOL}</span>
                  </span>
                </div>

                {/* Claim amount */}
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: 48, fontFamily: "'Bebas Neue', sans-serif", color: "#00FF6A", letterSpacing: "0.05em", lineHeight: 1 }}>
                    {FAUCET_AMOUNT}
                  </div>
                  <div style={{ fontSize: 12, color: "#8A9E92", letterSpacing: "0.2em", marginTop: 4 }}>
                    {TOKEN_SYMBOL} PER CLAIM
                  </div>
                </div>

                {/* Success */}
                {isSuccess && (
                  <div style={{ background: "#00FF6A10", border: "1px solid #00FF6A30", borderRadius: 8, padding: "12px 16px", marginBottom: 16, textAlign: "center", fontSize: 12, color: "#00FF6A", letterSpacing: "0.1em" }}>
                    ✓ {FAUCET_AMOUNT} {TOKEN_SYMBOL} sent to your wallet
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div style={{ background: "#FF3D3D10", border: "1px solid #FF3D3D30", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 10, color: "#FF3D3D", wordBreak: "break-all" }}>
                    {error.message.slice(0, 200)}
                  </div>
                )}

                {/* Cooldown notice */}
                {onCooldown && (
                  <div style={{ background: "#FFB80010", border: "1px solid #FFB80030", borderRadius: 8, padding: "12px 16px", marginBottom: 16, textAlign: "center", fontSize: 12, color: "#FFB800" }}>
                    Next claim in {cooldownMins >= 60 ? `${Math.floor(cooldownMins / 60)}h ${cooldownMins % 60}m` : `${cooldownMins}m`}
                  </div>
                )}

                <button
                  disabled={onCooldown || isPending || isConfirming}
                  onClick={isSuccess ? () => { reset(); } : handleClaim}
                  style={{
                    width: "100%", padding: "14px 0", fontSize: 14, letterSpacing: "0.1em",
                    fontFamily: "'DM Mono', monospace", fontWeight: 600,
                    background: onCooldown || isPending || isConfirming ? "#1A2E22" : "#00FF6A",
                    color: onCooldown || isPending || isConfirming ? "#8A9E92" : "#080C0A",
                    border: "none", borderRadius: 8,
                    cursor: onCooldown || isPending || isConfirming ? "not-allowed" : "pointer",
                    boxShadow: onCooldown || isPending || isConfirming ? "none" : "0 0 24px #00FF6A33",
                  }}
                >
                  {isPending || isConfirming ? "CLAIMING..." : onCooldown ? "COOLDOWN ACTIVE" : `CLAIM ${FAUCET_AMOUNT} ${TOKEN_SYMBOL}`}
                </button>

                <p style={{ fontSize: 10, color: "#2A3D30", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
                  One claim per address per {COOLDOWN_HOURS} hours · Testnet only
                </p>
              </>
            )}
          </div>

          {/* OKB gas faucet */}
          <div style={{ marginTop: 20, padding: "14px 18px", background: "#080C0A", border: "1px solid #1A2E22", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.15em", marginBottom: 4 }}>NEED GAS?</div>
              <div style={{ fontSize: 12, color: "#8A9E92", lineHeight: 1.5 }}>
                You also need a small amount of <span style={{ color: "#F0F5F1" }}>OKB</span> to pay transaction fees on X Layer.
              </div>
            </div>
            <a
              href="https://web3.okx.com/xlayer/faucet"
              target="_blank"
              rel="noreferrer"
              style={{
                flexShrink: 0, padding: "9px 16px", fontSize: 11,
                fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", fontWeight: 500,
                background: "transparent", color: "#00FF6A",
                border: "1px solid #00FF6A44", borderRadius: 6,
                textDecoration: "none", whiteSpace: "nowrap",
              }}
            >
              GET OKB →
            </a>
          </div>

          {/* Instructions */}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["1", "Claim CKUSD from the faucet above"],
              ["2", "Go to Markets and pick a match"],
              ["3", "Buy shares — approve CKUSD first, then buy"],
              ["4", "Wait for the match result and claim winnings"],
            ].map(([n, text]) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: "#080C0A", borderRadius: 8, border: "1px solid #0D1F10" }}>
                <span style={{ fontSize: 18, fontFamily: "'Bebas Neue', sans-serif", color: "#2A3D30", minWidth: 20 }}>{n}</span>
                <span style={{ fontSize: 12, color: "#8A9E92" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
