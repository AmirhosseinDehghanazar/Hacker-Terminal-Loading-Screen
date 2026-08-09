import { useState } from "react";
import { formatRelativeTime } from "../lib/calculations";
import type { HistoryDataset } from "../lib/types";

export function Header({ dataset, onExportCsv, onExportJson }: {
  dataset: HistoryDataset;
  onExportCsv: () => void;
  onExportJson: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const isError = dataset.lastSyncStatus === "error";

  async function handleSync() {
    setSyncing(true);
    // Client-side "sync now" cannot call the GitHub API directly without exposing a token,
    // so this reloads the current dataset from disk — the real collection happens in the
    // GitHub Action, which can also be triggered manually from the Actions tab.
    await new Promise((r) => setTimeout(r, 650));
    setSyncing(false);
    setJustSynced(true);
    window.location.reload();
  }

  return (
    <header className="border-b border-hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-body mb-2">
            Repository Analytics
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
            {dataset.repository.name || "Not configured"}
          </h1>
          <a
            href={dataset.repository.htmlUrl || "#"}
            className="text-sm text-muted font-mono hover:text-amber transition-colors"
          >
            {dataset.repository.fullName ? `github.com/${dataset.repository.fullName}` : ""}
          </a>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs font-body">
            <span className="flex items-center gap-1.5 text-muted">
              <Dot color="#8FA6A3" />
              Tracking since{" "}
              {dataset.repository.trackingSince
                ? new Date(dataset.repository.trackingSince).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              <Dot color={isError ? "#C4694F" : "#E8A840"} />
              {isError ? "Last sync failed" : "Last synchronized"} {formatRelativeTime(dataset.lastSyncedAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExportMenu onCsv={onExportCsv} onJson={onExportJson} />
          <button
            onClick={handleSync}
            disabled={syncing}
            className="notch-sm px-4 py-2 text-xs font-mono font-medium bg-amber text-obsidian hover:bg-amber-deep transition-colors disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          >
            {syncing ? "Synchronizing…" : justSynced ? "✓ Updated" : "↻ Sync now"}
          </button>
        </div>
      </div>
    </header>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />;
}

function ExportMenu({ onCsv, onJson }: { onCsv: () => void; onJson: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="notch-sm px-4 py-2 text-xs font-mono font-medium border border-hairline text-muted hover:text-ink hover:border-faint transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
      >
        Export
      </button>
      {open ? (
        <div className="absolute right-0 mt-1 w-36 bg-raised border border-hairline z-10">
          <button
            onClick={() => {
              onCsv();
              setOpen(false);
            }}
            className="block w-full text-left px-3 py-2 text-xs font-mono text-muted hover:text-ink hover:bg-surface"
          >
            CSV
          </button>
          <button
            onClick={() => {
              onJson();
              setOpen(false);
            }}
            className="block w-full text-left px-3 py-2 text-xs font-mono text-muted hover:text-ink hover:bg-surface"
          >
            JSON
          </button>
        </div>
      ) : null}
    </div>
  );
}
