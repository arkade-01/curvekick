import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { CurveData } from "@/lib/mockData";

interface Props {
  home: CurveData;
  draw: CurveData;
  away: CurveData;
}

export default function CombinedChart({ home, draw, away }: Props) {
  const data = home.priceHistory.map((_, i) => ({
    i,
    home: home.priceHistory[i],
    draw: draw.priceHistory[i],
    away: away.priceHistory[i],
  }));

  const fmt = (v: number) => v.toFixed(4);

  return (
    <div style={{ background: "#0A1A10", border: "1px solid #2A3D30", borderRadius: 10, padding: "20px 16px 12px" }}>
      <div style={{ fontSize: 10, color: "#8A9E92", letterSpacing: "0.2em", marginBottom: 16, display: "flex", gap: 20 }}>
        <span style={{ color: "#00FF6A" }}>▬ HOME</span>
        <span style={{ color: "#FFB800" }}>▬ DRAW</span>
        <span style={{ color: "#FF3D3D" }}>▬ AWAY</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gHome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00FF6A" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#00FF6A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gDraw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#FFB800" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#FFB800" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gAway" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#FF3D3D" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#FF3D3D" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide />
          <YAxis tickFormatter={fmt} tick={{ fill: "#8A9E92", fontSize: 10, fontFamily: "DM Mono" }} width={52} />
          <Tooltip
            contentStyle={{ background: "#0A1A10", border: "1px solid #2A3D30", borderRadius: 6, fontFamily: "DM Mono", fontSize: 11 }}
            labelStyle={{ color: "#8A9E92" }}
            formatter={(v) => [typeof v === "number" ? v.toFixed(5) + " CKUSD" : v, ""]}
          />
          <Area type="monotone" dataKey="home" stroke="#00FF6A" strokeWidth={1.5} fill="url(#gHome)" animationDuration={1500} animationEasing="ease-out" />
          <Area type="monotone" dataKey="draw" stroke="#FFB800" strokeWidth={1.5} fill="url(#gDraw)" animationDuration={1500} animationEasing="ease-out" />
          <Area type="monotone" dataKey="away" stroke="#FF3D3D" strokeWidth={1.5} fill="url(#gAway)" animationDuration={1500} animationEasing="ease-out" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
