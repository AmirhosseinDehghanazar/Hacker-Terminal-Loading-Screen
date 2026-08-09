import { Panel } from "./Panel";
import type { HistoryDataset } from "../lib/types";
import { formatNumber } from "../lib/calculations";

export function RepoOverview({ dataset }: { dataset: HistoryDataset }) {
  const { repository, repoStats, releases } = dataset;
  const latestStats = repoStats[repoStats.length - 1];
  const created = repository.createdAt
    ? new Date(repository.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Unknown";

  const fields: { label: string; value: string | number | null }[] = [
    { label: "Owner", value: repository.owner || null },
    { label: "Language", value: repository.language },
    { label: "License", value: repository.license },
    { label: "Created", value: repository.createdAt ? created : null },
    { label: "Default branch", value: repository.defaultBranch },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel className="p-5 sm:p-6">
        <h3 className="font-display text-sm font-semibold text-ink mb-1">Repository</h3>
        <p className="text-sm text-muted font-body mb-5 break-all">
          {repository.fullName || "Not configured yet"}
        </p>
        <dl className="grid grid-cols-2 gap-y-3 gap-x-4">
          {fields.map((f) =>
            f.value ? (
              <div key={f.label}>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">{f.label}</dt>
                <dd className="text-sm text-ink font-body mt-0.5">{f.value}</dd>
              </div>
            ) : null
          )}
        </dl>
        {repository.description ? (
          <p className="text-sm text-muted font-body mt-5 pt-5 border-t border-hairline leading-relaxed">
            {repository.description}
          </p>
        ) : null}
      </Panel>

      <Panel className="p-5 sm:p-6">
        <h3 className="font-display text-sm font-semibold text-ink mb-5">Activity</h3>
        <div className="grid grid-cols-2 gap-y-5 gap-x-4">
          <Stat label="Stars" value={latestStats?.stars} />
          <Stat label="Forks" value={latestStats?.forks} />
          <Stat label="Watchers" value={latestStats?.watchers} />
          <Stat label="Open issues" value={latestStats?.openIssues} />
          <Stat label="Open PRs" value={latestStats?.openPRs} />
          <Stat label="Releases" value={releases.length} />
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted mb-1">{label}</div>
      <div className="font-mono tnum text-xl text-ink">{value === undefined ? "—" : formatNumber(value)}</div>
    </div>
  );
}
