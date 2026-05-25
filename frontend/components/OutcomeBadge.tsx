interface Props {
  status: "upcoming" | "live" | "resolved";
  result?: 0 | 1 | 2;
}

const LABELS = ["HOME WIN", "DRAW", "AWAY WIN"];

export default function OutcomeBadge({ status, result }: Props) {
  if (status === "live") return (
    <span style={{ fontSize: 9, color: "#FFB800", background: "#FFB80018", border: "1px solid #FFB80044", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.15em", display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFB800", display: "inline-block", animation: "pulse-dot 1.5s ease-in-out infinite" }} />
      LIVE
    </span>
  );

  if (status === "resolved") return (
    <span style={{ fontSize: 9, color: "#00FF6A", background: "#00FF6A18", border: "1px solid #00FF6A44", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.15em" }}>
      RESOLVED {result !== undefined ? `· ${LABELS[result]}` : ""}
    </span>
  );

  return (
    <span style={{ fontSize: 9, color: "#8A9E92", background: "#1A2E22", border: "1px solid #2A3D30", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.15em" }}>
      UPCOMING
    </span>
  );
}
