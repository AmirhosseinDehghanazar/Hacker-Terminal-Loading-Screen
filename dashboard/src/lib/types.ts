export interface DailyPoint {
  count: number;
  uniques: number;
}
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
export interface WindowSnapshot<T> {
  collectedAt: string;
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
  trackingSince: string;
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
  referrerSnapshots: WindowSnapshot<ReferrerEntry>[];
  contentSnapshots: WindowSnapshot<ContentEntry>[];
}

export type RangeKey = "7D" | "14D" | "30D" | "90D" | "6M" | "1Y" | "ALL";
export type ChartMode = "clones" | "cloners" | "views" | "visitors" | "combined";
