import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Lightweight local .env loader (no dependency needed). GitHub Actions sets real
// env vars directly via `env:`, so this only matters for `npm run collect` locally.
function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = value;
  }
}
loadLocalEnv();
import {
  fetchRepo,
  fetchClones,
  fetchViews,
  fetchReferrers,
  fetchPopularPaths,
  fetchReleases,
  fetchOpenPullRequestCount,
  RateLimitError,
  AuthError,
} from "./github.js";
import { applyCollection } from "./merge.js";
import { emptyDataset, type HistoryDataset, type RepositoryMeta } from "./types.js";

const DATA_PATH = process.env.HISTORY_PATH ?? path.resolve(process.cwd(), "../data/history.json");

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

async function loadDataset(repository: RepositoryMeta): Promise<HistoryDataset> {
  if (!existsSync(DATA_PATH)) return emptyDataset(repository);
  try {
    const raw = await readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as HistoryDataset;
    // Preserve the original tracking-since date even as other repo metadata refreshes.
    parsed.repository = { ...repository, trackingSince: parsed.repository.trackingSince };
    return parsed;
  } catch {
    return emptyDataset(repository);
  }
}

async function saveDataset(dataset: HistoryDataset) {
  await mkdir(path.dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, JSON.stringify(dataset, null, 2) + "\n", "utf-8");
}

async function main() {
  const token = requireEnv("GH_ANALYTICS_TOKEN");
  const [owner, repo] = requireEnv("GH_ANALYTICS_REPO").split("/");
  if (!owner || !repo) throw new Error("GH_ANALYTICS_REPO must be in the form owner/repo");

  const ctx = { owner, repo, token };
  const collectedAt = new Date().toISOString();
  const today = collectedAt.slice(0, 10);

  console.log(`[collector] Starting collection for ${owner}/${repo} at ${collectedAt}`);

  let repoJson: any;
  try {
    repoJson = await fetchRepo(ctx);
    if (!repoJson) throw new Error(`Repository ${owner}/${repo} not found or inaccessible`);
  } catch (err) {
    await handleFailure(owner, repo, err);
    return;
  }

  const repository: RepositoryMeta = {
    owner,
    name: repo,
    fullName: repoJson.full_name,
    description: repoJson.description,
    htmlUrl: repoJson.html_url,
    homepage: repoJson.homepage || null,
    language: repoJson.language,
    license: repoJson.license?.spdx_id ?? null,
    createdAt: repoJson.created_at,
    defaultBranch: repoJson.default_branch,
    trackingSince: collectedAt, // overwritten by loadDataset if a dataset already exists
  };

  const dataset = await loadDataset(repository);

  try {
    const [clones, views, referrers, content, releasesRaw, openPRs] = await Promise.all([
      fetchClones(ctx),
      fetchViews(ctx),
      fetchReferrers(ctx).catch(() => []), // referrers/paths require push access; degrade gracefully
      fetchPopularPaths(ctx).catch(() => []),
      fetchReleases(ctx).catch(() => []),
      fetchOpenPullRequestCount(ctx).catch(() => 0),
    ]);

    const updated = applyCollection(dataset, {
      clonesRaw: clones,
      viewsRaw: views,
      referrers: referrers.map((r: any) => ({ referrer: r.referrer, count: r.count, uniques: r.uniques })),
      content: content,
      repoStatsPoint: {
        date: today,
        stars: repoJson.stargazers_count ?? 0,
        forks: repoJson.forks_count ?? 0,
        watchers: repoJson.subscribers_count ?? repoJson.watchers_count ?? 0,
        openIssues: repoJson.open_issues_count ?? 0,
        openPRs,
      },
      releases: releasesRaw.map((r: any) => ({
        tagName: r.tag_name,
        name: r.name,
        publishedAt: r.published_at,
        downloadCount: (r.assets ?? []).reduce((sum: number, a: any) => sum + (a.download_count ?? 0), 0),
        htmlUrl: r.html_url,
      })),
      collectedAt,
    });

    await saveDataset(updated);
    console.log(`[collector] Success. Dataset now covers ${Object.keys(updated.daily.clones).length} clone-days.`);
  } catch (err) {
    await handleFailure(owner, repo, err, dataset);
  }
}

async function handleFailure(owner: string, repo: string, err: unknown, dataset?: HistoryDataset) {
  const message = err instanceof Error ? err.message : String(err);
  const status = err instanceof RateLimitError ? "rate_limited" : err instanceof AuthError ? "auth_error" : "error";
  console.error(`[collector] Failed (${status}): ${message}`);
  if (dataset) {
    dataset.lastSyncStatus = "error";
    dataset.lastSyncError = message;
    await saveDataset(dataset);
  }
  process.exitCode = 1;
}

main().catch((err) => {
  console.error("[collector] Fatal error:", err);
  process.exitCode = 1;
});
