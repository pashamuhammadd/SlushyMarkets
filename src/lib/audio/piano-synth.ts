"use client";

import { midiToHz } from "./trend-scenario";

/** Hard ceiling for the master gain, so even 100% volume is never loud. */
export const MAX_MASTER_GAIN = 0.32;

/**
 * Small piano-like synthesizer built only from Web Audio oscillators.
 * Original programmatic tones: no samples, recordings or copyrighted audio.
 * The AudioContext is created lazily inside a user gesture (browser autoplay rules).
 */
export class PianoSynth {
  readonly ctx: AudioContext;
  private readonly master: GainNode;
  private readonly compressor: DynamicsCompressorNode;
  private volume = 0.6;
  private muted = false;
  private readonly voices = new Set<OscillatorNode>();

  constructor() {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error("Web Audio is not supported in this browser.");
    this.ctx = new Ctor();
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.ratio.value = 4;
    this.master = this.ctx.createGain();
    this.master.gain.value = this.targetGain();
    this.master.connect(this.compressor).connect(this.ctx.destination);
  }

  async resume() {
    if (this.ctx.state !== "running") await this.ctx.resume();
  }

  private targetGain() {
    return this.muted ? 0 : this.volume * MAX_MASTER_GAIN;
  }

  private applyGain() {
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.targetGain(), now, 0.03);
  }

  setVolume(volume: number) {
    this.volume = Math.min(Math.max(volume, 0), 1);
    this.applyGain();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyGain();
  }

  /** Schedule one note. `when` is in AudioContext time (seconds). */
  playNote(midi: number, when: number, durationSec: number, velocity = 0.7) {
    const ctx = this.ctx;
    const freq = midiToHz(midi);
    const release = Math.min(Math.max(durationSec * 1.4, 0.35), 1.8);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(velocity, when + 0.008);
    env.gain.exponentialRampToValueAtTime(velocity * 0.35, when + 0.18);
    env.gain.exponentialRampToValueAtTime(0.0001, when + release);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(freq * 8, 9000), when);
    filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 2.5, 4000), when + release);

    // Fundamental plus soft overtones gives a gentle, piano-like attack.
    const partials: Array<[OscillatorType, number, number]> = [
      ["triangle", 1, 1],
      ["sine", 2, 0.35],
      ["sine", 3, 0.12],
    ];
    for (const [type, ratio, level] of partials) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq * ratio;
      g.gain.value = level;
      osc.connect(g).connect(filter);
      osc.start(when);
      osc.stop(when + release + 0.05);
      this.voices.add(osc);
      osc.onended = () => this.voices.delete(osc);
    }
    filter.connect(env).connect(this.master);
  }

  /** Silence everything immediately with a short fade, then restore the master level. */
  stopAll() {
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0, now, 0.015);
    for (const osc of this.voices) {
      try {
        osc.stop(now + 0.08);
      } catch {
        // already stopped
      }
    }
    this.voices.clear();
    this.master.gain.setTargetAtTime(this.targetGain(), now + 0.12, 0.02);
  }
}

let shared: PianoSynth | null = null;

/** One synth for the whole page. Call only from a click or key handler. */
export function getPianoSynth(): PianoSynth {
  if (!shared) shared = new PianoSynth();
  return shared;
}
