/**
 * Thin GitHub REST API client using plain fetch (no extra runtime dependency).
 * The token is only ever read from process.env on the server/Action side and is
 * never written into any file this script produces.
 */

const API = "https://api.github.com";

export interface GithubClientOptions {
  owner: string;
  repo: string;
  token: string;
}

async function ghFetch(path: string, token: string) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "repo-analytics-collector",
    },
  });
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      throw new RateLimitError(`GitHub API rate limit reached for ${path}`);
    }
  }
  if (res.status === 401) {
    throw new AuthError(`GitHub authentication failed for ${path}`);
  }
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status} for ${path}: ${await res.text().catch(() => "")}`);
  }
  return res.json();
}

export class RateLimitError extends Error {}
export class AuthError extends Error {}

export async function fetchRepo({ owner, repo, token }: GithubClientOptions) {
  return ghFetch(`/repos/${owner}/${repo}`, token);
}

export async function fetchClones({ owner, repo, token }: GithubClientOptions) {
  const data = await ghFetch(`/repos/${owner}/${repo}/traffic/clones?per=day`, token);
  return (data?.clones ?? []) as { timestamp: string; count: number; uniques: number }[];
}

export async function fetchViews({ owner, repo, token }: GithubClientOptions) {
  const data = await ghFetch(`/repos/${owner}/${repo}/traffic/views?per=day`, token);
  return (data?.views ?? []) as { timestamp: string; count: number; uniques: number }[];
}

export async function fetchReferrers({ owner, repo, token }: GithubClientOptions) {
  const data = await ghFetch(`/repos/${owner}/${repo}/traffic/popular/referrers`, token);
  return (data ?? []) as { referrer: string; count: number; uniques: number }[];
}

export async function fetchPopularPaths({ owner, repo, token }: GithubClientOptions) {
  const data = await ghFetch(`/repos/${owner}/${repo}/traffic/popular/paths`, token);
  return ((data ?? []) as { path: string; title: string; count: number; uniques: number }[]).map((p) => ({
    path: p.path,
    title: p.title,
    count: p.count,
    uniques: p.uniques,
  }));
}

export async function fetchReleases({ owner, repo, token }: GithubClientOptions) {
  const data = await ghFetch(`/repos/${owner}/${repo}/releases?per_page=30`, token);
  return (data ?? []) as any[];
}

export async function fetchOpenPullRequestCount({ owner, repo, token }: GithubClientOptions) {
  const data = await ghFetch(
    `/search/issues?q=${encodeURIComponent(`repo:${owner}/${repo} type:pr state:open`)}`,
    token
  );
  return (data?.total_count ?? 0) as number;
}
