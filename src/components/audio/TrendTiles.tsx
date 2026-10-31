import { Music2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SCENARIO, STEP_COUNT } from "@/lib/audio/trend-scenario";
import { TrendSparkline } from "./TrendSparkline";
import { STATE_UI } from "./trend-state-ui";

/**
 * Static overview of the Three Trends scenario (end of the demo).
 * Uses the same synthetic series as the Audio Lab player. Not market data.
 */
export function TrendTiles() {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {SCENARIO.map((series) => {
        const tf = series.timeframe;
        const ui = STATE_UI[series.states[STEP_COUNT - 1]];
        const Icon = ui.icon;
        return (
          <li key={tf.id} className="rounded-2xl bg-navy-950/55 p-4 ring-1 ring-white/5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-sans text-sm font-semibold text-ink">{tf.label}</h3>
              <span className="flex items-center gap-1 text-xs text-muted">
                <Music2 aria-hidden="true" className="size-3.5" style={{ color: tf.color }} />
                {tf.register}
              </span>
            </div>
            <TrendSparkline series={series} className="mt-3 h-20 w-full" />
            <div className="mt-3">
              <Badge tone={ui.tone}>
                <Icon aria-hidden="true" className="size-3.5" />
                {ui.text}
              </Badge>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
