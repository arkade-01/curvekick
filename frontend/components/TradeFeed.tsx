import { useTradeFeed, relativeTime } from "@/hooks/useTradeFeed";

const OUTCOME_LABELS = ["HOME", "DRAW", "AWAY"];
const OUTCOME_COLORS = ["#00FF6A", "#FFB800", "#FF3D3D"];

interface Props {
  curveAddresses: readonly [`0x${string}`, `0x${string}`, `0x${string}`] | undefined;
}

export default function TradeFeed({ curveAddresses }: Props) {
  const { trades } = useTradeFeed(curveAddresses);

  return (
    <div style={{ background: "#0A1A10", border: "1px solid #2A3D30", borderRadius: 10, padding: 20 }}>
      <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.2em", marginBottom: 16 }}>RECENT TRADES</div>

      {trades.length === 0 ? (
        <div style={{ fontSize: 11, color: "#2A3D30", textAlign: "center", padding: "24px 0" }}>
          No trades yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {trades.map(t => {
            const color = OUTCOME_COLORS[t.outcome];
            const label = OUTCOME_LABELS[t.outcome];
            return (
              <div
                key={t.id}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid #0F2018",
                  animation: "slide-in 0.3s ease-out",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "#F0F5F1", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>
                    <span style={{ color: "#8A9E92" }}>{t.wallet}</span>
                    {" "}
                    <span style={{ color: t.isBuy ? "#00FF6A" : "#FF3D3D" }}>{t.isBuy ? "bought" : "sold"}</span>
                    {" "}
                    <span style={{ color: "#F0F5F1" }}>{t.shares}</span>
                    {" "}
                    <span style={{ color, background: `${color}18`, border: `1px solid ${color}44`, padding: "1px 5px", borderRadius: 3, fontSize: 9, letterSpacing: "0.1em" }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#8A9E92", fontFamily: "'DM Mono', monospace" }}>
                    {t.costOkb.toFixed(5)} CKUSD · {relativeTime(t.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
