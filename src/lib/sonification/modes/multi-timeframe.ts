import { efficiencyRatio } from "../indicators";
import { aggregateBars, VISIBLE_BARS, type Bar } from "../market";
import type { ChartMarker, ChartModel, ChartZone, LayerSettings, Preset, ReadoutItem, SonicEvent, SonificationMode } from "../types";
import type { VoiceId } from "../voices";

/**
 * Two or three timeframes. Taken from the "2 or 3 timeframes + indicators" mode of Slushy's
 * Sound Playground prototype (read on 14 November 2026). Provisional until Slushy approves it.
 *
 * - every price layer plays a pentatonic note for a close: higher close, higher note
 *   (scale steps 0 2 4 7 9 12 14 16 19 21 24 semitones, 220 Hz base, 110 Hz for the organ layer)
 * - the chart timeframe layer plays its own close on every bar
 * - slower layers repeat the close of their LAST COMPLETED candle at a steady pulse, so they
 *   never reveal a candle that is still forming
 * - optional indicators on the chart timeframe: drums (105 Hz) while ER(5) is below 0.5,
 *   a wood knock (280 Hz) when MACD (12, 26) crosses zero
 *
 * Adaptations, documented on the page:
 * - the prototype mapped close to pitch from a fixed price of 94. Here the scale spans the
 *   visible price range, so it works on every chart.
 * - our bars last 0.5 s instead of 0.15 s, so slow layers pulse every 4 bars (2 s) instead of
 *   every 8 bars (1.2 s).
 * - the prototype's third layer was Daily. With 60 visible bars that is less than one candle,
 *   so the third layer here is 4 times slower than the chart (1h on the 15m chart).
 */

export const SLOW_FACTORS = { mid: 4, slow: 16 } as const;
export const SLOW_PULSE_BARS = 4;
export const ER_FAST_PERIOD = 5;
export const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24] as const;
export const MTF_SOUND = {
  priceHz: 220,
  organHz: 110,
  drumHz: 105,
  knockHz: 280,
  amp: 0.8,
  fastSec: 0.1,
  midSec: 0.13,
  slowSec: 0.46,
} as const;
export const MTF_COLORS = { fast: "#5EEAD4", mid: "#7DD3FC", slow: "#B79BFF", choppy: "#FFD166", macd: "#FF9F6B" } as const;
const CHOPPY_ZONE = "rgb(255 209 102 / 0.12)";

export type MultiTimeframeAnalysis = {
  bars: Bar[];
  /** Close of the last completed candle of each slower timeframe, per visible bar. */
  midClose: number[];
  slowClose: number[];
  er: number[];
  /** 1 = MACD crossed above zero on this bar, -1 = below, 0 = no cross. */
  macdCross: number[];
  low: number;
  high: number;
};

function ema(values: readonly number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((v, i) => out.push(i === 0 ? v : out[i - 1] + (v - out[i - 1]) * k));
  return out;
}

/** Close of the last fully completed slow candle at series index `t` (null before the first). */
export function lastCompletedClose(slow: readonly Bar[], factor: number, t: number): number | null {
  const completed = Math.floor((t + 1) / factor) - 1;
  return completed >= 0 && completed < slow.length ? slow[completed].close : null;
}

export function analyzeMultiTimeframe(series: readonly Bar[]): MultiTimeframeAnalysis {
  const start = Math.max(0, series.length - VISIBLE_BARS);
  const bars = series.slice(start);
  const closes = series.map((b) => b.close);
  const mid = aggregateBars(series, SLOW_FACTORS.mid);
  const slow = aggregateBars(series, SLOW_FACTORS.slow);
  const at = (agg: Bar[], factor: number) =>
    bars.map((b, i) => lastCompletedClose(agg, factor, start + i) ?? series[0].open);
  const slowEma = ema(closes, 26);
  const macd = ema(closes, 12).map((f, i) => f - slowEma[i]);
  const macdCross = bars.map((_, i) => {
    const t = start + i;
    if (t === 0) return 0;
    if (macd[t - 1] <= 0 && macd[t] > 0) return 1;
    if (macd[t - 1] >= 0 && macd[t] < 0) return -1;
    return 0;
  });
  const er = efficiencyRatio(closes, ER_FAST_PERIOD)
    .slice(start)
    .map((v) => v ?? 1);
  const midClose = at(mid, SLOW_FACTORS.mid);
  const slowClose = at(slow, SLOW_FACTORS.slow);
  const all = bars.flatMap((b) => [b.high, b.low]).concat(midClose, slowClose);
  return { bars, midClose, slowClose, er, macdCross, low: Math.min(...all), high: Math.max(...all) };
}

/** Pentatonic pitch for a price, spread over the visible range. */
export function pricePitch(price: number, low: number, high: number, baseHz: number): number {
  const steps = PENTATONIC.length - 1;
  const step = Math.max(0, Math.min(steps, Math.round(((price - low) / Math.max(high - low, 1e-9)) * steps)));
  return baseHz * 2 ** (PENTATONIC[step] / 12);
}

const note = (hz: number, durationSec: number): SonicEvent => ({ offsetSec: 0, hz, amp: MTF_SOUND.amp, durationSec });

export function multiTimeframeEvents(layerId: string, index: number, a: MultiTimeframeAnalysis): SonicEvent[] {
  switch (layerId) {
    case "fast":
      return [note(pricePitch(a.bars[index].close, a.low, a.high, MTF_SOUND.priceHz), MTF_SOUND.fastSec)];
    case "mid":
      return index % SLOW_PULSE_BARS === 0 ? [note(pricePitch(a.midClose[index], a.low, a.high, MTF_SOUND.priceHz), MTF_SOUND.midSec)] : [];
    case "slow":
      return index % SLOW_PULSE_BARS === 0 ? [note(pricePitch(a.slowClose[index], a.low, a.high, MTF_SOUND.organHz), MTF_SOUND.slowSec)] : [];
    case "choppy":
      return a.er[index] < 0.5 ? [note(MTF_SOUND.drumHz, 0.095)] : [];
    case "macd":
      return a.macdCross[index] !== 0 ? [note(MTF_SOUND.knockHz, 0.095)] : [];
    default:
      return [];
  }
}

function choppyZones(er: readonly number[]): ChartZone[] {
  const zones: ChartZone[] = [];
  let from = -1;
  er.forEach((v, i) => {
    if (v < 0.5 && from < 0) from = i;
    if ((v >= 0.5 || i === er.length - 1) && from >= 0) {
      zones.push({ from, to: v < 0.5 ? i : i - 1, color: CHOPPY_ZONE });
      from = -1;
    }
  });
  return zones;
}

export function multiTimeframeChart(a: MultiTimeframeAnalysis): ChartModel {
  const markers: ChartMarker[] = [];
  a.macdCross.forEach((c, i) => {
    if (c !== 0) markers.push({ index: i, price: a.bars[i].close, kind: c > 0 ? "up" : "down" });
  });
  return {
    bars: a.bars,
    lines: [
      { id: "mid", label: "4x slower close", color: MTF_COLORS.mid, values: a.midClose, step: true },
      { id: "slow", label: "16x slower close", color: MTF_COLORS.slow, values: a.slowClose, step: true },
    ],
    markers,
    zones: choppyZones(a.er),
    description:
      "Simulated candles with two step lines: blue for the last completed close of a candle 4 times slower, violet for one 16 times slower. Gold shading marks bars where ER(5) is below 0.5, rings mark MACD zero crosses.",
  };
}

export function multiTimeframeReadout(index: number, a: MultiTimeframeAnalysis): ReadoutItem[] {
  const close = a.bars[index].close;
  const dir = (from: number, to: number) => (to > from ? "above" : to < from ? "below" : "level with");
  const loud = (on: boolean) => (on ? MTF_SOUND.amp : 0);
  return [
    { id: "fast", label: "Chart timeframe price", color: MTF_COLORS.fast, loudness: MTF_SOUND.amp, text: `Close ${close.toFixed(2)}, plays every bar.` },
    {
      id: "mid",
      label: "4x slower price",
      color: MTF_COLORS.mid,
      loudness: loud(index % SLOW_PULSE_BARS === 0),
      text: `Last completed close ${a.midClose[index].toFixed(2)}. The chart price is ${dir(a.midClose[index], close)} it.`,
    },
    {
      id: "slow",
      label: "16x slower price",
      color: MTF_COLORS.slow,
      loudness: loud(index % SLOW_PULSE_BARS === 0),
      text: `Last completed close ${a.slowClose[index].toFixed(2)}. The chart price is ${dir(a.slowClose[index], close)} it.`,
    },
    {
      id: "choppy",
      label: `Low efficiency ER(${ER_FAST_PERIOD})`,
      color: MTF_COLORS.choppy,
      loudness: loud(a.er[index] < 0.5),
      text: `ER(${ER_FAST_PERIOD}) is ${a.er[index].toFixed(2)}${a.er[index] < 0.5 ? ", choppy, drum plays" : ", efficient, drum rests"}.`,
    },
    {
      id: "macd",
      label: "MACD zero cross",
      color: MTF_COLORS.macd,
      loudness: loud(a.macdCross[index] !== 0),
      text: a.macdCross[index] > 0 ? "MACD crossed above zero." : a.macdCross[index] < 0 ? "MACD crossed below zero." : "No MACD cross on this bar.",
    },
  ];
}

function settings(voice: VoiceId, extra: Partial<LayerSettings> = {}): LayerSettings {
  return { voice, rate: 2, gain: 0.7, mute: false, solo: false, ...extra };
}

const quiet = { mute: true };

export const MULTI_TIMEFRAME_PRESETS: readonly Preset[] = [
  {
    id: "slushy",
    label: "Slushy's two timeframes",
    description: "The prototype default: a flute for the chart timeframe and a low organ for a timeframe 16 times slower. Indicators are off.",
    layers: {
      fast: settings("flute"),
      mid: settings("bell", quiet),
      slow: settings("organ"),
      choppy: settings("drum", { ...quiet, rate: 1 }),
      macd: settings("wood", quiet),
    },
  },
  {
    id: "three",
    label: "Three timeframes",
    description: "Adds a bell for a timeframe 4 times slower. Listen for when all three move the same way.",
    layers: {
      fast: settings("flute"),
      mid: settings("bell"),
      slow: settings("organ"),
      choppy: settings("drum", { ...quiet, rate: 1 }),
      macd: settings("wood", quiet),
    },
  },
  {
    id: "indicators",
    label: "Two timeframes and indicators",
    description: "The two price layers plus drums while the chart is choppy and a knock on each MACD zero cross.",
    layers: {
      fast: settings("flute"),
      mid: settings("bell", quiet),
      slow: settings("organ"),
      choppy: settings("drum", { rate: 1 }),
      macd: settings("wood"),
    },
  },
];

export const multiTimeframeMode: SonificationMode<MultiTimeframeAnalysis> = {
  id: "multi-timeframe",
  title: "Two or three timeframes",
  layers: [
    {
      id: "fast",
      label: "Chart timeframe price",
      color: MTF_COLORS.fast,
      describes: "A pentatonic note for each close on the chart timeframe. Higher close, higher note.",
      detail: "Pentatonic from 220 Hz",
      previewHz: MTF_SOUND.priceHz,
      kind: "continuous",
    },
    {
      id: "mid",
      label: "4x slower price",
      color: MTF_COLORS.mid,
      describes: "The last completed close of a candle 4 times slower (1h on the 15m chart), every 4 bars.",
      detail: "Pentatonic from 220 Hz, every 4 bars",
      previewHz: MTF_SOUND.priceHz,
      kind: "event",
    },
    {
      id: "slow",
      label: "16x slower price",
      color: MTF_COLORS.slow,
      describes: "The last completed close of a candle 16 times slower (4h on the 15m chart), every 4 bars.",
      detail: "Pentatonic from 110 Hz, every 4 bars",
      previewHz: MTF_SOUND.organHz,
      kind: "event",
    },
    {
      id: "choppy",
      label: "Low efficiency",
      color: MTF_COLORS.choppy,
      describes: `A drum while ER(${ER_FAST_PERIOD}) on the chart timeframe is below 0.5.`,
      detail: `${MTF_SOUND.drumHz} Hz, optional`,
      previewHz: MTF_SOUND.drumHz,
      kind: "continuous",
    },
    {
      id: "macd",
      label: "MACD zero cross",
      color: MTF_COLORS.macd,
      describes: "A wood knock when MACD (12, 26) on the chart timeframe crosses zero.",
      detail: `${MTF_SOUND.knockHz} Hz, optional`,
      previewHz: MTF_SOUND.knockHz,
      kind: "event",
    },
  ],
  presets: MULTI_TIMEFRAME_PRESETS,
  toggles: [],
  analyze: analyzeMultiTimeframe,
  events: multiTimeframeEvents,
  chart: multiTimeframeChart,
  readout: multiTimeframeReadout,
};
