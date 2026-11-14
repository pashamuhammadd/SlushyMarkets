import type { Bar } from "./market";
import type { VoiceId } from "./voices";

/**
 * Shared shapes for the sonification pipeline:
 *
 * market bars -> indicator analysis (mode.analyze) -> sound events per bar (mode.events)
 * -> scheduler (use-sonar-player) -> Web Audio engine (sonar-engine) -> user controls.
 *
 * A new mode only needs a new `SonificationMode`. The engine, scheduler, chart and controls
 * stay the same.
 */

/** One note inside a bar. Times are relative to the start of that bar. */
export type SonicEvent = {
  offsetSec: number;
  hz: number;
  /** Usually 0 to 1. Up to 1.35 for deliberate emphasis. Zero means silent and is never scheduled. */
  amp: number;
  durationSec: number;
};

/** Notes per second for one layer. 1 skips every other bar, 4 adds a second note half way. */
export type PulseRate = 1 | 2 | 4;

export const PULSE_RATES: readonly { value: PulseRate; label: string }[] = [
  { value: 1, label: "Slow, 1 per second" },
  { value: 2, label: "Normal, 2 per second" },
  { value: 4, label: "Fast, 4 per second" },
];

/** What the listener can change on each layer. */
export type LayerSettings = {
  voice: VoiceId;
  rate: PulseRate;
  /** 0 to 1 */
  gain: number;
  mute: boolean;
  solo: boolean;
};

export type LayerDefinition = {
  id: string;
  label: string;
  /** Chart color for the line or marker this layer follows. */
  color: string;
  /** Plain English description of what the layer sonifies. */
  describes: string;
  /** Short note under the layer name, for example "165 Hz tone". */
  detail: string;
  /** Pitch used by the Preview button. */
  previewHz: number;
  /**
   * "continuous" layers can sound on every bar and follow the pulse speed.
   * "event" layers only sound when something happens (a breakout), so pulse speed never drops them.
   */
  kind: "continuous" | "event";
};

/** On or off switches that change how a mode maps data to sound. */
export type ModeToggle = {
  id: string;
  label: string;
  description: string;
  defaultValue: boolean;
};

export type ModeOptions = Record<string, boolean>;

export type Preset = {
  id: string;
  label: string;
  description: string;
  layers: Record<string, LayerSettings>;
  /** Toggle values this preset sets. Missing toggles use their default. */
  options?: ModeOptions;
};

export type ChartLine = {
  id: string;
  label: string;
  color: string;
  values: number[];
  dashed?: boolean;
};

export type ChartMarker = {
  index: number;
  price: number;
  kind: "up" | "down" | "return";
};

/** A shaded stretch of bars, for example where a condition holds. Inclusive indexes. */
export type ChartZone = {
  from: number;
  to: number;
  color: string;
};

export type ChartModel = {
  bars: Bar[];
  lines: ChartLine[];
  markers: ChartMarker[];
  zones?: ChartZone[];
  /** Optional stacked volume strip under the candles (buyers on top of sellers). */
  volume?: { buyer: number[]; seller: number[]; max: number; buyerColor: string; sellerColor: string; label: string };
  /** Screen reader description of what the chart shows. */
  description: string;
};

/** One line of the live readout under the chart. */
export type ReadoutItem = {
  /** Matches a layer id when the item describes that layer, so mute and solo can be shown. */
  id: string;
  label: string;
  color: string;
  /** 0 to 1 (or a little above for emphasis). `null` hides the loudness meter. */
  loudness: number | null;
  text: string;
};

export type SonificationMode<Analysis> = {
  id: string;
  title: string;
  layers: readonly LayerDefinition[];
  presets: readonly Preset[];
  toggles: readonly ModeToggle[];
  /** Indicator work on the full series (warm up included). Returns data for the visible bars only. */
  analyze: (bars: readonly Bar[]) => Analysis;
  /** Notes for one layer at one visible bar, before pulse rate handling. */
  events: (layerId: string, index: number, analysis: Analysis, options: ModeOptions) => SonicEvent[];
  chart: (analysis: Analysis) => ChartModel;
  readout: (index: number, analysis: Analysis, options: ModeOptions) => ReadoutItem[];
};

/** Toggle values from a preset, filling in defaults. */
export function resolveOptions(toggles: readonly ModeToggle[], preset?: Preset): ModeOptions {
  return Object.fromEntries(toggles.map((t) => [t.id, preset?.options?.[t.id] ?? t.defaultValue]));
}
