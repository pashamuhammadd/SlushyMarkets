"use client";

import type { DailyNote } from "@/lib/experiments/daily/sound";

/** Web Audio voices for the BTC experiment. Starts only after a click. Each bar cuts the one before. */
export class SqueezePlayer {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private level = 0.7;

  /** 0 to 1. Applies from the next bar. */
  setVolume(volume: number) {
    this.level = Math.min(1, Math.max(0, volume));
  }

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

  play(events: readonly DailyNote[]) {
    this.cut();
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    const bus = ctx.createGain();
    bus.gain.value = this.level;
    bus.connect(ctx.destination);
    this.bus = bus;
    const at = ctx.currentTime + 0.01;
    for (const e of events) {
      if (e.kind === "cymbal") this.cymbal(ctx, bus, at + e.offset);
      else this.note(ctx, bus, at + e.offset, e.hz, e.volume, e.kind, e.duration);
    }
  }

  close() {
    this.cut();
    this.stopStorm();
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }

  // Adaptive Cloud storm: a looping rain recording with occasional thunder, on its own master,
  // following the handoff (master 0.7 x volume, rain 0.65, thunder 0.8, thunder no sooner than
  // max(6 s, 0.65 x its length)). Falls back to a short filtered rumble if the files fail.
  private stormFiles: Promise<{ rain: AudioBuffer; thunder: AudioBuffer } | null> | null = null;
  private storm: { master: GainNode; sources: Set<AudioBufferSourceNode>; nextThunder: number } | null = null;

  prepareStorm(): Promise<unknown> {
    const ctx = this.ctx;
    if (!ctx) return Promise.resolve(null);
    this.stormFiles ??= Promise.all(
      ["/experiments/cloud-rain.mp3", "/experiments/cloud-thunder.mp3"].map(async (url) => {
        const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
        if (!response.ok) throw new Error("storm");
        return ctx.decodeAudioData(await response.arrayBuffer());
      }),
    )
      .then(([rain, thunder]) => ({ rain, thunder }))
      .catch(() => null);
    return this.stormFiles;
  }

  /** Call once per candle while the cloud preset plays. `inside` starts or keeps the storm. */
  async stormStep(inside: boolean, seconds: number) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    if (!inside) {
      this.stopStorm();
      return;
    }
    const files = await this.prepareStorm();
    if (!files || typeof files !== "object") {
      this.rumble(ctx, seconds);
      return;
    }
    const { rain, thunder } = files as { rain: AudioBuffer; thunder: AudioBuffer };
    if (!this.storm) {
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.connect(ctx.destination);
      this.storm = { master, sources: new Set(), nextThunder: 0 };
      this.layer(ctx, rain, 0.65, true);
    }
    this.storm.master.gain.setTargetAtTime(this.level * 0.7, ctx.currentTime, 0.06);
    if (ctx.currentTime >= this.storm.nextThunder) {
      this.layer(ctx, thunder, 0.8, false);
      this.storm.nextThunder = ctx.currentTime + Math.max(6, thunder.duration * 0.65);
    }
  }

  stopStorm() {
    const ctx = this.ctx;
    const storm = this.storm;
    if (!ctx || !storm) return;
    this.storm = null;
    storm.master.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    for (const source of storm.sources) {
      try {
        source.stop(ctx.currentTime + 0.55);
      } catch {
        // already stopped
      }
    }
  }

  private layer(ctx: AudioContext, buffer: AudioBuffer, level: number, loop: boolean) {
    const storm = this.storm;
    if (!storm) return;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = loop;
    gain.gain.value = level;
    source.connect(gain).connect(storm.master);
    storm.sources.add(source);
    source.onended = () => {
      storm.sources.delete(source);
      if (!storm.sources.size) storm.master.disconnect();
    };
    source.start(ctx.currentTime + 0.01);
  }

  private rumble(ctx: AudioContext, seconds: number) {
    const bus = ctx.createGain();
    bus.gain.value = this.level;
    bus.connect(ctx.destination);
    const at = ctx.currentTime + 0.01;
    const duration = Math.min(0.44, seconds * 0.88);
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 113;
    for (let j = 0; j < data.length; j += 1) {
      seed = (seed * 16807) % 2147483647;
      data[j] = ((seed / 2147483647) * 2 - 1) * (0.65 + 0.35 * Math.sin((j / ctx.sampleRate) * 19));
    }
    const source = ctx.createBufferSource();
    const lo = ctx.createBiquadFilter();
    const hi = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    lo.type = "lowpass";
    lo.frequency.value = 550;
    hi.type = "highpass";
    hi.frequency.value = 70;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.8, at + Math.min(0.045, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(lo).connect(hi).connect(gain).connect(bus);
    source.onended = () => bus.disconnect();
    source.start(at);
    source.stop(at + duration + 0.01);
  }

  private note(ctx: AudioContext, bus: GainNode, at: number, hz: number, volume: number, kind: Exclude<DailyNote["kind"], "cymbal">, length?: number) {
    const duration = length ?? (kind === "drum" ? 0.075 : kind === "organ" ? 0.2 : 0.095);
    const partials: Array<[number, number]> =
      kind === "drum" || kind === "wood" ? [[1, 1]] : kind === "pure" ? [[1, 1], [2, 0.12], [3, 0.04]] : kind === "organ" ? [[1, 1], [2, 0.3], [3, 0.12]] : kind === "bell" ? [[1, 1], [2.76, 0.2]] : [[1, 1], [2.76, 0.23], [4.1, 0.08]];
    for (const [ratio, weight] of partials) {
      const osc = ctx.createOscillator();
      osc.type = kind === "wood" ? "triangle" : "sine";
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(hz * ratio, at);
      if (kind === "drum") osc.frequency.exponentialRampToValueAtTime(hz * ratio * 0.45, at + 0.065);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime((kind === "drum" ? 0.19 : kind === "pure" ? 0.14 : 0.22) * volume * weight, at + (kind === "pure" ? 0.006 : 0.003));
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
