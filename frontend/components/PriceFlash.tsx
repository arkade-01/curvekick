import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  style?: React.CSSProperties;
}

export default function PriceFlash({ value, style }: Props) {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (prev.current === value) return;
    const dir = parseFloat(value) >= parseFloat(prev.current) ? "up" : "down";
    setFlash(dir);
    prev.current = value;
    const t = setTimeout(() => setFlash(null), 620);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span
      style={{
        ...style,
        animation: flash === "up" ? "flash-up 0.6s ease-out forwards"
                 : flash === "down" ? "flash-down 0.6s ease-out forwards"
                 : undefined,
      }}
    >
      {value}
    </span>
  );
}
