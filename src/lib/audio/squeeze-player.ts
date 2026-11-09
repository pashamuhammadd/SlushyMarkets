"use client";

import type { SoundEvent } from "@/lib/experiments/squeeze";

/** Web Audio voices for the BTC experiment. Starts only after a click. Each bar cuts the one before. */
export class SqueezePlayer {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;

  async ready(): Promise<boolean> {
    try {
      this.ctx ??= new AudioContext();
      await this.ctx.resume();
      return this.ctx.state === "running";
    } catch {
      return false;
    }
  }

  cut() {
    this.bus?.disconnect();
    this.bus = null;
  }

  play(events: readonly SoundEvent[]) {
    this.cut();
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    const bus = ctx.createGain();
    bus.gain.value = 0.7;
    bus.connect(ctx.destination);
    this.bus = bus;
    const at = ctx.currentTime + 0.01;
    for (const e of events) {
      if (e.kind === "cymbal") this.cymbal(ctx, bus, at + e.offset);
      else this.note(ctx, bus, at + e.offset, e.hz, e.volume, e.kind);
    }
  }

  close() {
    this.cut();
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }

  private note(ctx: AudioContext, bus: GainNode, at: number, hz: number, volume: number, kind: "chime" | "drum") {
    const duration = kind === "drum" ? 0.075 : 0.095;
    const partials: Array<[number, number]> = kind === "drum" ? [[1, 1]] : [[1, 1], [2.76, 0.23], [4.1, 0.08]];
    for (const [ratio, weight] of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(hz * ratio, at);
      if (kind === "drum") osc.frequency.exponentialRampToValueAtTime(hz * ratio * 0.45, at + 0.065);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime((kind === "drum" ? 0.19 : 0.22) * volume * weight, at + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      osc.connect(gain).connect(bus);
      osc.start(at);
      osc.stop(at + duration + 0.01);
    }
  }

  private cymbal(ctx: AudioContext, bus: GainNode, at: number) {
    const duration = 0.38;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 137;
    for (let i = 0; i < data.length; i += 1) {
      seed = (seed * 16807) % 2147483647;
      data[i] = ((seed / 2147483647) * 2 - 1) * Math.exp((-i / ctx.sampleRate) * 13);
    }
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 1700;
    gain.gain.setValueAtTime(0.28, at);
    source.connect(filter).connect(gain).connect(bus);
    source.start(at);
    source.stop(at + duration);
    for (const hz of [2039, 3109, 4231, 5867]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = hz;
      g.gain.setValueAtTime(0.018, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      osc.connect(g).connect(bus);
      osc.start(at);
      osc.stop(at + duration);
    }
  }
}
