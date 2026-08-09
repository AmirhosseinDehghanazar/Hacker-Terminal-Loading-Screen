import { Panel } from "./Panel";
import { CountUp } from "./CountUp";

interface MetricCardProps {
  label: string;
  value: number;
  growthPercent?: number | null;
  sublabel?: string;
  accent?: "amber" | "ink";
}

export function MetricCard({ label, value, growthPercent, sublabel, accent = "ink" }: MetricCardProps) {
  return (
    <Panel className="p-5 sm:p-6 flex flex-col gap-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted font-body font-medium">{label}</div>
      <div className={`font-mono text-3xl sm:text-4xl font-semibold ${accent === "amber" ? "text-amber" : "text-ink"}`}>
        <CountUp value={value} />
      </div>
      <div className="flex items-center gap-2 min-h-[18px]">
        {typeof growthPercent === "number" && Number.isFinite(growthPercent) ? (
          <span
            className={`font-mono text-xs tnum px-1.5 py-0.5 border ${
              growthPercent >= 0 ? "text-amber border-amber/30 bg-amber/5" : "text-clay border-clay/30 bg-clay/5"
            }`}
          >
            {growthPercent >= 0 ? "+" : ""}
            {growthPercent.toFixed(1)}%
          </span>
        ) : null}
        {sublabel ? <span className="text-xs text-faint font-body">{sublabel}</span> : null}
      </div>
    </Panel>
  );
}
