import { Panel } from "./Panel";
import { formatRelativeTime } from "../lib/calculations";
import type { ReferrerEntry, WindowSnapshot } from "../lib/types";

export function TrafficSources({ snapshots }: { snapshots: WindowSnapshot<ReferrerEntry>[] }) {
  const latest = snapshots[snapshots.length - 1];
  const items = latest?.items ?? [];
  const total = items.reduce((sum, i) => sum + i.count, 0);
  const sorted = [...items].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <Panel className="p-5 sm:p-6">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-display text-sm font-semibold text-ink">Traffic sources</h3>
        {latest ? (
          <span className="text-[11px] text-faint font-mono">as of {formatRelativeTime(latest.collectedAt)}</span>
        ) : null}
      </div>
      <p className="text-xs text-faint font-body mb-5">
        GitHub reports referrers over a rolling window, not full lifetime history.
      </p>
      {sorted.length === 0 ? (
        <EmptyRow text="No referrer data available yet." />
      ) : (
        <ul className="space-y-3">
          {sorted.map((item) => {
            const pct = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <li key={item.referrer}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-ink font-body truncate max-w-[60%]">{item.referrer}</span>
                  <span className="font-mono tnum text-muted text-xs">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-hairline w-full">
                  <div className="h-full bg-amber" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function EmptyRow({ text }: { text: string }) {
  return <p className="text-sm text-faint font-body py-4">{text}</p>;
}
