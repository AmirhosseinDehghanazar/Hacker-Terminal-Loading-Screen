import type {
  DailySeries,
  DateKey,
  HistoryDataset,
  ReferrerEntry,
  ContentEntry,
  WindowSnapshot,
  RepoStatsPoint,
  ReleaseInfo,
} from "./types.js";

/**
 * CORE INTEGRITY RULE
 * --------------------
 * GitHub's traffic endpoints (`/traffic/clones`, `/traffic/views`) return a rolling
 * 14-day window of *per-day totals*, not deltas. That means the same date will appear
 * in many consecutive collector runs with a value that GitHub itself computed for that
 * whole day.
 *
 * Therefore the correct way to fold a new window into the lifetime dataset is NOT to add
 * incoming values to existing ones -- that double- (or 14x-) counts every overlapping day.
 * Instead, for each date we keep the *authoritative* value GitHub reports for that date.
 *
 * In practice this means: take the max of what we already have and what we just received.
 * `max` (rather than a plain overwrite) is a defensive choice: it makes the merge commutative
 * and safe even if collections run out of order, retry, or a transient API response is
 * short a day of data. A day's true count from GitHub never goes down, so `max` converges
 * to the correct value regardless of run order or duplication -- i.e. the merge is idempotent.
 */
export function mergeDailySeries(existing: DailySeries, incoming: DailySeries): DailySeries {
  const merged: DailySeries = { ...existing };
  for (const [date, point] of Object.entries(incoming)) {
    const prev = merged[date];
    if (!prev) {
      merged[date] = point;
    } else {
      merged[date] = {
        count: Math.max(prev.count, point.count),
        uniques: Math.max(prev.uniques, point.uniques),
      };
    }
  }
  return merged;
}

/** Converts GitHub's raw traffic API shape into our DailySeries keyed by YYYY-MM-DD (UTC). */
export function toDailySeries(rawDays: { timestamp: string; count: number; uniques: number }[]): DailySeries {
  const series: DailySeries = {};
  for (const day of rawDays) {
    const key = toDateKey(day.timestamp);
    series[key] = { count: day.count, uniques: day.uniques };
  }
  return series;
}

export function toDateKey(isoTimestamp: string): DateKey {
  return isoTimestamp.slice(0, 10);
}

/**
 * Referrers and popular-content are only ever exposed as a rolling snapshot (no per-day
 * breakdown, no way to distinguish "new since last time"), so we cannot merge them into a
 * lifetime series without fabricating data. Instead we append a dated snapshot and cap the
 * log length, so the dashboard can show "most recent known window" honestly, and optionally
 * a short recent trend, without claiming false lifetime precision.
 */
export function appendWindowSnapshot<T>(
  log: WindowSnapshot<T>[],
  items: T[],
  collectedAt: string,
  maxEntries = 60
): WindowSnapshot<T>[] {
  const next = [...log, { collectedAt, items }];
  next.sort((a, b) => a.collectedAt.localeCompare(b.collectedAt));
  return next.slice(-maxEntries);
}

/** Repo-level counters (stars/forks/watchers/issues/PRs) are always "current value" from the
 *  REST API -- GitHub does not expose historical star counts cheaply. We sample once per UTC
 *  day: if today's date already has a sample, we overwrite it (idempotent for reruns on the
 *  same day); otherwise we append a new point, building a daily history over time. */
export function upsertRepoStatsPoint(history: RepoStatsPoint[], point: RepoStatsPoint): RepoStatsPoint[] {
  const idx = history.findIndex((p) => p.date === point.date);
  if (idx === -1) {
    return [...history, point].sort((a, b) => a.date.localeCompare(b.date));
  }
  const next = [...history];
  next[idx] = point;
  return next;
}

/** Releases are keyed by tag and always reflect current GitHub state, so a plain replace
 *  (post de-dupe by tag) is correct -- there is nothing to accumulate, only to refresh. */
export function mergeReleases(_existing: ReleaseInfo[], incoming: ReleaseInfo[]): ReleaseInfo[] {
  const byTag = new Map<string, ReleaseInfo>();
  for (const r of incoming) byTag.set(r.tagName, r);
  return Array.from(byTag.values()).sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

export interface MergeInput {
  clonesRaw: { timestamp: string; count: number; uniques: number }[];
  viewsRaw: { timestamp: string; count: number; uniques: number }[];
  referrers: ReferrerEntry[];
  content: ContentEntry[];
  repoStatsPoint: RepoStatsPoint;
  releases: ReleaseInfo[];
  collectedAt: string;
}

/** Applies one full collection cycle onto the existing dataset. Pure function: same inputs
 *  always produce the same output, which is what makes repeated Action runs safe. */
export function applyCollection(dataset: HistoryDataset, input: MergeInput): HistoryDataset {
  return {
    ...dataset,
    lastSyncedAt: input.collectedAt,
    lastSyncStatus: "ok",
    lastSyncError: null,
    daily: {
      clones: mergeDailySeries(dataset.daily.clones, toDailySeries(input.clonesRaw)),
      views: mergeDailySeries(dataset.daily.views, toDailySeries(input.viewsRaw)),
    },
    repoStats: upsertRepoStatsPoint(dataset.repoStats, input.repoStatsPoint),
    releases: mergeReleases(dataset.releases, input.releases),
    referrerSnapshots: appendWindowSnapshot(dataset.referrerSnapshots, input.referrers, input.collectedAt),
    contentSnapshots: appendWindowSnapshot(dataset.contentSnapshots, input.content, input.collectedAt),
  };
}
