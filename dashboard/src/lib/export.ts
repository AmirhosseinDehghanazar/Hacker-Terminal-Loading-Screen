import type { DayRow } from "./calculations";

export function toCsv(rows: DayRow[]): string {
  const header = "date,clones,unique_cloners,views,unique_visitors";
  const lines = rows.map((r) => `${r.date},${r.clones},${r.cloners},${r.views},${r.visitors}`);
  return [header, ...lines].join("\n");
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCsv(rows: DayRow[], repoName: string) {
  downloadFile(`${repoName}-analytics.csv`, toCsv(rows), "text/csv;charset=utf-8");
}

export function exportJson(rows: DayRow[], repoName: string) {
  downloadFile(`${repoName}-analytics.json`, JSON.stringify(rows, null, 2), "application/json");
}
