import Head from "next/head";
import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import Navbar from "@/components/Navbar";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/lib/contracts";
import { useIsMobile } from "@/hooks/useIsMobile";

const TEAM_CODES = [
  "BRAZ","FRA","ARG","ENG","GER","ESP","POR","ITA",
  "NED","BEL","URU","CHI","MEX","USA","JPN","KOR",
  "MAR","SEN","NGA","CIV","AUS","CRO","SUI","DEN",
  "POL","SRB","CZE","WAL","ECU","GHA","TUN","CMR",
  "QAT","SAU","IRN","CAN",
];

const inputStyle = {
  width: "100%",
  background: "#080C0A",
  border: "1px solid #2A3D30",
  borderRadius: 4,
  color: "#F0F5F1",
  fontFamily: "'DM Mono', monospace",
  fontSize: 13,
  padding: "10px 12px",
  boxSizing: "border-box" as const,
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
};

const labelStyle = {
  fontSize: 10,
  color: "#8A9E92",
  letterSpacing: "0.15em",
  marginBottom: 6,
  display: "block" as const,
};

export default function AdminPage() {
  const { address: userAddress, isConnected } = useAccount();
  const isMobile = useIsMobile();

  const { data: adminAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "admin",
  });

  const isAdmin = isConnected && adminAddress && userAddress?.toLowerCase() === (adminAddress as string).toLowerCase();

  const [homeCode, setHomeCode] = useState("BRAZ");
  const [awayCode, setAwayCode] = useState("FRA");
  const [matchNum, setMatchNum] = useState("01");
  const [kickoffDate, setKickoffDate] = useState("");
  const [kickoffTime, setKickoffTime] = useState("18:00");
  const [error, setError] = useState("");
  const [newAdminAddr, setNewAdminAddr] = useState("");

  const matchId = `${homeCode}-${awayCode}-${matchNum}`;

  const kickoffTimestamp = kickoffDate
    ? Math.floor(new Date(`${kickoffDate}T${kickoffTime}:00Z`).getTime() / 1000)
    : 0;

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash: txHash });

  const { writeContract: writeTransfer, data: transferHash, isPending: transferPending, isSuccess: transferSuccess } = useWriteContract();
  const { isLoading: transferConfirming } = useWaitForTransactionReceipt({ hash: transferHash });

  function handleCreate() {
    setError("");
    if (!kickoffDate) { setError("Please set a kickoff date."); return; }
    if (homeCode === awayCode) { setError("Home and away teams must differ."); return; }
    if (kickoffTimestamp <= Date.now() / 1000) { setError("Kickoff time must be in the future."); return; }

    writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "createMarket",
      args: [matchId, BigInt(kickoffTimestamp)],
    });
  }

  return (
    <>
      <Head><title>Admin — CurveKick</title></Head>
      <div style={{ minHeight: "100vh", background: "#080C0A" }}>
        <Navbar />
        <main style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "24px 16px" : "48px 24px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, color: "#00FF6A", letterSpacing: "0.2em", marginBottom: 8 }}>ADMIN</div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 36 : 48, color: "#F0F5F1", margin: 0, letterSpacing: "0.04em" }}>
              CREATE MARKET
            </h1>
          </div>

          {!isConnected && (
            <div style={{ textAlign: "center", padding: "60px 24px", border: "1px dashed #2A3D30", borderRadius: 12 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#2A3D30", marginBottom: 10 }}>WALLET NOT CONNECTED</div>
              <div style={{ fontSize: 13, color: "#8A9E92" }}>Connect the admin wallet to create markets</div>
            </div>
          )}

          {isConnected && !isAdmin && (
            <div style={{ padding: "24px", background: "#FF3D3D10", border: "1px solid #FF3D3D44", borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: "#FF3D3D", marginBottom: 8 }}>Access Denied</div>
              <div style={{ fontSize: 11, color: "#8A9E92" }}>
                Connected: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}<br />
                Admin: {adminAddress ? `${(adminAddress as string).slice(0, 6)}...${(adminAddress as string).slice(-4)}` : "loading..."}
              </div>
            </div>
          )}

          {isAdmin && (
            <div style={{ background: "#0A1A10", border: "1px solid #1A2E22", borderRadius: 10, padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.2em", marginBottom: 16 }}>TRANSFER ADMIN</div>
              {transferSuccess ? (
                <div style={{ fontSize: 12, color: "#00FF6A", letterSpacing: "0.1em" }}>✓ Admin transferred</div>
              ) : (
                <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
                  <input
                    value={newAdminAddr}
                    onChange={e => setNewAdminAddr(e.target.value)}
                    placeholder="0x new admin address"
                    style={{ ...inputStyle, flex: 1, fontSize: 12 }}
                  />
                  <button
                    disabled={!newAdminAddr.startsWith("0x") || newAdminAddr.length !== 42 || transferPending || transferConfirming}
                    onClick={() => writeTransfer({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "transferAdmin", args: [newAdminAddr as `0x${string}`] })}
                    style={{
                      padding: "10px 20px", fontSize: 11, fontFamily: "'DM Mono', monospace",
                      letterSpacing: "0.1em", fontWeight: 500, borderRadius: 6, border: "none",
                      background: transferPending || transferConfirming ? "#1A2E22" : "#FFB800",
                      color: transferPending || transferConfirming ? "#8A9E92" : "#080C0A",
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {transferPending || transferConfirming ? "TRANSFERRING..." : "TRANSFER"}
                  </button>
                </div>
              )}
              <div style={{ fontSize: 10, color: "#8A9E92", marginTop: 10 }}>
                Current admin: <span style={{ color: "#F0F5F1" }}>{adminAddress ? `${(adminAddress as string).slice(0, 10)}...${(adminAddress as string).slice(-6)}` : "loading"}</span>
              </div>
            </div>
          )}

          {isAdmin && (
            <div style={{ background: "#0A1A10", border: "1px solid #2A3D30", borderRadius: 10, padding: 28 }}>

              {isSuccess ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#00FF6A", marginBottom: 8 }}>MARKET CREATED</div>
                  <div style={{ fontSize: 11, color: "#8A9E92", marginBottom: 4 }}>Match ID: {matchId}</div>
                  {receipt && (
                    <a href={`https://www.okx.com/web3/explorer/xlayer-test/tx/${txHash}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: 10, color: "#8A9E92", textDecoration: "none", letterSpacing: "0.1em" }}>
                      VIEW TX →
                    </a>
                  )}
                  <div style={{ marginTop: 24 }}>
                    <button
                      onClick={() => { setMatchNum(n => String(parseInt(n) + 1).padStart(2, "0")); }}
                      style={{ background: "#00FF6A", color: "#080C0A", border: "none", borderRadius: 6, padding: "10px 24px", fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", cursor: "pointer" }}
                    >
                      CREATE ANOTHER
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Teams */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={labelStyle}>HOME TEAM</label>
                      <select value={homeCode} onChange={e => setHomeCode(e.target.value)} style={selectStyle}>
                        {TEAM_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>AWAY TEAM</label>
                      <select value={awayCode} onChange={e => setAwayCode(e.target.value)} style={selectStyle}>
                        {TEAM_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Match number */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>MATCH NUMBER (e.g. 01, 02)</label>
                    <input
                      type="text" value={matchNum}
                      onChange={e => setMatchNum(e.target.value.replace(/\D/g, "").slice(0, 2))}
                      style={inputStyle}
                    />
                  </div>

                  {/* Preview */}
                  <div style={{ background: "#080C0A", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#00FF6A", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
                    MATCH ID: {matchId}
                  </div>

                  {/* Kickoff */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={labelStyle}>KICKOFF DATE (UTC)</label>
                      <input type="date" value={kickoffDate} onChange={e => setKickoffDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>KICKOFF TIME (UTC)</label>
                      <input type="time" value={kickoffTime} onChange={e => setKickoffTime(e.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  {/* Unix preview */}
                  {kickoffTimestamp > 0 && (
                    <div style={{ fontSize: 10, color: "#8A9E92", marginBottom: 20 }}>
                      Unix: {kickoffTimestamp} · {new Date(kickoffTimestamp * 1000).toUTCString()}
                    </div>
                  )}

                  {(error || writeError) && (
                    <div style={{ fontSize: 11, color: "#FF3D3D", background: "#FF3D3D10", border: "1px solid #FF3D3D30", borderRadius: 4, padding: "8px 12px", marginBottom: 16 }}>
                      {error || writeError?.message.slice(0, 160)}
                    </div>
                  )}

                  <button
                    disabled={isPending || isConfirming}
                    onClick={handleCreate}
                    style={{
                      width: "100%", padding: "14px 0", fontSize: 13, letterSpacing: "0.1em",
                      fontFamily: "'DM Mono', monospace", fontWeight: 500,
                      background: isPending || isConfirming ? "#1A2E22" : "#00FF6A",
                      color: isPending || isConfirming ? "#8A9E92" : "#080C0A",
                      border: "none", borderRadius: 6, cursor: isPending || isConfirming ? "not-allowed" : "pointer",
                    }}
                  >
                    {isPending || isConfirming ? "CREATING MARKET..." : "CREATE MARKET"}
                  </button>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
