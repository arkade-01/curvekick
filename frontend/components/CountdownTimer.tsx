import { useEffect, useState } from "react";

interface Props {
  targetTime: number; // unix seconds
  style?: React.CSSProperties;
}

function diff(target: number) {
  const s = Math.max(0, target - Date.now() / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: Math.floor(s % 60),
    over: s === 0,
  };
}

export default function CountdownTimer({ targetTime, style }: Props) {
  const [t, setT] = useState(() => diff(targetTime));

  useEffect(() => {
    if (t.over) return;
    const id = setInterval(() => setT(diff(targetTime)), 1000);
    return () => clearInterval(id);
  }, [targetTime, t.over]);

  if (t.over) return <span style={{ color: "#FFB800", ...style }}>KICKED OFF</span>;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em", ...style }}>
      {t.d > 0 && <>{t.d}d </>}
      {pad(t.h)}:{pad(t.m)}:{pad(t.s)}
    </span>
  );
}
