import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeDailySeries, applyCollection } from "./merge.js";
import { emptyDataset, type DailySeries } from "./types.js";

test("overlapping snapshots merge to correct totals, not additive totals", () => {
  const snapshotA = {
    "2026-08-01": { count: 10, uniques: 8 },
    "2026-08-02": { count: 14, uniques: 11 },
    "2026-08-03": { count: 20, uniques: 15 },
  };
  const snapshotB = {
    "2026-08-02": { count: 14, uniques: 11 },
    "2026-08-03": { count: 20, uniques: 15 },
    "2026-08-04": { count: 31, uniques: 22 },
  };

  const merged = mergeDailySeries(mergeDailySeries({}, snapshotA), snapshotB);

  assert.equal(merged["2026-08-01"].count, 10);
  assert.equal(merged["2026-08-02"].count, 14); // NOT 28
  assert.equal(merged["2026-08-03"].count, 20); // NOT 40
  assert.equal(merged["2026-08-04"].count, 31);
});

test("running the same collection twice does not inflate totals", () => {
  const repository = {
    owner: "acme",
    name: "widget",
    fullName: "acme/widget",
    description: null,
    htmlUrl: "https://github.com/acme/widget",
    homepage: null,
    language: "TypeScript",
    license: "MIT",
    createdAt: "2026-01-01T00:00:00.000Z",
    defaultBranch: "main",
    trackingSince: "2026-08-01T00:00:00.000Z",
  };

  const input = {
    clonesRaw: [{ timestamp: "2026-08-09T00:00:00Z", count: 12, uniques: 9 }],
    viewsRaw: [{ timestamp: "2026-08-09T00:00:00Z", count: 44, uniques: 31 }],
    referrers: [],
    content: [],
    repoStatsPoint: { date: "2026-08-09", stars: 5, forks: 1, watchers: 5, openIssues: 0, openPRs: 0 },
    releases: [],
    collectedAt: "2026-08-09T12:00:00.000Z",
  };

  let dataset = emptyDataset(repository);
  dataset = applyCollection(dataset, input);
  dataset = applyCollection(dataset, input); // rerun, e.g. Action retried

  assert.equal(dataset.daily.clones["2026-08-09"].count, 12);
  assert.equal(dataset.daily.views["2026-08-09"].count, 44);
  assert.equal(dataset.repoStats.length, 1); // same-day rerun overwrites, not duplicates
});

test("a later, higher count for the same day (window shifted forward) is adopted", () => {
  let series: DailySeries = { "2026-08-05": { count: 5, uniques: 4 } };
  series = mergeDailySeries(series, { "2026-08-05": { count: 9, uniques: 7 } });
  assert.equal(series["2026-08-05"].count, 9);
  assert.equal(series["2026-08-05"].uniques, 7);
});
