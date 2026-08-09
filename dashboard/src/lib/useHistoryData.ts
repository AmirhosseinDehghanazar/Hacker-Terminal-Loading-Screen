import { useCallback, useEffect, useState } from "react";
import type { HistoryDataset } from "./types";

export type LoadState = "loading" | "ready" | "empty" | "error";

export interface UseHistoryDataResult {
  data: HistoryDataset | null;
  state: LoadState;
  error: string | null;
  reload: () => void;
}

const DATA_URL = `${import.meta.env.BASE_URL}history.json`;

export function useHistoryData(): UseHistoryDataResult {
  const [data, setData] = useState<HistoryDataset | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    fetch(`${DATA_URL}?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load dataset (${res.status})`);
        return res.json();
      })
      .then((json: HistoryDataset) => {
        if (cancelled) return;
        setData(json);
        const hasAnyData =
          Object.keys(json.daily?.clones ?? {}).length > 0 || Object.keys(json.daily?.views ?? {}).length > 0;
        setState(hasAnyData ? "ready" : "empty");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return { data, state, error, reload };
}
