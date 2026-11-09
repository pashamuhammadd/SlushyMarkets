"use client";

import { PERCUSSIVE_SECONDS, VOICES, type VoiceId } from "@/lib/sonification/voices";

/** Hard ceiling for the master gain, so even 100% volume stays comfortable. Same cap as the piano. */
export const SONAR_MAX_MASTER_GAIN = 0.32;
/** Peak level of one note before layer and master gain (from Slushy's prototype). */
const NOTE_PEAK = 0.19;

/**
 * Web Audio engine for the Sound Playground.
 * Signal path: oscillator -> note envelope -> layer bus (mute, solo, volume) -> master -> compressor -> speakers.
 * The compressor keeps several layers from clipping. Everything is mono, so it sounds the same
 * on one speaker as on headphones. The AudioContext is created lazily inside a user gesture.
 */
export class SonarEngine {
  readonly ctx: AudioContext;
  private readonly master: GainNode;
  private readonly buses = new Map<string, GainNode>();
  private readonly busTargets = new Map<string, number>();
  private readonly voices = new Set<OscillatorNode>();
  private volume = 0.7;
  private muted = false;

  constructor() {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error("Web Audio is not supported in this browser.");
    this.ctx = new Ctor();
    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 4;
    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterTarget();
    this.master.connect(compressor).connect(this.ctx.destination);
  }

  async resume() {
    if (this.ctx.state !== "running") await this.ctx.resume();
    if (this.ctx.state !== "running") throw new Error("Audio is blocked by the browser.");
  }

  private masterTarget() {
    return this.muted ? 0 : this.volume * SONAR_MAX_MASTER_GAIN;
  }

  private ramp(param: AudioParam, value: number) {
    const now = this.ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setTargetAtTime(value, now, 0.02);
  }

  setVolume(volume: number) {
    this.volume = Math.min(Math.max(volume, 0), 1);
    this.ramp(this.master.gain, this.masterTarget());
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.ramp(this.master.gain, this.masterTarget());
  }

  private bus(layerId: string): GainNode {
    let bus = this.buses.get(layerId);
    if (!bus) {
      bus = this.ctx.createGain();
      bus.gain.value = this.busTargets.get(layerId) ?? 0.7;
      bus.connect(this.master);
      this.buses.set(layerId, bus);
    }
    return bus;
  }

  /** Effective layer level after mute and solo. Takes effect within a few milliseconds. */
  setLayerGain(layerId: string, gain: number) {
    this.busTargets.set(layerId, gain);
    this.ramp(this.bus(layerId).gain, gain);
  }

  /** Schedule one note. `when` is in AudioContext time (seconds). */
  playTone(layerId: string, voiceId: VoiceId, when: number, hz: number, amp: number, durationSec: number) {
    if (!(amp > 0) || !(hz > 0)) return;
    const voice = VOICES[voiceId];
    const duration = voice.percussive ? PERCUSSIVE_SECONDS : durationSec;
    const out = this.bus(layerId);
    for (const [ratio, weight] of voice.partials) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = voice.wave;
      osc.frequency.setValueAtTime(hz * ratio, when);
      if (voice.percussive) osc.frequency.exponentialRampToValueAtTime(hz * ratio * 0.45, when + 0.08);
      env.gain.setValueAtTime(0.0001, when);
      env.gain.exponentialRampToValueAtTime(Math.max(0.0002, NOTE_PEAK * amp * weight), when + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      osc.connect(env).connect(out);
      osc.start(when);
      osc.stop(when + duration + 0.02);
      this.voices.add(osc);
      osc.onended = () => {
        this.voices.delete(osc);
        env.disconnect();
      };
    }
  }

  /** Silence every scheduled and sounding note with a short fade, then restore the master level. */
  stopAll() {
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0, now, 0.012);
    for (const osc of this.voices) {
      try {
        osc.stop(now + 0.06);
      } catch {
        // already stopped
      }
    }
    this.voices.clear();
    this.master.gain.setTargetAtTime(this.masterTarget(), now + 0.1, 0.02);
  }
}

let shared: SonarEngine | null = null;

/** The engine if one exists. Never creates an AudioContext, so it is safe outside a click. */
export function peekSonarEngine(): SonarEngine | null {
  return shared;
}

/** One engine for the whole page. Call only from a click or key handler. */
export function getSonarEngine(): SonarEngine {
  if (!shared) shared = new SonarEngine();
  return shared;
}
