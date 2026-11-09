import { ema } from "@/lib/simulations/moving-averages";
import { averageRange, proximity } from "../indicators";
import { VISIBLE_BARS, type Bar } from "../market";
import type { ChartModel, LayerSettings, Preset, ReadoutItem, SonicEvent, SonificationMode } from "../types";
import type { VoiceId } from "../voices";

/**
 * EMA Sonar: hear how close price is to the 7, 20 and 50 period EMAs.
 *
 * Mapping taken from Slushy's EMA Sonar prototype (provisional until Slushy approves it):
 * - every layer keeps one fixed pitch; loudness carries the information
 * - loudness = (1 - distance / (fade x ATR7)) ^ curve, silent beyond the fade distance
 * - 7 EMA: 495 Hz, fades out at 2 ATRs, curve 2.5, default tuned wood, 1 note per second
 * - 20 EMA: 330 Hz, fades out at 3 ATRs, curve 1.5, default organ, 2 notes per second
 * - 50 EMA: 165 Hz, fades out at 3 ATRs, curve 1.5, default organ, 4 notes per second
 * Only the parameters live here, so Slushy's final mapping can replace them in one place.
 */

export type EmaLayerId = "ema7" | "ema20" | "ema50";

export type EmaSonarLayerConfig = {
  id: EmaLayerId;
  label: string;
  period: number;
  color: string;
  colorName: string;
  /** Fixed pitch of this layer, in hertz. */
  hz: number;
  /** When the note sounds inside a bar, in seconds, so layers do not hit at the same instant. */
  offsetSec: number;
  /** Silent at this many average ranges (ATR7) away from the EMA. */
  fadeAtr: number;
  /** Steepness of the fade. */
  curve: number;
  noteSec: number;
};

export const EMA_SONAR_LAYERS: readonly EmaSonarLayerConfig[] = [
  { id: "ema7", label: "7 EMA", period: 7, color: "#A78BFA", colorName: "violet", hz: 495, offsetSec: 0.18, fadeAtr: 2, curve: 2.5, noteSec: 0.08 },
  { id: "ema20", label: "20 EMA", period: 20, color: "#F05DEB", colorName: "pink", hz: 330, offsetSec: 0.27, fadeAtr: 3, curve: 1.5, noteSec: 0.17 },
  { id: "ema50", label: "50 EMA", period: 50, color: "#44D9A4", colorName: "mint", hz: 165, offsetSec: 0, fadeAtr: 3, curve: 1.5, noteSec: 0.17 },
];

export const ATR_PERIOD = 7;

export type EmaSonarAnalysis = {
  bars: Bar[];
  atr: number[];
  emas: Record<EmaLayerId, number[]>;
};

export function analyzeEmaSonar(series: readonly Bar[], visibleBars: number = VISIBLE_BARS): EmaSonarAnalysis {
  const closes = series.map((b) => b.close);
  const atrAll = averageRange(series, ATR_PERIOD);
  const start = Math.max(0, series.length - visibleBars);
  const emas = {} as Record<EmaLayerId, number[]>;
  for (const layer of EMA_SONAR_LAYERS) {
    const line = ema(closes, layer.period);
    emas[layer.id] = line.slice(start).map((value, i) => value ?? closes[start + i]);
  }
  return { bars: series.slice(start).map((b) => ({ ...b })), atr: atrAll.slice(start), emas };
}

function layerConfig(id: string): EmaSonarLayerConfig {
  const layer = EMA_SONAR_LAYERS.find((l) => l.id === id);
  if (!layer) throw new Error(`Unknown EMA Sonar layer: ${id}`);
  return layer;
}

/** Loudness of one layer at one bar, 0 to 1. */
export function emaLoudness(id: EmaLayerId, index: number, analysis: EmaSonarAnalysis): number {
  const layer = layerConfig(id);
  const bar = analysis.bars[index];
  if (!bar) return 0;
  return proximity(bar.close - analysis.emas[id][index], analysis.atr[index], layer.fadeAtr, layer.curve);
}

export function emaSonarEvents(layerId: string, index: number, analysis: EmaSonarAnalysis): SonicEvent[] {
  const layer = layerConfig(layerId);
  const amp = emaLoudness(layer.id, index, analysis);
  if (amp <= 0) return [];
  return [{ offsetSec: layer.offsetSec, hz: layer.hz, amp, durationSec: layer.noteSec }];
}

export type EmaRelation = {
  /** Price minus EMA, in average ranges. Positive means price is above the line. */
  distanceAtr: number;
  side: "above" | "below" | "on";
  /** Compared with the previous bar. */
  motion: "approaching" | "moving away" | "steady" | "crossed";
  loudness: number;
};

/** Plain language reading of price against one EMA, for the live readout and screen readers. */
export function describeEmaRelation(id: EmaLayerId, index: number, analysis: EmaSonarAnalysis): EmaRelation {
  const bar = analysis.bars[index];
  const atr = analysis.atr[index] || 1;
  const diff = bar.close - analysis.emas[id][index];
  const distanceAtr = diff / atr;
  const side = Math.abs(distanceAtr) < 0.05 ? "on" : diff > 0 ? "above" : "below";
  let motion: EmaRelation["motion"] = "steady";
  if (index > 0) {
    const prevDiff = analysis.bars[index - 1].close - analysis.emas[id][index - 1];
    const prevAtr = analysis.atr[index - 1] || 1;
    if (Math.sign(prevDiff) !== Math.sign(diff) && prevDiff !== 0 && diff !== 0) motion = "crossed";
    else {
      const change = Math.abs(diff) / atr - Math.abs(prevDiff) / prevAtr;
      if (change < -0.08) motion = "approaching";
      else if (change > 0.08) motion = "moving away";
    }
  }
  return { distanceAtr, side, motion, loudness: emaLoudness(id, index, analysis) };
}

function settings(voice: VoiceId, rate: LayerSettings["rate"], extra: Partial<LayerSettings> = {}): LayerSettings {
  return { voice, rate, gain: 0.7, mute: false, solo: false, ...extra };
}

export const EMA_SONAR_PRESETS: readonly Preset[] = [
  {
    id: "slushy",
    label: "Slushy's EMA Sonar",
    description: "The prototype mix: a plucked 7 EMA, a higher organ for the 20 EMA and a deep, fast organ for the 50 EMA.",
    layers: {
      ema7: settings("tuned-wood", 1),
      ema20: settings("organ", 2),
      ema50: settings("organ", 4),
    },
  },
  {
    id: "one-line",
    label: "Start with one line",
    description: "Only the 20 EMA is audible. Learn how loudness follows distance before adding more layers.",
    layers: {
      ema7: settings("tuned-wood", 1, { mute: true }),
      ema20: settings("organ", 2),
      ema50: settings("organ", 2, { mute: true }),
    },
  },
  {
    id: "bright",
    label: "Bright and even",
    description: "Three clearly different instruments at the same speed, so you can tell the lines apart by color of sound.",
    layers: {
      ema7: settings("chime", 2),
      ema20: settings("flute", 2),
      ema50: settings("organ", 2),
    },
  },
];

export function emaSonarChart(analysis: EmaSonarAnalysis): ChartModel {
  return {
    bars: analysis.bars,
    lines: EMA_SONAR_LAYERS.map((l) => ({ id: l.id, label: l.label, color: l.color, values: analysis.emas[l.id] })),
    markers: [],
    description: "Simulated candles with the 7 EMA in violet, the 20 EMA in pink and the 50 EMA in mint.",
  };
}

export function emaSonarReadout(index: number, analysis: EmaSonarAnalysis): ReadoutItem[] {
  return EMA_SONAR_LAYERS.map((l) => {
    const r = describeEmaRelation(l.id, index, analysis);
    const where = r.side === "on" ? "right on the line" : `${Math.abs(r.distanceAtr).toFixed(1)} ATR ${r.side}`;
    return {
      id: l.id,
      label: l.label,
      color: l.color,
      loudness: r.loudness,
      text: `Price is ${where}${r.motion === "steady" ? "" : `, ${r.motion}`}.`,
    };
  });
}

export const emaSonarMode: SonificationMode<EmaSonarAnalysis> = {
  id: "ema-sonar",
  title: "EMA Sonar: 7, 20 and 50",
  layers: EMA_SONAR_LAYERS.map((l) => ({
    id: l.id,
    label: l.label,
    color: l.color,
    describes: `Louder when price is close to the ${l.label} (${l.colorName} line). Silent at ${l.fadeAtr} average ranges away.`,
    detail: `${l.hz} Hz tone`,
    previewHz: l.hz,
    kind: "continuous" as const,
  })),
  presets: EMA_SONAR_PRESETS,
  toggles: [],
  analyze: (series) => analyzeEmaSonar(series),
  events: emaSonarEvents,
  chart: emaSonarChart,
  readout: emaSonarReadout,
};
