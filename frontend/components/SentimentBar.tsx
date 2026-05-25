interface Props {
  home: number;
  draw: number;
  away: number;
  height?: number;
}

export default function SentimentBar({ home, draw, away, height = 4 }: Props) {
  const total = home + draw + away || 1;
  const hp = Math.round((home / total) * 100);
  const dp = Math.round((draw / total) * 100);
  const ap = 100 - hp - dp;

  return (
    <div>
      <div style={{ display: "flex", gap: 2, height, borderRadius: height / 2, overflow: "hidden" }}>
        <div style={{ width: `${hp}%`, background: "#00FF6A", transition: "width 0.8s ease" }} />
        <div style={{ width: `${dp}%`, background: "#FFB800", transition: "width 0.8s ease" }} />
        <div style={{ width: `${ap}%`, background: "#FF3D3D", transition: "width 0.8s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8A9E92", marginTop: 6 }}>
        <span style={{ color: "#00FF6A" }}>HOME {hp}%</span>
        <span style={{ color: "#FFB800" }}>DRAW {dp}%</span>
        <span style={{ color: "#FF3D3D" }}>AWAY {ap}%</span>
      </div>
    </div>
  );
}
