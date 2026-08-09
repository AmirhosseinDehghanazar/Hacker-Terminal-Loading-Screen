import type { DailySeries, RangeKey } from "./types";

export interface DayRow {
  date: string;
  clones: number;
  cloners: number;
  views: number;
  visitors: number;
}

/** Merges the two daily series (clones, views) into one row-per-date table, sorted ascending. */
export function buildTimeline(clones: DailySeries, views: DailySeries): DayRow[] {
  const dates = new Set([...Object.keys(clones), ...Object.keys(views)]);
  return Array.from(dates)
    .sort()
    .map((date) => ({
      date,
      clones: clones[date]?.count ?? 0,
      cloners: clones[date]?.uniques ?? 0,
      views: views[date]?.count ?? 0,
      visitors: views[date]?.uniques ?? 0,
    }));
}

export function lifetimeTotal(series: DailySeries, field: "count" | "uniques" = "count"): number {
  return Object.values(series).reduce((sum, p) => sum + p[field], 0);
}

export function rangeToDays(range: RangeKey): number | null {
  switch (range) {
    case "7D":
      return 7;
    case "14D":
      return 14;
    case "30D":
      return 30;
    case "90D":
      return 90;
    case "6M":
      return 182;
    case "1Y":
      return 365;
    case "ALL":
      return null;
  }
}

export function filterByRange(timeline: DayRow[], range: RangeKey, now = new Date()): DayRow[] {
  const days = rangeToDays(range);
  if (days === null) return timeline;
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  return timeline.filter((row) => row.date >= cutoffKey);
}

export function sumField(rows: DayRow[], field: keyof Omit<DayRow, "date">): number {
  return rows.reduce((sum, r) => sum + r[field], 0);
}

export function lastNDays(timeline: DayRow[], n: number, endExclusiveFrom?: string): DayRow[] {
  const rows = endExclusiveFrom ? timeline.filter((r) => r.date < endExclusiveFrom) : timeline;
  return rows.slice(-n);
}

export interface GrowthResult {
  currentTotal: number;
  previousTotal: number;
  percent: number | null; // null when there's no previous-period baseline to compare against
}

/** Compares the sum of the trailing `windowDays` against the `windowDays` before that. */
export function periodOverPeriodGrowth(
  timeline: DayRow[],
  field: keyof Omit<DayRow, "date">,
  windowDays: number
): GrowthResult {
  const current = timeline.slice(-windowDays);
  const previous = timeline.slice(-windowDays * 2, -windowDays);
  const currentTotal = sumField(current, field);
  const previousTotal = sumField(previous, field);
  if (previous.length === 0 || previousTotal === 0) {
    return { currentTotal, previousTotal, percent: previousTotal === 0 && currentTotal > 0 ? null : null };
  }
  const percent = ((currentTotal - previousTotal) / previousTotal) * 100;
  return { currentTotal, previousTotal, percent };
}

export function average(rows: DayRow[], field: keyof Omit<DayRow, "date">): number {
  if (rows.length === 0) return 0;
  return sumField(rows, field) / rows.length;
}

export interface PeakDay {
  date: string;
  value: number;
}

export function peakDay(timeline: DayRow[], field: keyof Omit<DayRow, "date">): PeakDay | null {
  if (timeline.length === 0) return null;
  let best = timeline[0];
  for (const row of timeline) {
    if (row[field] > best[field]) best = row;
  }
  return { date: best.date, value: best[field] };
}

export interface PeakMonth {
  month: string; // YYYY-MM
  value: number;
}

export function peakMonth(timeline: DayRow[], field: keyof Omit<DayRow, "date">): PeakMonth | null {
  if (timeline.length === 0) return null;
  const byMonth = new Map<string, number>();
  for (const row of timeline) {
    const month = row.date.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + row[field]);
  }
  let bestMonth = "";
  let bestValue = -Infinity;
  for (const [month, value] of byMonth) {
    if (value > bestValue) {
      bestValue = value;
      bestMonth = month;
    }
  }
  return bestMonth ? { month: bestMonth, value: bestValue } : null;
}

export function formatDate(dateKey: string): string {
  const d = new Date(dateKey + "T00:00:00Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function formatMonth(monthKey: string): string {
  const d = new Date(monthKey + "-01T00:00:00Z");
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
