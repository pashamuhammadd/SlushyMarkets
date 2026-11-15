import { VISIBLE_BARS, type Bar } from "../market";
import type { ChartMarker, ChartModel, LayerSettings, Preset, ReadoutItem, SonicEvent, SonificationMode } from "../types";
import type { VoiceId } from "../voices";
import { annotateSwings } from "./fractals";

/**
 * Two-wall sonar, from Slushy's "New sound concepts" video (15 November 2026). Provisional until
 * Slushy sends the exact rules. Measured from the video's audio:
 * - every bar plays a low wood tone (about 210 Hz) at the start and a high wood tone (about
 *   420 Hz) 0.19 s later
 * - their loudness crossfades with the range position p (0 = low wall, 1 = high wall):
 *   low = F + (1 - F)(1 - p), high = F + (1 - F) p, with a floor F of about 0.14
 *   (at p = 0.5 both sit near 57 percent, at a wall the far tone drops to about 14 percent)
 *
 * Our choice for the walls (Slushy listed swings, support and resistance and the POC as uses):
 * the most recent CONFIRMED swing high and swing low, using the same rule as the Fractals mode,
 * counting only swings that stand out: a swing high must also be the highest high of the
 * WALL_LOOKBACK bars before it (a swing low the lowest low). Without this, tiny two-bar swings
 * put the walls so close together that the balance flips on every bar.
 * A wall only moves on the bar where a new swing is confirmed, so nothing comes from the future.
 * A close beyond a wall plays a breakout chime pair, like Sonar Bands.
 */

export const WALL_SOUND = { lowHz: 210, highHz: 420, highOffsetSec: 0.19, floor: 0.14, amp: 2 } as const;
export const WALL_LOOKBACK = 10;

/** True when a swing at `pivot` is the most extreme of the WALL_LOOKBACK bars before it. */
export function standsOut(series: readonly Bar[], pivot: number, direction: 1 | -1): boolean {
  const before = series.slice(Math.max(0, pivot - WALL_LOOKBACK), pivot);
  if (before.length < WALL_LOOKBACK) return false;
  return direction === 1 ? before.every((b) => b.high < series[pivot].high) : before.every((b) => b.low > series[pivot].low);
}
export const WALL_COLORS = { low: "#44D9A4", high: "#FF6B8B", breakout: "#FFFFFF", moved: "#B79BFF" } as const;

export type TwoWallAnalysis = {
  bars: Bar[];
  lower: number[];
  upper: number[];
  /** Range position of the close, clamped to 0..1. */
  position: number[];
  /** 1 = closed above the upper wall after being inside, -1 below the lower wall, 0 otherwise. */
  breakout: number[];
  /** Which wall moved on this bar because a new swing was confirmed. */
  moved: ("lower" | "upper" | null)[];
};

export function rangePosition(close: number, lower: number, upper: number): number {
  if (!(upper > lower)) return 0.5;
  return Math.min(1, Math.max(0, (close - lower) / (upper - lower)));
}

export function wallLoudness(side: "low" | "high", position: number, floor: number = WALL_SOUND.floor): number {
  const weight = side === "low" ? 1 - position : position;
  return floor + (1 - floor) * weight;
}

export function analyzeTwoWall(series: readonly Bar[]): TwoWallAnalysis {
  const { events } = annotateSwings(series);
  const start = Math.max(0, series.length - VISIBLE_BARS);
  // Until the first swings are confirmed (inside the warm up), the walls are the first bar's range.
  let swingHigh = series[0]?.high ?? 0;
  let swingLow = series[0]?.low ?? 0;
  let state = 0;
  const out: TwoWallAnalysis = { bars: [], lower: [], upper: [], position: [], breakout: [], moved: [] };
  series.forEach((bar, t) => {
    let moved: "lower" | "upper" | null = null;
    for (const e of events[t]) {
      if (e.stage !== "confirm" || !standsOut(series, e.pivot, e.direction)) continue;
      if (e.direction === 1) {
        swingHigh = e.level;
        moved = "upper";
      } else {
        swingLow = e.level;
        moved = moved ?? "lower";
      }
    }
    const lower = Math.min(swingLow, swingHigh);
    const upper = Math.max(swingLow, swingHigh);
    const now = bar.close > upper ? 1 : bar.close < lower ? -1 : 0;
    const breakout = now !== 0 && now !== state ? now : 0;
    state = now;
    if (t < start) return;
    out.bars.push(bar);
    out.lower.push(lower);
    out.upper.push(upper);
    out.position.push(rangePosition(bar.close, lower, upper));
    out.breakout.push(breakout);
    out.moved.push(moved);
  });
  return out;
}

export function twoWallEvents(layerId: string, index: number, a: TwoWallAnalysis): SonicEvent[] {
  const p = a.position[index];
  switch (layerId) {
    case "low":
      return [{ offsetSec: 0, hz: WALL_SOUND.lowHz, amp: WALL_SOUND.amp * wallLoudness("low", p), durationSec: 0.2 }];
    case "high":
      return [{ offsetSec: WALL_SOUND.highOffsetSec, hz: WALL_SOUND.highHz, amp: WALL_SOUND.amp * wallLoudness("high", p), durationSec: 0.2 }];
    case "breakout": {
      const dir = a.breakout[index];
      if (dir === 0) return [];
      const [first, second] = dir > 0 ? [880, 1174.66] : [660, 440];
      return [
        { offsetSec: 0.3, hz: first, amp: 0.9, durationSec: 0.12 },
        { offsetSec: 0.39, hz: second, amp: 0.9, durationSec: 0.14 },
      ];
    }
    case "moved":
      return a.moved[index] ? [{ offsetSec: 0.42, hz: a.moved[index] === "upper" ? 520 : 300, amp: 0.4, durationSec: 0.08 }] : [];
    default:
      return [];
  }
}

export function twoWallChart(a: TwoWallAnalysis): ChartModel {
  const markers: ChartMarker[] = [];
  a.breakout.forEach((d, i) => {
    if (d !== 0) markers.push({ index: i, price: a.bars[i].close, kind: d > 0 ? "up" : "down" });
  });
  a.moved.forEach((m, i) => {
    if (m) markers.push({ index: i, price: m === "upper" ? a.upper[i] : a.lower[i], kind: "candidate", direction: m === "upper" ? 1 : -1 });
  });
  return {
    bars: a.bars,
    lines: [
      { id: "upper", label: "High wall (last confirmed swing high)", color: WALL_COLORS.high, values: a.upper, step: true },
      { id: "lower", label: "Low wall (last confirmed swing low)", color: WALL_COLORS.low, values: a.lower, step: true },
    ],
    markers,
    description:
      "Simulated candles between two step lines: the pink high wall is the last confirmed swing high, the mint low wall the last confirmed swing low. Rings mark closes beyond a wall, small dots mark where a wall moved.",
  };
}

export function twoWallReadout(index: number, a: TwoWallAnalysis): ReadoutItem[] {
  const p = a.position[index];
  const pct = Math.round(p * 100);
  const close = a.bars[index].close;
  const where = close > a.upper[index] ? "above the high wall" : close < a.lower[index] ? "below the low wall" : `${pct}% of the way from the low wall to the high wall`;
  return [
    { id: "low", label: "Low wall", color: WALL_COLORS.low, loudness: wallLoudness("low", p), text: `Wall at ${a.lower[index].toFixed(2)}. Price is ${where}.` },
    { id: "high", label: "High wall", color: WALL_COLORS.high, loudness: wallLoudness("high", p), text: `Wall at ${a.upper[index].toFixed(2)}. Range position ${pct}%.` },
    {
      id: "breakout",
      label: "Beyond a wall",
      color: WALL_COLORS.breakout,
      loudness: a.breakout[index] !== 0 ? 0.9 : 0,
      text: a.breakout[index] > 0 ? "Closed above the high wall. Chime." : a.breakout[index] < 0 ? "Closed below the low wall. Chime." : "No new close beyond a wall.",
    },
    {
      id: "moved",
      label: "Wall moved",
      color: WALL_COLORS.moved,
      loudness: a.moved[index] ? 0.4 : 0,
      text: a.moved[index] ? `A new swing ${a.moved[index] === "upper" ? "high" : "low"} was confirmed, so the ${a.moved[index] === "upper" ? "high" : "low"} wall moved.` : "Walls unchanged.",
    },
  ];
}

function settings(voice: VoiceId, extra: Partial<LayerSettings> = {}): LayerSettings {
  return { voice, rate: 2, gain: 0.7, mute: false, solo: false, ...extra };
}
const quiet = { mute: true };

export const TWO_WALL_PRESETS: readonly Preset[] = [
  {
    id: "slushy",
    label: "Slushy's two walls",
    description: "The concept mix: a low wood tone for the low wall and a high wood tone for the high wall, louder the closer price is. A chime when price closes beyond a wall.",
    layers: { low: settings("wall-wood"), high: settings("wall-wood"), breakout: settings("chime"), moved: settings("tuned-wood", quiet) },
  },
  {
    id: "walls-only",
    label: "Walls only",
    description: "Just the two wood tones. Listen to the balance between them to hear where price sits in the range.",
    layers: { low: settings("wall-wood"), high: settings("wall-wood"), breakout: settings("chime", quiet), moved: settings("tuned-wood", quiet) },
  },
  {
    id: "moving-walls",
    label: "Walls that move",
    description: "Adds a soft knock whenever a new swing is confirmed and a wall jumps to a new level.",
    layers: { low: settings("wall-wood"), high: settings("wall-wood"), breakout: settings("chime"), moved: settings("tuned-wood") },
  },
];

export const twoWallMode: SonificationMode<TwoWallAnalysis> = {
  id: "two-wall",
  title: "Two-wall sonar",
  layers: [
    { id: "low", label: "Low wall", color: WALL_COLORS.low, describes: "A low wood tone at the start of each bar, louder the closer price is to the low wall.", detail: `About ${WALL_SOUND.lowHz} Hz`, previewHz: WALL_SOUND.lowHz, kind: "continuous" },
    { id: "high", label: "High wall", color: WALL_COLORS.high, describes: "A high wood tone a moment later, louder the closer price is to the high wall.", detail: `About ${WALL_SOUND.highHz} Hz`, previewHz: WALL_SOUND.highHz, kind: "continuous" },
    { id: "breakout", label: "Beyond a wall", color: WALL_COLORS.breakout, describes: "A rising chime pair for a close above the high wall, a falling pair for a close below the low wall.", detail: "Chime pair", previewHz: 880, kind: "event" },
    { id: "moved", label: "Wall moved", color: WALL_COLORS.moved, describes: "A soft knock when a new swing is confirmed and a wall jumps.", detail: "Optional", previewHz: 520, kind: "event" },
  ],
  presets: TWO_WALL_PRESETS,
  toggles: [],
  analyze: analyzeTwoWall,
  events: twoWallEvents,
  chart: twoWallChart,
  readout: twoWallReadout,
};
