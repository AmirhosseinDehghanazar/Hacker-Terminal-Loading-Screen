import { Panel } from "./Panel";

export function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="notch bg-surface border border-hairline h-28 animate-pulse" />
        ))}
      </div>
      <div className="notch bg-surface border border-hairline h-[340px] animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="notch bg-surface border border-hairline h-64 animate-pulse" />
        <div className="notch bg-surface border border-hairline h-64 animate-pulse" />
      </div>
    </div>
  );
}

export function EmptyState({ trackingSince }: { trackingSince?: string | null }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex justify-center">
      <Panel className="p-10 max-w-lg text-center">
        <div className="font-display text-lg font-semibold text-ink mb-3">
          We're collecting your first dataset.
        </div>
        <p className="text-sm text-muted font-body leading-relaxed">
          Historical analytics will appear here as your repository generates traffic and the
          collector runs its next cycle.
          {trackingSince ? (
            <>
              {" "}
              Tracking has been active since{" "}
              {new Date(trackingSince).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}.
            </>
          ) : null}
        </p>
      </Panel>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex justify-center">
      <Panel className="p-10 max-w-lg text-center">
        <div className="font-display text-lg font-semibold text-ink mb-3">
          We couldn't load your analytics
        </div>
        <p className="text-sm text-muted font-body leading-relaxed mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="notch-sm px-4 py-2 text-xs font-mono font-medium bg-amber text-obsidian hover:bg-amber-deep transition-colors"
        >
          Try again
        </button>
      </Panel>
    </div>
  );
}
