import type { PropsWithChildren, HTMLAttributes } from "react";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * The signature structural element of this dashboard: a notched-corner panel
 * (clip-path cut on the top-left and bottom-right corners) instead of the
 * generic large-radius rounded card. Every data surface — metric cards, chart
 * frames, list panels — is built from this one shape, which is what gives the
 * layout its distinct, architectural identity.
 */
export function Panel({ className = "", children, ...rest }: PropsWithChildren<PanelProps>) {
  return (
    <div
      className={`notch bg-surface border border-hairline ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
