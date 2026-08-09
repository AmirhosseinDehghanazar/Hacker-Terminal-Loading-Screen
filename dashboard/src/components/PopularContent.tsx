import { Panel } from "./Panel";
import { formatNumber } from "../lib/calculations";
import { EmptyRow } from "./TrafficSources";
import type { ContentEntry, WindowSnapshot } from "../lib/types";

export function PopularContent({ snapshots }: { snapshots: WindowSnapshot<ContentEntry>[] }) {
  const latest = snapshots[snapshots.length - 1];
  const items = [...(latest?.items ?? [])].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <Panel className="p-5 sm:p-6">
      <h3 className="font-display text-sm font-semibold text-ink mb-5">Popular content</h3>
      {items.length === 0 ? (
        <EmptyRow text="No content-popularity data available yet." />
      ) : (
        <ul className="divide-y divide-hairline">
          {items.map((item) => (
            <li key={item.path} className="flex items-center justify-between py-2.5 gap-4">
              <span className="text-sm text-ink font-mono truncate">{item.path}</span>
              <span className="text-sm font-mono tnum text-muted whitespace-nowrap">
                {formatNumber(item.count)} views
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
