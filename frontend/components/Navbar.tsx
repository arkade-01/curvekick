import Link from "next/link";
import { useRouter } from "next/router";
import { usePrivy } from "@privy-io/react-auth";
import { useReadContract } from "wagmi";
import { useAccount } from "wagmi";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/lib/contracts";

function ConnectButton() {
  const { login, logout, authenticated, ready, user } = usePrivy();

  if (!ready) return null;

  if (!authenticated) {
    return (
      <button
        onClick={login}
        style={{
          background: "#00FF6A", color: "#080C0A", border: "none",
          borderRadius: 6, padding: "8px 20px",
          fontSize: 11, fontFamily: "'DM Mono', monospace",
          fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer",
        }}
      >
        CONNECT
      </button>
    );
  }

  // Show address from linked wallet or embedded wallet
  const wallet = user?.wallet;
  const addr = wallet?.address ?? "";
  const short = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Connected";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#00FF6A", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
        {short}
      </span>
      <button
        onClick={logout}
        style={{
          background: "none", color: "#8A9E92",
          border: "1px solid #2A3D30", borderRadius: 6,
          padding: "6px 12px", fontSize: 10,
          fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em",
          cursor: "pointer",
        }}
      >
        DISCONNECT
      </button>
    </div>
  );
}

export default function Navbar() {
  const router = useRouter();
  const { address: userAddress } = useAccount();

  const { data: adminAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "admin",
  });

  const isAdmin = !!userAddress && !!adminAddress &&
    userAddress.toLowerCase() === (adminAddress as string).toLowerCase();

  const navLink = (href: string, label: string) => (
    <Link href={href} style={{
      fontSize: 11, letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace",
      color: router.pathname === href ? "#00FF6A" : "#8A9E92",
      textDecoration: "none",
      borderBottom: router.pathname === href ? "1px solid #00FF6A" : "1px solid transparent",
      paddingBottom: 2,
    }}>
      {label}
    </Link>
  );

  return (
    <nav style={{ borderBottom: "1px solid #2A3D30", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#080C0A" }}>
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#1A3D28"/>
          <path d="M6 30 Q12 28 18 20 Q24 12 34 10" stroke="#00FF6A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <circle cx="34" cy="10" r="3.5" fill="#00FF6A"/>
          <line x1="6" y1="10" x2="6" y2="34" stroke="#2A3D30" strokeWidth="0.5"/>
          <line x1="6" y1="34" x2="34" y2="34" stroke="#2A3D30" strokeWidth="0.5"/>
        </svg>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: "0.08em", color: "#F0F5F1", lineHeight: 1 }}>CURVEKICK</div>
          <div style={{ fontSize: 8, color: "#00FF6A", letterSpacing: "0.2em" }}>PREDICTION MARKETS</div>
        </div>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {navLink("/markets", "MARKETS")}
        {navLink("/portfolio", "PORTFOLIO")}
        {navLink("/leaderboard", "LEADERS")}
        {navLink("/faucet", "FAUCET")}
        {isAdmin && navLink("/admin", "ADMIN")}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 9, color: "#2A3D30", letterSpacing: "0.15em" }}>X LAYER TESTNET</span>
        <ConnectButton />
      </div>
    </nav>
  );
}
