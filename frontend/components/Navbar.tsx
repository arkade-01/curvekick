import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { usePrivy } from "@privy-io/react-auth";
import { useReadContract, useAccount } from "wagmi";
import { FACTORY_ADDRESS, FACTORY_ABI, TOKEN_ADDRESS, TOKEN_ABI, TOKEN_SYMBOL } from "@/lib/contracts";
import { useIsMobile } from "@/hooks/useIsMobile";

function WalletWidget() {
  const { login, logout, authenticated, ready, user } = usePrivy();
  const { address: userAddress } = useAccount();
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

  const { data: balance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: "balanceOf",
    args: [userAddress ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!userAddress, refetchInterval: 15_000 },
  });

  if (!ready) return null;

  if (!authenticated) {
    return (
      <button
        onClick={login}
        style={{
          background: "#00FF6A", color: "#080C0A", border: "none",
          borderRadius: 6, padding: isMobile ? "8px 14px" : "8px 20px",
          fontSize: 11, fontFamily: "'DM Mono', monospace",
          fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer",
        }}
      >
        CONNECT
      </button>
    );
  }

  const addr = user?.wallet?.address ?? "";
  const short = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Connected";
  const balNum = balance ? (Number(balance as bigint) / 1e18).toFixed(2) : "—";

  function copyAddress() {
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {/* Balance chip — hidden on mobile */}
      {!isMobile && (
        <div style={{
          background: "#0A1A10", border: "1px solid #2A3D30", borderRadius: 6,
          padding: "5px 10px", display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 10, color: "#8A9E92", fontFamily: "'DM Mono', monospace" }}>{TOKEN_SYMBOL}</span>
          <span style={{ fontSize: 11, color: "#00FF6A", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{balNum}</span>
        </div>
      )}

      {/* Address + copy */}
      <button
        onClick={copyAddress}
        title={copied ? "Copied!" : addr}
        style={{
          background: "#0A1A10", border: "1px solid #2A3D30", borderRadius: 6,
          padding: "5px 10px", display: "flex", alignItems: "center", gap: 6,
          cursor: "pointer", fontFamily: "'DM Mono', monospace",
        }}
      >
        <span style={{ fontSize: 11, color: copied ? "#00FF6A" : "#F0F5F1", letterSpacing: "0.05em" }}>
          {copied ? "COPIED ✓" : short}
        </span>
        {!copied && !isMobile && (
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="#8A9E92" strokeWidth="1.5"/>
            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="#8A9E92" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* Disconnect */}
      <button
        onClick={logout}
        style={{
          background: "none", color: "#8A9E92",
          border: "1px solid #2A3D30", borderRadius: 6,
          padding: "5px 10px", fontSize: 10,
          fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em",
          cursor: "pointer",
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default function Navbar() {
  const router = useRouter();
  const { address: userAddress } = useAccount();
  const isMobile = useIsMobile();

  const { data: adminAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "admin",
  });

  const isAdmin = !!userAddress && !!adminAddress &&
    userAddress.toLowerCase() === (adminAddress as string).toLowerCase();

  const navLinks: [string, string][] = [
    ["/markets", "MARKETS"],
    ["/portfolio", "PORTFOLIO"],
    ["/leaderboard", "LEADERS"],
    ["/faucet", "FAUCET"],
    ...(isAdmin ? [["/admin", "ADMIN"]] as [string, string][] : []),
  ];

  const logo = (
    <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#1A3D28"/>
        <path d="M6 30 Q12 28 18 20 Q24 12 34 10" stroke="#00FF6A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <circle cx="34" cy="10" r="3.5" fill="#00FF6A"/>
        <line x1="6" y1="10" x2="6" y2="34" stroke="#2A3D30" strokeWidth="0.5"/>
        <line x1="6" y1="34" x2="34" y2="34" stroke="#2A3D30" strokeWidth="0.5"/>
      </svg>
      <div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 18 : 20, letterSpacing: "0.08em", color: "#F0F5F1", lineHeight: 1 }}>CURVEKICK</div>
        {!isMobile && <div style={{ fontSize: 8, color: "#00FF6A", letterSpacing: "0.2em" }}>PREDICTION MARKETS</div>}
      </div>
    </Link>
  );

  if (isMobile) {
    return (
      <nav style={{ borderBottom: "1px solid #2A3D30", background: "#080C0A" }}>
        {/* Top row: logo + wallet */}
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {logo}
          <WalletWidget />
        </div>
        {/* Bottom row: nav links, scrollable */}
        <div style={{ display: "flex", overflowX: "auto", borderTop: "1px solid #1A2E22", scrollbarWidth: "none" }}>
          {navLinks.map(([href, label]) => (
            <Link key={href} href={href} style={{
              flexShrink: 0,
              padding: "10px 16px",
              fontSize: 10, letterSpacing: "0.14em", fontFamily: "'DM Mono', monospace",
              color: router.pathname === href ? "#00FF6A" : "#8A9E92",
              textDecoration: "none",
              borderBottom: router.pathname === href ? "2px solid #00FF6A" : "2px solid transparent",
              whiteSpace: "nowrap",
            }}>
              {label}
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav style={{ borderBottom: "1px solid #2A3D30", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#080C0A" }}>
      {logo}

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {navLinks.map(([href, label]) => (
          <Link key={href} href={href} style={{
            fontSize: 11, letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace",
            color: router.pathname === href ? "#00FF6A" : "#8A9E92",
            textDecoration: "none",
            borderBottom: router.pathname === href ? "1px solid #00FF6A" : "1px solid transparent",
            paddingBottom: 2,
          }}>
            {label}
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 9, color: "#2A3D30", letterSpacing: "0.15em" }}>X LAYER TESTNET</span>
        <WalletWidget />
      </div>
    </nav>
  );
}
