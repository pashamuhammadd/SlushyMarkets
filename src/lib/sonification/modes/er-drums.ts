import { efficiencyRatio } from "../indicators";
import { VISIBLE_BARS, type Bar } from "../market";
import type { ChartModel, ChartZone, LayerSettings, ModeOptions, Preset, ReadoutItem, SonicEvent, SonificationMode } from "../types";
import type { VoiceId } from "../voices";
import {
  analyzeSonarBands,
  sonarBandsChart,
  sonarBandsEvents,
  sonarBandsMode,
  sonarBandsReadout,
  SONAR_BANDS_TOGGLES,
  type SonarBandsAnalysis,
} from "./sonar-bands";

/**
 * Sonar Channels and ER drums: the Sonar Bands channel plus a drum layer driven by the
 * Efficiency Ratio.
 *
 * Taken from the "Sonar channels + ER drums" mode of Slushy's Sound Playground prototype
 * (provisional until Slushy approves it):
 * - ER(7) = |close now - close 7 bars ago| / sum of the 7 absolute bar to bar changes,
 *   no smoothing. 1 = a straight move, near 0 = back and forth.
 * - when ER(7) is below 0.5, each bar plays three quick drum hits (110 Hz, 0.15 s apart)
 * - at or above 0.5 the drums are silent
 * - the organs independently track the same EMA(10) +/- 1.7 x ATR(7) channel as Sonar Bands,
 *   with chimes for breakouts and knocks for returns. Motion pairs are off by default here,
 *   as in the prototype.
 */

export const ER_PERIOD = 7;
export const ER_THRESHOLD = 0.5;
export const ER_DRUM = { hz: 110, hits: 3, spacingSec: 0.15, amp: 1.1, durationSec: 0.095 } as const;
export const LOW_ER_COLOR = "rgb(255 209 102 / 0.14)";
const ER_COLOR = "#FFD166";

export type ErDrumsAnalysis = SonarBandsAnalysis & {
  /** ER(7) for each visible bar. */
  er: number[];
};

export function analyzeErDrums(series: readonly Bar[]): ErDrumsAnalysis {
  const bands = analyzeSonarBands(series);
  const start = Math.max(0, series.length - VISIBLE_BARS);
  // The warm up guarantees seven earlier closes, so ER is defined for every visible bar.
  const er = efficiencyRatio(series.map((b) => b.close), ER_PERIOD)
    .slice(start)
    .map((v) => v ?? 0);
  return { ...bands, er };
}

export function isLowEfficiency(er: number): boolean {
  return er < ER_THRESHOLD;
}

export function erDrumsEvents(layerId: string, index: number, a: ErDrumsAnalysis, options: ModeOptions): SonicEvent[] {
  if (layerId !== "erDrums") return sonarBandsEvents(layerId, index, a, { motion: options.motion ?? false });
  if (!isLowEfficiency(a.er[index])) return [];
  return Array.from({ length: ER_DRUM.hits }, (_, j) => ({
    offsetSec: j * ER_DRUM.spacingSec,
    hz: ER_DRUM.hz,
    amp: ER_DRUM.amp,
    durationSec: ER_DRUM.durationSec,
  }));
}

/** Runs of consecutive bars where ER(7) is below the threshold. */
export function lowEfficiencyZones(er: readonly number[]): ChartZone[] {
  const zones: ChartZone[] = [];
  let from = -1;
  er.forEach((v, i) => {
    if (isLowEfficiency(v)) {
      if (from < 0) from = i;
    } else if (from >= 0) {
      zones.push({ from, to: i - 1, color: LOW_ER_COLOR });
      from = -1;
    }
  });
  if (from >= 0) zones.push({ from, to: er.length - 1, color: LOW_ER_COLOR });
  return zones;
}

export function erDrumsChart(a: ErDrumsAnalysis): ChartModel {
  const base = sonarBandsChart(a);
  return {
    ...base,
    zones: lowEfficiencyZones(a.er),
    description: `${base.description} Gold shading marks bars where ER(7) is below 0.5 and the drums play.`,
  };
}

export function erDrumsReadout(index: number, a: ErDrumsAnalysis): ReadoutItem[] {
  const [lower, upper, channel] = sonarBandsReadout(index, a);
  const er = a.er[index];
  const low = isLowEfficiency(er);
  return [
    lower,
    upper,
    {
      id: "erDrums",
      label: "Efficiency ER(7)",
      color: ER_COLOR,
      loudness: null,
      text: `ER(7) is ${er.toFixed(2)}: ${low ? "below 0.5, choppy, drums play" : "0.5 or above, efficient, drums rest"}. ${channel.text}`,
    },
  ];
}

function settings(voice: VoiceId, extra: Partial<LayerSettings> = {}): LayerSettings {
  return { voice, rate: 2, gain: 0.7, mute: false, solo: false, ...extra };
}

const quiet = { mute: true };

export const ER_DRUMS_PRESETS: readonly Preset[] = [
  {
    id: "slushy",
    label: "Slushy's ER drums",
    description: "The prototype mix: drums while the market is choppy, organs for the channel edges, chimes and knocks for breakouts and returns.",
    layers: {
      erDrums: settings("drum"),
      lower: settings("organ"),
      upper: settings("organ"),
      midline: settings("tuned-wood", quiet),
      breakout: settings("chime"),
      return: settings("wood"),
    },
    options: { motion: false },
  },
  {
    id: "drums-only",
    label: "Drums only",
    description: "Only the efficiency drums. Listen for stretches of silence: those are the straighter, more efficient moves.",
    layers: {
      erDrums: settings("drum"),
      lower: settings("organ", quiet),
      upper: settings("organ", quiet),
      midline: settings("tuned-wood", quiet),
      breakout: settings("chime", quiet),
      return: settings("wood", quiet),
    },
    options: { motion: false },
  },
  {
    id: "drums-events",
    label: "Drums and breakouts",
    description: "Drums for choppy stretches plus chimes and knocks. Do breakouts tend to happen while the drums are playing or resting?",
    layers: {
      erDrums: settings("drum"),
      lower: settings("organ", quiet),
      upper: settings("organ", quiet),
      midline: settings("tuned-wood", quiet),
      breakout: settings("chime"),
      return: settings("wood"),
    },
    options: { motion: false },
  },
];

export const erDrumsMode: SonificationMode<ErDrumsAnalysis> = {
  id: "sonar-er-drums",
  title: "Sonar Channels and ER drums",
  layers: [
    {
      id: "erDrums",
      label: "ER drums",
      color: ER_COLOR,
      describes: "Three quick drum hits on every bar where ER(7) is below 0.5. Silent while price moves efficiently.",
      detail: "110 Hz, plays while ER(7) < 0.5",
      previewHz: ER_DRUM.hz,
      kind: "event",
    },
    ...sonarBandsMode.layers,
  ],
  presets: ER_DRUMS_PRESETS,
  toggles: SONAR_BANDS_TOGGLES.map((t) => (t.id === "motion" ? { ...t, defaultValue: false } : t)),
  analyze: analyzeErDrums,
  events: erDrumsEvents,
  chart: erDrumsChart,
  readout: erDrumsReadout,
};
