import type { Bar } from "../market";
import type { ChartModel, LayerSettings, ModeOptions, Preset, ReadoutItem, SonicEvent, SonificationMode } from "../types";
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
 * Sonar Channels and volume: the Sonar Bands channel plus quick drum bursts for buyer and seller
 * volume, from the "Sonar channels + rapid volume" mode of Slushy's Sound Playground
 * (sonar-volume.html, read on 14 November 2026). Provisional until Slushy approves it.
 *
 * The volume here is SIMULATED, exactly as in the prototype: each bar gets 1 to 5 volume units
 * and a buyer share between 0.08 and 0.92. Buyer hits = round(units x share), the rest are
 * seller hits. It is not real order flow and is labeled that way everywhere it appears.
 *
 * - buyer hits: 220 Hz drum, seller hits: 110 Hz drum, amplitude 1.1, 0.095 s
 * - hits are spread over the first 0.22 s of the bar, buyers first: 0.02 + slot x 0.22 / units
 * - the organs, chimes and knocks are the same as Sonar Bands, motion pairs off, midline muted
 */

export const VOLUME_DRUM = { buyerHz: 220, sellerHz: 110, amp: 1.1, durationSec: 0.095, startSec: 0.02, spreadSec: 0.22 } as const;
export const BUYER_COLOR = "#44D9A4";
export const SELLER_COLOR = "#FF6B8B";

export type SimulatedFlow = { units: number; buyShare: number; buyerHits: number; sellerHits: number };

/** Seeded so the same chart always gets the same simulated volume and replays identically. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulateFlow(count: number, seed: number): SimulatedFlow[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const units = 1 + Math.floor(random() * 5);
    const buyShare = 0.08 + random() * 0.84;
    const buyerHits = Math.round(units * buyShare);
    return { units, buyShare, buyerHits, sellerHits: units - buyerHits };
  });
}

/** A seed taken from the chart itself, so a new chart means new simulated volume. */
export function flowSeed(series: readonly Bar[]): number {
  const last = series.at(-1);
  return last ? Math.round(last.close * 1e4) ^ Math.round(series[0].open * 1e4) ^ series.length : 1;
}

export type SonarVolumeAnalysis = SonarBandsAnalysis & { flow: SimulatedFlow[] };

export function analyzeSonarVolume(series: readonly Bar[]): SonarVolumeAnalysis {
  const bands = analyzeSonarBands(series);
  return { ...bands, flow: simulateFlow(bands.bars.length, flowSeed(series)) };
}

export function volumeEvents(side: "buyer" | "seller", flow: SimulatedFlow): SonicEvent[] {
  const hits = side === "buyer" ? flow.buyerHits : flow.sellerHits;
  return Array.from({ length: hits }, (_, j) => ({
    offsetSec: VOLUME_DRUM.startSec + ((side === "buyer" ? j : flow.buyerHits + j) * VOLUME_DRUM.spreadSec) / flow.units,
    hz: side === "buyer" ? VOLUME_DRUM.buyerHz : VOLUME_DRUM.sellerHz,
    amp: VOLUME_DRUM.amp,
    durationSec: VOLUME_DRUM.durationSec,
  }));
}

export function sonarVolumeEvents(layerId: string, index: number, a: SonarVolumeAnalysis, options: ModeOptions): SonicEvent[] {
  if (layerId === "buyerVolume") return volumeEvents("buyer", a.flow[index]);
  if (layerId === "sellerVolume") return volumeEvents("seller", a.flow[index]);
  return sonarBandsEvents(layerId, index, a, { motion: options.motion ?? false });
}

export function sonarVolumeChart(a: SonarVolumeAnalysis): ChartModel {
  const base = sonarBandsChart(a);
  return {
    ...base,
    volume: { buyer: a.flow.map((f) => f.buyerHits), seller: a.flow.map((f) => f.sellerHits), max: 5, buyerColor: BUYER_COLOR, sellerColor: SELLER_COLOR, label: "Simulated volume: buyers / sellers, 1 to 5 hits" },
    description: `${base.description} Bars under the chart show simulated buyer and seller volume.`,
  };
}

export function sonarVolumeReadout(index: number, a: SonarVolumeAnalysis): ReadoutItem[] {
  const f = a.flow[index];
  const [lower, upper, channel] = sonarBandsReadout(index, a);
  const lead = f.buyerHits > f.sellerHits ? "buyers lead" : f.sellerHits > f.buyerHits ? "sellers lead" : "even";
  return [
    { id: "buyerVolume", label: "Buyer volume (simulated)", color: BUYER_COLOR, loudness: f.buyerHits / 5, text: `${f.buyerHits} of ${f.units} hits at ${VOLUME_DRUM.buyerHz} Hz, ${lead}.` },
    { id: "sellerVolume", label: "Seller volume (simulated)", color: SELLER_COLOR, loudness: f.sellerHits / 5, text: `${f.sellerHits} of ${f.units} hits at ${VOLUME_DRUM.sellerHz} Hz.` },
    lower,
    upper,
    channel,
  ];
}

function settings(voice: VoiceId, extra: Partial<LayerSettings> = {}): LayerSettings {
  return { voice, rate: 2, gain: 0.7, mute: false, solo: false, ...extra };
}

const quiet = { mute: true };

export const SONAR_VOLUME_PRESETS: readonly Preset[] = [
  {
    id: "slushy",
    label: "Slushy's Sonar Bands",
    description: "The prototype mix: a higher drum for buyers, a lower drum for sellers, organs for the channel edges, chimes and knocks for breakouts and returns.",
    layers: {
      buyerVolume: settings("drum"),
      sellerVolume: settings("drum"),
      lower: settings("organ"),
      upper: settings("organ"),
      midline: settings("tuned-wood", quiet),
      breakout: settings("chime"),
      return: settings("wood"),
    },
    options: { motion: false },
  },
  {
    id: "volume-only",
    label: "Volume only",
    description: "Only the two drums. Count the high and low hits on each bar to hear who leads.",
    layers: {
      buyerVolume: settings("drum"),
      sellerVolume: settings("drum"),
      lower: settings("organ", quiet),
      upper: settings("organ", quiet),
      midline: settings("tuned-wood", quiet),
      breakout: settings("chime", quiet),
      return: settings("wood", quiet),
    },
    options: { motion: false },
  },
  {
    id: "volume-breakouts",
    label: "Volume and breakouts",
    description: "Drums plus breakout chimes and return knocks. Since the volume is random here, notice how easy it is to hear a pattern that is not there.",
    layers: {
      buyerVolume: settings("drum"),
      sellerVolume: settings("drum"),
      lower: settings("organ", quiet),
      upper: settings("organ", quiet),
      midline: settings("tuned-wood", quiet),
      breakout: settings("chime"),
      return: settings("wood"),
    },
    options: { motion: false },
  },
];

export const sonarVolumeMode: SonificationMode<SonarVolumeAnalysis> = {
  id: "sonar-volume",
  title: "Sonar Channels and volume",
  layers: [
    {
      id: "buyerVolume",
      label: "Buyer volume",
      color: BUYER_COLOR,
      describes: "Quick high drum hits for simulated buyer-initiated volume on each bar.",
      detail: `${VOLUME_DRUM.buyerHz} Hz, 0 to 5 hits, simulated`,
      previewHz: VOLUME_DRUM.buyerHz,
      kind: "event",
    },
    {
      id: "sellerVolume",
      label: "Seller volume",
      color: SELLER_COLOR,
      describes: "Quick low drum hits for simulated seller-initiated volume, after the buyer hits.",
      detail: `${VOLUME_DRUM.sellerHz} Hz, 0 to 5 hits, simulated`,
      previewHz: VOLUME_DRUM.sellerHz,
      kind: "event",
    },
    ...sonarBandsMode.layers,
  ],
  presets: SONAR_VOLUME_PRESETS,
  toggles: SONAR_BANDS_TOGGLES.map((t) => (t.id === "motion" ? { ...t, defaultValue: false } : t)),
  analyze: analyzeSonarVolume,
  events: sonarVolumeEvents,
  chart: sonarVolumeChart,
  readout: sonarVolumeReadout,
};
