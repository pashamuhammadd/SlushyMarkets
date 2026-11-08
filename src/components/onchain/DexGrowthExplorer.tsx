"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { formatUsd } from "@/lib/format";
import { volumeGrowthPercent } from "@/lib/onchain/metrics";

const SLIDER = { min: 0, max: 2_000_000, step: 50_000 } as const;

/** DEX Volume Growth (7-day) with invented amounts. Dragging the earlier week to $0 shows the zero base case. */
export function DexGrowthExplorer() {
  const [recent, setRecent] = useState(1_200_000);
  const [previous, setPrevious] = useState(1_000_000);
  const recentId = useId();
  const previousId = useId();
  const growth = volumeGrowthPercent(recent, previous);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-ink">DEX Volume Growth (7-day)</h3>
        <Badge tone="violet">Simulated example</Badge>
      </div>
      <p className="rounded-lg bg-navy-950/60 px-3 py-2 font-mono text-xs text-cyan-soft ring-1 ring-white/5">
        Growth (%) = ((recent 7-day USD swap volume / previous 7-day USD swap volume) - 1) x 100
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor={recentId} className="text-sm text-muted">
          Latest 7 days: <span className="font-semibold tabular-nums text-ink">{formatUsd(recent)}</span>
          <input
            id={recentId}
            type="range"
            {...SLIDER}
            value={recent}
            onChange={(e) => setRecent(Number(e.target.value))}
            className="mt-2 h-2 w-full cursor-pointer accent-cyan"
          />
        </label>
        <label htmlFor={previousId} className="text-sm text-muted">
          Previous 7 days: <span className="font-semibold tabular-nums text-ink">{formatUsd(previous)}</span>
          <input
            id={previousId}
            type="range"
            {...SLIDER}
            value={previous}
            onChange={(e) => setPrevious(Number(e.target.value))}
            className="mt-2 h-2 w-full cursor-pointer accent-violet"
          />
        </label>
      </div>
      <p aria-live="polite" className="rounded-2xl bg-navy-950/60 p-4 text-sm text-muted ring-1 ring-white/10">
        {growth.status === "ok" ? (
          <span className="text-lg font-semibold tabular-nums text-ink">
            {growth.percent > 0 ? "+" : ""}
            {growth.percent.toFixed(1)}%
          </span>
        ) : (
          "No growth percentage: the previous 7 days had zero volume, and a comparison against a zero base does not give an ordinary, defined percentage."
        )}
      </p>
    </div>
  );
}
