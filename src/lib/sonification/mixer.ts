import type { LayerDefinition, LayerSettings, PulseRate, SonicEvent } from "./types";

/** Seconds of music per bar. 60 bars play in 30 seconds. */
export const BAR_SECONDS = 0.5;

/**
 * Applies a layer's pulse rate to the notes of one bar (bars are half a second long):
 * - 1 per second: only even bars sound
 * - 2 per second: every bar sounds once
 * - 4 per second: every bar sounds twice, the copy a quarter second later and kept short
 * Same behavior as the pulse speed menus in Slushy's EMA Sonar prototype.
 */
export function applyPulseRate(events: readonly SonicEvent[], rate: PulseRate, index: number): SonicEvent[] {
  if (rate === 1 && index % 2 !== 0) return [];
  const base = events.filter((e) => e.amp > 0);
  if (rate !== 4) return base;
  return base.concat(
    base.map((e) => ({ ...e, offsetSec: e.offsetSec + BAR_SECONDS / 2, durationSec: Math.min(e.durationSec, 0.12) })),
  );
}

/** Effective gain of a layer after mute and solo. Any solo silences every layer that is not soloed. */
export function audibleGain(layer: LayerSettings, anySolo: boolean): number {
  if (layer.mute) return 0;
  if (anySolo && !layer.solo) return 0;
  return Math.min(Math.max(layer.gain, 0), 1);
}

export function hasSolo(layers: Record<string, LayerSettings>): boolean {
  return Object.values(layers).some((l) => l.solo);
}

/**
 * Notes to schedule for one layer at one bar. Event layers (breakouts, returns) ignore the
 * pulse speed, so a slow setting can never drop an event.
 */
export function notesForBar(layer: LayerDefinition, settings: LayerSettings, events: readonly SonicEvent[], index: number): SonicEvent[] {
  if (layer.kind === "event") return events.filter((e) => e.amp > 0);
  return applyPulseRate(events, settings.rate, index);
}
