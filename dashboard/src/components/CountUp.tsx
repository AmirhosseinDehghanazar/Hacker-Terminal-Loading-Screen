import { useEffect, useRef, useState } from "react";
import { formatNumber } from "../lib/calculations";

interface CountUpProps {
  value: number;
  durationMs?: number;
  className?: string;
}

/** Animates a number counting up from 0 on mount/change. Respects prefers-reduced-motion. */
export function CountUp({ value, durationMs = 900, className }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const from = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs]);

  return <span className={`tnum ${className ?? ""}`}>{formatNumber(display)}</span>;
}
