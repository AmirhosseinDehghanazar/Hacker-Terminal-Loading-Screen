import { Panel } from "./Panel";
import {
  average,
  formatDate,
  formatMonth,
  formatNumber,
  peakDay,
  peakMonth,
  periodOverPeriodGrowth,
  type DayRow,
} from "../lib/calculations";

export function GrowthInsights({ timeline }: { timeline: DayRow[] }) {
  const g7 = periodOverPeriodGrowth(timeline, "clones", 7);
  const g30 = periodOverPeriodGrowth(timeline, "clones", 30);
  const g90 = periodOverPeriodGrowth(timeline, "clones", 90);
  const avgClones = average(timeline.slice(-30), "clones");
  const avgViews = average(timeline.slice(-30), "views");
  const bestClonesDay = peakDay(timeline, "clones");
  const bestViewsMonth = peakMonth(timeline, "views");

  return (
    <Panel className="p-5 sm:p-6">
      <h3 className="font-display text-sm font-semibold text-ink mb-5">Growth insights</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <GrowthStat label="7-day growth" value={g7.percent} />
        <GrowthStat label="30-day growth" value={g30.percent} />
        <GrowthStat label="90-day growth" value={g90.percent} />
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted mb-1.5">Avg. daily</div>
          <div className="font-mono tnum text-lg text-ink">
            {formatNumber(avgClones)} <span className="text-muted text-xs">clones</span>
          </div>
          <div className="font-mono tnum text-sm text-muted mt-0.5">{formatNumber(avgViews)} views</div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-6 border-t border-hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted mb-1.5">Best day (clones)</div>
          {bestClonesDay ? (
            <div className="flex items-baseline gap-2">
              <span className="font-mono tnum text-lg text-amber">{formatNumber(bestClonesDay.value)}</span>
              <span className="text-sm text-muted font-body">{formatDate(bestClonesDay.date)}</span>
            </div>
          ) : (
            <span className="text-sm text-faint">Not enough data yet</span>
          )}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted mb-1.5">Best month (views)</div>
          {bestViewsMonth ? (
            <div className="flex items-baseline gap-2">
              <span className="font-mono tnum text-lg text-amber">{formatNumber(bestViewsMonth.value)}</span>
              <span className="text-sm text-muted font-body">{formatMonth(bestViewsMonth.month)}</span>
            </div>
          ) : (
            <span className="text-sm text-faint">Not enough data yet</span>
          )}
        </div>
      </div>
    </Panel>
  );
}

function GrowthStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted mb-1.5">{label}</div>
      {value === null ? (
        <div className="text-sm text-faint font-body">Needs more history</div>
      ) : (
        <div className={`font-mono tnum text-lg ${value >= 0 ? "text-amber" : "text-clay"}`}>
          {value >= 0 ? "+" : ""}
          {value.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
