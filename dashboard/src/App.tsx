import { useMemo, useState } from "react";
import { useHistoryData } from "./lib/useHistoryData";
import { EmptyState, ErrorState, LoadingSkeleton } from "./components/States";
import { Header } from "./components/Header";
import { Panel } from "./components/Panel";
import { MetricCard } from "./components/MetricCard";
import { RangeSelector, ChartModeToggle } from "./components/Selectors";
import { TrafficChart } from "./components/TrafficChart";
import { GrowthInsights } from "./components/GrowthInsights";
import { TrafficSources } from "./components/TrafficSources";
import { PopularContent } from "./components/PopularContent";
import { RepoOverview } from "./components/RepoOverview";
import { buildTimeline, filterByRange, lifetimeTotal, periodOverPeriodGrowth } from "./lib/calculations";
import { exportCsv, exportJson } from "./lib/export";
import type { ChartMode, RangeKey } from "./lib/types";

export default function App() {
  const { data, state, error, reload } = useHistoryData();
  const [range, setRange] = useState<RangeKey>("30D");
  const [mode, setMode] = useState<ChartMode>("clones");

  const timeline = useMemo(() => (data ? buildTimeline(data.daily.clones, data.daily.views) : []), [data]);
  const filtered = useMemo(() => filterByRange(timeline, range), [timeline, range]);

  if (state === "loading") return <LoadingSkeleton />;
  if (state === "error") return <ErrorState message={error ?? "Unknown error"} onRetry={reload} />;
  if (!data) return null;

  if (state === "empty") {
    return (
      <>
        <Header
          dataset={data}
          onExportCsv={() => exportCsv(timeline, data.repository.name || "repository")}
          onExportJson={() => exportJson(timeline, data.repository.name || "repository")}
        />
        <EmptyState trackingSince={data.repository.trackingSince} />
        <Footer />
      </>
    );
  }

  const lifetimeClones = lifetimeTotal(data.daily.clones, "count");
  const lifetimeCloners = lifetimeTotal(data.daily.clones, "uniques");
  const lifetimeViews = lifetimeTotal(data.daily.views, "count");
  const lifetimeVisitors = lifetimeTotal(data.daily.views, "uniques");

  const clonesGrowth = periodOverPeriodGrowth(timeline, "clones", 30);
  const cloners30 = periodOverPeriodGrowth(timeline, "cloners", 30);
  const viewsGrowth = periodOverPeriodGrowth(timeline, "views", 30);
  const visitorsGrowth = periodOverPeriodGrowth(timeline, "visitors", 30);

  return (
    <>
      <Header
        dataset={data}
        onExportCsv={() => exportCsv(timeline, data.repository.name || "repository")}
        onExportJson={() => exportJson(timeline, data.repository.name || "repository")}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section aria-labelledby="lifetime-heading">
          <h2 id="lifetime-heading" className="text-[11px] uppercase tracking-[0.16em] text-muted font-body mb-3">
            Lifetime
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Clones" value={lifetimeClones} growthPercent={clonesGrowth.percent} sublabel="vs prior 30d" accent="amber" />
            <MetricCard label="Unique cloners" value={lifetimeCloners} growthPercent={cloners30.percent} sublabel="vs prior 30d" />
            <MetricCard label="Views" value={lifetimeViews} growthPercent={viewsGrowth.percent} sublabel="vs prior 30d" accent="amber" />
            <MetricCard label="Unique visitors" value={lifetimeVisitors} growthPercent={visitorsGrowth.percent} sublabel="vs prior 30d" />
          </div>
        </section>

        <Panel className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
            <div>
              <h3 className="font-display text-sm font-semibold text-ink">Traffic history</h3>
              <p className="text-xs text-faint font-body mt-0.5">
                {range === "ALL" ? "Complete collected history" : `Trailing ${range.toLowerCase()}`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <ChartModeToggle value={mode} onChange={setMode} />
              <RangeSelector value={range} onChange={setRange} />
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-faint font-body">
              No data in this range yet.
            </div>
          ) : (
            <TrafficChart rows={filtered} mode={mode} />
          )}
        </Panel>

        <GrowthInsights timeline={timeline} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrafficSources snapshots={data.referrerSnapshots} />
          <PopularContent snapshots={data.contentSnapshots} />
        </div>

        <RepoOverview dataset={data} />
      </main>

      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-6 border-t border-hairline">
      <p className="text-xs text-faint font-body leading-relaxed max-w-2xl">
        Historical traffic is accumulated from GitHub's available traffic data. Tracking begins when this
        analytics system is activated, and lifetime totals reflect data collected since then. Clone and view
        counts are as GitHub reports them and may include automated traffic.
      </p>
    </footer>
  );
}
