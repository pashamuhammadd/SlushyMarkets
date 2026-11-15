import { createRng, fromQuantityUnits } from "@/lib/simulations/trades";
import type { Trade } from "@/lib/simulations/types";
import { averageRange } from "../indicators";
import { VISIBLE_BARS, type Bar } from "../market";
import type { ChartModel, LayerSettings, Preset, ReadoutItem, SonicEvent, SonificationMode } from "../types";
import type { VoiceId } from "../voices";

/**
 * Price and volume conversation, from Slushy's "New sound concepts" video (15 November 2026).
 * Provisional until Slushy sends exact rules. Measured from the video's audio (60 to 75 s):
 * - price voice at the start of each 0.5 s bar: about 440 Hz for a rising candle, about 330 Hz
 *   for a falling one, a short wood tone (the same shape as the Two-wall tones)
 * - activity drums: 1 to 5 hits of the Rounded wood drum at about 199 Hz (110 Hz source),
 *   the first 0.12 s into the bar, then every 0.055 s
 *
 * Slushy asked for coherent trade data instead of random volume. Here every bar is built from
 * simulated trades that walk from the open to both extremes and on to the close, and the
 * candle and its volume are both summaries of those same trades (the idea of the Candlesticks
 * and Volume lesson). Bigger moves need more trades, so activity follows the price action.
 */

export const PV_SOUND = {
  upHz: 440,
  downHz: 330,
  drumHz: 110,
  drumStartSec: 0.12,
  drumSpacingSec: 0.055,
  amp: 1.6,
} as const;
export const ACTIVITY_LOOKBACK = 20;
export const PV_COLORS = { up: "#44D9A4", down: "#FF6B8B", activity: "#A78BFA" } as const;
const BAR_MS = 15 * 60 * 1000;

/**
 * Simulated trades for one bar. Prices run open, then the extreme on the far side of the close,
 * then the other extreme, then the close (a rising bar dips first). Each turning point is hit by
 * a trade exactly, so the candle built from these trades is the bar itself.
 */
export function tradesForBar(bar: Bar, typicalRange: number, seed: number, startMs: number): Trade[] {
  const rng = createRng(seed);
  const rising = bar.close >= bar.open;
  const path = rising ? [bar.open, bar.low, bar.high, bar.close] : [bar.open, bar.high, bar.low, bar.close];
  const legs = [0, 1, 2].map((k) => Math.abs(path[k + 1] - path[k]));
  const total = legs.reduce((s, v) => s + v, 0);
  const relative = Math.min(3, (bar.high - bar.low) / Math.max(typicalRange, 1e-9));
  const count = Math.max(4, 4 + Math.round(relative * 6) + Math.floor(rng() * 4));
  const prices: number[] = [path[0]];
  legs.forEach((leg, k) => {
    const steps = Math.max(1, Math.round(((count - 4) * leg) / Math.max(total, 1e-9)) + 1);
    for (let j = 1; j <= steps; j += 1) {
      const t = j / steps;
      const base = path[k] + (path[k + 1] - path[k]) * t;
      const noise = j === steps ? 0 : (rng() - 0.5) * leg * 0.15;
      prices.push(Math.min(bar.high, Math.max(bar.low, base + noise)));
    }
  });
  return prices.map((priceUsd, i) => ({
    id: `${seed}-${i}`,
    timestampMs: startMs + Math.floor(((i + 0.5) / prices.length) * BAR_MS),
    priceUsd,
    // 0.0050 to 0.2000 BTC in whole quantity units, mostly small trades.
    quantityBtc: fromQuantityUnits(50 + Math.floor(rng() ** 2 * 1950)),
  }));
}

/** Activity level 1 to 5: where this bar's volume ranks among the last ACTIVITY_LOOKBACK bars. */
export function activityLevel(volumes: readonly number[], t: number): number {
  const window = volumes.slice(Math.max(0, t - ACTIVITY_LOOKBACK + 1), t + 1);
  const below = window.filter((v) => v < volumes[t]).length;
  return 1 + Math.min(4, Math.floor((below / window.length) * 5));
}

export type PriceVolumeAnalysis = {
  bars: Bar[];
  volume: number[];
  trades: number[];
  level: number[];
};

export function analyzePriceVolume(series: readonly Bar[]): PriceVolumeAnalysis {
  const ranges = averageRange(series, 14);
  const seed = Math.round((series[0]?.open ?? 0) * 1000);
  const volumes: number[] = [];
  const counts: number[] = [];
  series.forEach((bar, t) => {
    const trades = tradesForBar(bar, t > 0 ? ranges[t - 1] : bar.high - bar.low, seed + t * 7919, t * BAR_MS);
    volumes.push(trades.reduce((s, x) => s + x.quantityBtc, 0));
    counts.push(trades.length);
  });
  const start = Math.max(0, series.length - VISIBLE_BARS);
  return {
    bars: series.slice(start),
    volume: volumes.slice(start),
    trades: counts.slice(start),
    level: series.map((_, t) => activityLevel(volumes, t)).slice(start),
  };
}

export function priceVolumeEvents(layerId: string, index: number, a: PriceVolumeAnalysis): SonicEvent[] {
  if (layerId === "price") {
    const bar = a.bars[index];
    return [{ offsetSec: 0, hz: bar.close >= bar.open ? PV_SOUND.upHz : PV_SOUND.downHz, amp: PV_SOUND.amp, durationSec: 0.2 }];
  }
  if (layerId === "activity") {
    return Array.from({ length: a.level[index] }, (_, k) => ({
      offsetSec: PV_SOUND.drumStartSec + k * PV_SOUND.drumSpacingSec,
      hz: PV_SOUND.drumHz,
      amp: PV_SOUND.amp,
      durationSec: 0.1,
    }));
  }
  return [];
}

export function priceVolumeChart(a: PriceVolumeAnalysis): ChartModel {
  return {
    bars: a.bars,
    lines: [],
    markers: [],
    volume: {
      buyer: a.level,
      seller: a.level.map(() => 0),
      max: 5,
      buyerColor: PV_COLORS.activity,
      sellerColor: PV_COLORS.activity,
      label: "Simulated activity: 1 to 5 drum hits, from the trades behind each candle",
    },
    description:
      "Simulated candles with a violet strip below. Each strip bar is the activity level of that candle, from 1 to 5, based on the volume of the simulated trades that built it.",
  };
}

export function priceVolumeReadout(index: number, a: PriceVolumeAnalysis): ReadoutItem[] {
  const bar = a.bars[index];
  const rising = bar.close >= bar.open;
  return [
    {
      id: "price",
      label: "Price voice",
      color: rising ? PV_COLORS.up : PV_COLORS.down,
      loudness: 1,
      text: `${rising ? "Rising" : "Falling"} candle, ${rising ? "higher" : "lower"} note. Close ${bar.close.toFixed(2)}.`,
    },
    {
      id: "activity",
      label: "Activity (simulated)",
      color: PV_COLORS.activity,
      loudness: a.level[index] / 5,
      text: `${a.trades[index]} trades, ${a.volume[index].toFixed(2)} BTC. Level ${a.level[index]} of 5 compared with the last ${ACTIVITY_LOOKBACK} candles.`,
    },
  ];
}

function settings(voice: VoiceId, extra: Partial<LayerSettings> = {}): LayerSettings {
  return { voice, rate: 2, gain: 0.7, mute: false, solo: false, ...extra };
}

export const PRICE_VOLUME_PRESETS: readonly Preset[] = [
  {
    id: "slushy",
    label: "Slushy's conversation",
    description: "A wood note for each candle, higher when it rises, then quick drum hits for how busy it was.",
    layers: { price: settings("wall-wood"), activity: settings("rounded-wood") },
  },
  {
    id: "price-only",
    label: "Price only",
    description: "Only the price voice. Hear runs of rising and falling candles.",
    layers: { price: settings("wall-wood"), activity: settings("rounded-wood", { mute: true }) },
  },
  {
    id: "activity-only",
    label: "Activity only",
    description: "Only the drums. Count the hits to hear when trading gets busy.",
    layers: { price: settings("wall-wood", { mute: true }), activity: settings("rounded-wood") },
  },
];

export const priceVolumeMode: SonificationMode<PriceVolumeAnalysis> = {
  id: "price-volume",
  title: "Price and volume conversation",
  layers: [
    {
      id: "price",
      label: "Price voice",
      color: PV_COLORS.up,
      describes: "A short wood note at the start of each bar: higher for a rising candle, lower for a falling one.",
      detail: `About ${PV_SOUND.upHz} or ${PV_SOUND.downHz} Hz`,
      previewHz: PV_SOUND.upHz,
      kind: "continuous",
    },
    {
      id: "activity",
      label: "Activity drums",
      color: PV_COLORS.activity,
      describes: "One to five quick drum hits, more when the candle had more trading volume than usual.",
      detail: "1 to 5 hits, simulated trades",
      previewHz: PV_SOUND.drumHz,
      kind: "continuous",
    },
  ],
  presets: PRICE_VOLUME_PRESETS,
  toggles: [],
  analyze: analyzePriceVolume,
  events: priceVolumeEvents,
  chart: priceVolumeChart,
  readout: priceVolumeReadout,
};
