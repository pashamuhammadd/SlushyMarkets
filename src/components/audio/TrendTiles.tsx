import { ArrowDownRight, ArrowRight, ArrowUpRight, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { createRng } from "@/lib/simulations/trades";

type Direction = "bullish" | "sideways" | "bearish";

/**
 * PROVISIONAL CONCEPT. Register per timeframe follows Slushy's earlier demo
 * (Daily low, 4H middle, 15m high). Exact sound mapping awaits product owner approval.
 */
export const TREND_TILES = [
  { id: "daily", label: "Daily trend", register: "Low register", direction: "bullish", seed: 11, color: "#37D5FA" },
  { id: "4h", label: "4H trend", register: "Middle register", direction: "sideways", seed: 23, color: "#8B5CF6" },
  { id: "15m", label: "15m trend", register: "High register", direction: "bearish", seed: 37, color: "#F05DEB" },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  register: string;
  direction: Direction;
  seed: number;
  color: string;
}>;

const SLOPE: Record<Direction, number> = { bullish: -1.6, sideways: 0, bearish: 1.6 };

/** Deterministic illustrative line, not market data. */
function trendPath(direction: Direction, seed: number, width = 240, height = 80, points = 28) {
  const rng = createRng(seed);
  let y = height / 2 - SLOPE[direction] * (points / 2) * 0.9;
  const step = width / (points - 1);
  const coords: string[] = [];
  for (let i = 0; i < points; i += 1) {
    y += SLOPE[direction] + (rng() - 0.5) * 9;
    y = Math.min(Math.max(y, 8), height - 8);
    coords.push(`${(i * step).toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${coords.join(" L")}`;
}

const directionUi: Record<Direction, { tone: "success" | "neutral" | "danger"; icon: typeof ArrowUpRight; text: string }> = {
  bullish: { tone: "success", icon: ArrowUpRight, text: "Bullish" },
  sideways: { tone: "neutral", icon: ArrowRight, text: "Sideways" },
  bearish: { tone: "danger", icon: ArrowDownRight, text: "Bearish" },
};

export function TrendTiles() {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {TREND_TILES.map((tile) => {
        const ui = directionUi[tile.direction];
        const Icon = ui.icon;
        const d = trendPath(tile.direction, tile.seed);
        return (
          <li key={tile.id} className="rounded-2xl bg-navy-950/55 p-4 ring-1 ring-white/5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-sans text-sm font-semibold text-ink">{tile.label}</h3>
              <span className="flex items-center gap-1 text-xs text-muted">
                <Music2 aria-hidden="true" className="size-3.5" style={{ color: tile.color }} />
                {tile.register}
              </span>
            </div>
            <svg viewBox="0 0 240 80" className="mt-3 h-20 w-full" aria-hidden="true" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`fill-${tile.id}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={tile.color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={tile.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${d} L240,80 L0,80 Z`} fill={`url(#fill-${tile.id})`} />
              <path d={d} fill="none" stroke={tile.color} strokeWidth="2.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
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
