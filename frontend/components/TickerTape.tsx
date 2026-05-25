import { useMarkets } from "@/hooks/useMarkets";

export default function TickerTape() {
  const { markets } = useMarkets();

  const items = markets.flatMap(m => [
    { label: `${m.homeTeam.split(" ")[0].toUpperCase()} HOME`, price: m.homePrice },
    { label: `${m.awayTeam.split(" ")[0].toUpperCase()} AWAY`, price: m.awayPrice },
    { label: `${m.homeTeam.split(" ")[0].toUpperCase()} DRAW`, price: m.drawPrice },
  ]);

  if (items.length === 0) return null;

  const all = [...items, ...items];

  return (
    <div style={{ background: "#0A1A10", borderBottom: "1px solid #2A3D30", overflow: "hidden", height: 28, display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 0, animation: "ticker 30s linear infinite", whiteSpace: "nowrap" }}>
        {all.map((item, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 20px", fontSize: 10, letterSpacing: "0.12em", borderRight: "1px solid #1A2E22" }}>
            <span style={{ color: "#8A9E92" }}>{item.label}</span>
            <span style={{ color: "#00FF6A" }}>{item.price} CKUSD</span>
          </span>
        ))}
      </div>
    </div>
  );
}
