import { createRng } from "@/lib/simulations/trades";

/**
 * Seeded synthetic market for the Sound Playground.
 *
 * The regime switching walk follows the generator in Slushy's Sound Playground prototype:
 * every 6 to 20 bars the market picks either a ranging regime (pulled back toward an anchor)
 * or a trending regime (constant drift up or down), with its own volatility and rare shocks.
 * The only change is a seeded random generator, so one seed always gives the same chart,
 * on every browser, which keeps audio and chart replays comparable.
 *
 * Prices are simulated units around 100, never real market data.
 */

export type Bar = {
  open: number;
  high: number;
  low: number;
  close: number;
};

export type TimeframeId = "15m" | "1h" | "4h";

export type TimeframeOption = {
  id: TimeframeId;
  label: string;
  /** How many base 15 minute bars make one bar of this timeframe. */
  factor: number;
};

export const TIMEFRAME_OPTIONS: readonly TimeframeOption[] = [
  { id: "15m", label: "15 minutes", factor: 1 },
  { id: "1h", label: "1 hour", factor: 4 },
  { id: "4h", label: "4 hours", factor: 16 },
];

/** Bars that are played and drawn. 60 bars at 0.5 seconds each is a 30 second piece. */
export const VISIBLE_BARS = 60;
/** Extra history before the visible window, so the 50 EMA has settled when playback starts. */
export const WARMUP_BARS = 150;

export function timeframeOption(id: TimeframeId): TimeframeOption {
  const option = TIMEFRAME_OPTIONS.find((t) => t.id === id);
  if (!option) throw new Error(`Unknown timeframe: ${id}`);
  return option;
}

/** Base 15 minute bars from a seed. Same seed and count always give the same bars. */
export function generateBaseBars(seed: number, count: number): Bar[] {
  const rand = createRng(seed);
  // Box-Muller transform for normally distributed noise.
  const normal = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, rand()))) * Math.cos(2 * Math.PI * rand());

  const bars: Bar[] = [];
  let close = 100;
  let drift = 0;
  let vol = 0.45;
  let remaining = 0;
  let anchor = 100;
  let ranging = true;

  for (let i = 0; i < count; i += 1) {
    if (remaining <= 0) {
      remaining = 6 + Math.floor(rand() * 15);
      ranging = rand() < 0.48;
      anchor = close;
      vol = 0.2 + rand() * 0.65;
      drift = ranging ? 0 : (rand() < 0.5 ? -1 : 1) * (0.12 + rand() * 0.4);
    }
    remaining -= 1;
    const open = close;
    const shock = rand() < 0.055 ? normal() * vol * 2.5 : 0;
    close += drift + (ranging ? (anchor - close) * 0.15 : 0) + normal() * vol + shock;
    const high = Math.max(open, close) + rand() * vol * 0.65;
    const low = Math.min(open, close) - rand() * vol * 0.65;
    bars.push({ open, high, low, close });
  }
  return bars;
}

/**
 * Groups consecutive bars into a slower timeframe: open of the first, close of the last,
 * highest high and lowest low. Only complete groups are kept, so no bar is half formed.
 */
export function aggregateBars(bars: readonly Bar[], factor: number): Bar[] {
  if (!Number.isInteger(factor) || factor < 1) throw new Error("factor must be a positive integer");
  if (factor === 1) return bars.map((b) => ({ ...b }));
  const out: Bar[] = [];
  for (let start = 0; start + factor <= bars.length; start += factor) {
    const group = bars.slice(start, start + factor);
    out.push({
      open: group[0].open,
      close: group[group.length - 1].close,
      high: Math.max(...group.map((b) => b.high)),
      low: Math.min(...group.map((b) => b.low)),
    });
  }
  return out;
}

/**
 * The full series for one seed and timeframe: warm up bars followed by the visible bars.
 * Every timeframe is built from the same 15 minute walk, so 1h and 4h are true aggregations.
 */
export function buildMarket(seed: number, timeframe: TimeframeId): Bar[] {
  const { factor } = timeframeOption(timeframe);
  const needed = VISIBLE_BARS + WARMUP_BARS;
  const slowest = Math.max(...TIMEFRAME_OPTIONS.map((t) => t.factor));
  // One fixed length walk per seed: every timeframe ends on the same final 15 minute bar.
  const base = generateBaseBars(seed, needed * slowest);
  return aggregateBars(base, factor).slice(-needed);
}
