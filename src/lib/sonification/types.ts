import type { Bar } from "./market";
import type { VoiceId } from "./voices";

/**
 * Shared shapes for the sonification pipeline:
 *
 * market bars -> indicator analysis (mode.analyze) -> sound events per bar (mode.events)
 * -> scheduler (use-sonar-player) -> Web Audio engine (sonar-engine) -> user controls.
 *
 * A new mode only needs a new `SonificationMode`. The engine, scheduler and controls stay the same.
 */

/** One note inside a bar. Times are relative to the start of that bar. */
export type SonicEvent = {
  offsetSec: number;
  hz: number;
  /** 0 to 1. Zero means silent and is never scheduled. */
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
  /** Chart color for the line this layer follows. */
  color: string;
  /** Plain English description of what the layer sonifies. */
  describes: string;
};

export type Preset = {
  id: string;
  label: string;
  description: string;
  layers: Record<string, LayerSettings>;
};

export type SonificationMode<Analysis> = {
  id: string;
  title: string;
  layers: readonly LayerDefinition[];
  presets: readonly Preset[];
  /** Indicator work on the full series (warm up included). Returns data for the visible bars only. */
  analyze: (bars: readonly Bar[]) => Analysis;
  /** Notes for one layer at one visible bar, before pulse rate handling. */
  events: (layerId: string, index: number, analysis: Analysis) => SonicEvent[];
};
