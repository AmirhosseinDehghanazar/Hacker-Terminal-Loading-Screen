/**
 * Canonical schema for the persisted analytics dataset.
 * This file is the single source of truth for the shape of `data/history.json`.
 * The dashboard imports the same shape (duplicated in dashboard/src/types.ts
 * to avoid cross-package build coupling on GitHub Pages, but MUST be kept in sync).
 */

export interface DailyPoint {
  /** Total count for the day (e.g. clones or views). Never decreases once a day is "closed". */
  count: number;
  /** Unique actors for the day (unique cloners or unique visitors). */
  uniques: number;
}

/** date string in `YYYY-MM-DD` (UTC, matches GitHub's traffic API day boundaries) */
export type DateKey = string;

export interface DailySeries {
  [date: string]: DailyPoint;
}

export interface ReferrerEntry {
  referrer: string;
  count: number;
  uniques: number;
}

export interface ContentEntry {
  path: string;
  title: string;
  count: number;
  uniques: number;
}

/** A dated snapshot of data GitHub only exposes as a rolling window (not truly mergeable day-by-day). */
export interface WindowSnapshot<T> {
  collectedAt: string; // ISO timestamp
  items: T[];
}

export interface RepoStatsPoint {
  date: DateKey;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  openPRs: number;
}

export interface ReleaseInfo {
  tagName: string;
  name: string | null;
  publishedAt: string | null;
  downloadCount: number;
  htmlUrl: string;
}

export interface RepositoryMeta {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  language: string | null;
  license: string | null;
  createdAt: string | null;
  defaultBranch: string;
  trackingSince: string; // ISO timestamp of the first successful collection
}

export interface HistoryDataset {
  schemaVersion: 1;
  repository: RepositoryMeta;
  lastSyncedAt: string | null;
  lastSyncStatus: "ok" | "error" | "never";
  lastSyncError: string | null;
  daily: {
    clones: DailySeries;
    views: DailySeries;
  };
  repoStats: RepoStatsPoint[];
  releases: ReleaseInfo[];
  /** Referrers/popular content are only ever exposed by GitHub as a rolling ~14 day window,
   *  so they cannot be losslessly merged into a lifetime daily series. We keep a short
   *  rolling log of recent snapshots instead of pretending we have full history. */
  referrerSnapshots: WindowSnapshot<ReferrerEntry>[];
  contentSnapshots: WindowSnapshot<ContentEntry>[];
}

export function emptyDataset(repository: RepositoryMeta): HistoryDataset {
  return {
    schemaVersion: 1,
    repository,
    lastSyncedAt: null,
    lastSyncStatus: "never",
    lastSyncError: null,
    daily: { clones: {}, views: {} },
    repoStats: [],
    releases: [],
    referrerSnapshots: [],
    contentSnapshots: [],
  };
}
