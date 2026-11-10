import { barSoundEvents } from "../squeeze";
import { cloudPlan } from "./cloud";
import type { DailyBar } from "./indicators";

/** Sound presets of the daily experiment. Pure note plans, played by SqueezePlayer. */

export const DAILY_PRESETS = ["squeeze", "efficiency", "volume", "ema", "cloud", "none"] as const;
export type DailyPreset = (typeof DAILY_PRESETS)[number];

export const PRESET_INFO: Record<DailyPreset, { name: string; description: string }> = {
  squeeze: {
    name: "Squeeze Sonar",
    description:
      "Quick chimes when compression begins, drums that build during compression, 1 to 4 cymbal clashes on release, and high or low chimes outside compression. Pink lines are Bollinger Bands, dashed white lines are Keltner Channels, cyan is the 14 EMA.",
  },
  efficiency: {
    name: "Efficiency Rhythm (ER14)",
    description:
      "ER14 above 0.5 plays pentatonic chimes. At or below 0.5 it plays deep drums. Pulses grow louder and faster while a state lasts, up to 16 per second. Closes inside the shaded channel mean ER is 0.5 or less. Efficiency is not a forecast.",
  },
  volume: {
    name: "Volume Pulse + Sonar Channels",
    description:
      "Buyer-initiated volume plays a brighter 220 Hz drum, seller-initiated volume a deeper 110 Hz drum. The dominant side gets louder and faster. A low organ and a high bell get louder near the lower and upper Keltner channel. Every trade still has a buyer and a seller.",
  },
  ema: {
    name: "EMA Sonar (7 / 20 / 50)",
    description: "7 EMA: slow pluck. 20 EMA: medium organ. 50 EMA: fast deep organ. Each gets louder as price comes near it. The 7 EMA goes silent at 1 ATR or more away.",
  },
  cloud: {
    name: "Adaptive Cloud v1.0",
    description:
      "Slushy's adaptive cloud: an adaptive log-price center and an EMA100 anchor with a volatility buffer, delayed two daily candles. Rain and thunder while price is inside the cloud, high chimes above it, lower chimes below it. It describes where price is, it is not a forecast.",
  },
  none: { name: "Chart Only", description: "Candles and your fills only. No market sounds." },
};

export type DailyNote =
  | { kind: "chime" | "drum" | "bell" | "organ" | "wood" | "pure"; offset: number; hz: number; volume: number; duration?: number }
  | { kind: "cymbal"; offset: number };

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880];
const PATTERN = [0, 1, 2, 3, 4, 3, 2, 1];

export function efficiencyNotes(b: DailyBar, seconds: number): DailyNote[] {
  const efficient = b.er > 0.5;
  const age = Math.max(1, b.erAge);
  const rate = Math.min(16, 2 + Math.floor((age - 1) / 2));
  const count = Math.max(1, Math.round(rate * seconds));
  const grow = Math.min(1, (age - 1) / 28);
  return Array.from({ length: count }, (_, j) => ({
    kind: efficient ? "bell" : "drum",
    offset: (j * seconds) / count,
    hz: efficient ? PENTATONIC[PATTERN[(age - 1 + j) % PATTERN.length]] : j % 2 ? 110 : 85,
    volume: efficient ? 0.25 + 0.5 * grow : 0.3 + 0.65 * grow,
    duration: Math.min(efficient ? 0.12 : 0.075, (seconds / count) * 0.85),
  }));
}

export function volumeNotes(b: DailyBar, seconds: number): DailyNote[] {
  const notes: DailyNote[] = [];
  if (b.buyShare !== null) {
    const share = b.buyShare;
    const strength = Math.min(1, Math.abs(share - 0.5) / 0.25);
    const side = share > 0.525 ? "buy" : share < 0.475 ? "sell" : "balanced";
    const persistence = Math.min(1, Math.max(0, b.dominanceAge - 1) / 12);
    const rate = side === "balanced" ? 2 : Math.min(16, 2 + Math.round(strength * 10 + persistence * 4));
    const major = Math.max(1, Math.round(rate * seconds));
    const loud = Math.min(1.35, Math.max(0.45, Math.sqrt(Math.max(0, b.volumeRatio))));
    for (const which of ["buy", "sell"] as const) {
      const fraction = which === "buy" ? share : 1 - share;
      if (fraction === 0) continue;
      const dominant = which === side;
      const volume = Math.min(1, (side === "balanced" ? 0.4 : dominant ? 0.42 + 0.35 * strength + 0.18 * persistence : 0.12) * loud * Math.min(1, fraction * 2));
      const n = dominant ? major : 1;
      for (let j = 0; j < n; j += 1)
        notes.push({ kind: "drum", offset: ((j + (which === "sell" ? 0.45 : 0)) * seconds) / n, hz: which === "buy" ? 220 : 110, volume, duration: Math.min(0.075, (seconds / n) * 0.5) });
    }
  }
  const half = (b.kcH - b.kcL) / 2;
  if (half > 0) {
    const near = (d: number) => Math.max(0, 1 - Math.max(0, d) / half) ** 1.5;
    const lower = b.c <= b.kcL ? 1 : near(b.c - b.kcL);
    const upper = b.c >= b.kcH ? 1 : near(b.kcH - b.c);
    if (lower > 0.001) notes.push({ kind: "organ", offset: seconds * 0.12, hz: 220, volume: lower * 0.85, duration: Math.min(0.16, seconds * 0.65) });
    if (upper > 0.001) notes.push({ kind: "bell", offset: seconds * 0.52, hz: 784, volume: upper * 0.65, duration: Math.min(0.12, seconds * 0.4) });
  }
  return notes;
}

export function emaNotes(b: DailyBar, position: number): DailyNote[] {
  const notes: DailyNote[] = [];
  if (position % 2 === 0 && b.g7 > 0) notes.push({ kind: "wood", offset: 0, hz: 495, volume: b.g7 * 0.7, duration: 0.1 });
  notes.push({ kind: "organ", offset: 0.12, hz: 330, volume: b.g20 * 0.65, duration: 0.2 });
  notes.push({ kind: "organ", offset: 0.02, hz: 165, volume: b.g50 * 0.65, duration: 0.18 });
  notes.push({ kind: "organ", offset: 0.27, hz: 165, volume: b.g50 * 0.65, duration: 0.18 });
  return notes.filter((n) => n.kind === "cymbal" || n.volume > 0.001);
}

export function presetNotes(preset: DailyPreset, b: DailyBar, position: number, seconds: number): DailyNote[] {
  if (preset === "squeeze") return barSoundEvents(b, seconds);
  if (preset === "efficiency") return efficiencyNotes(b, seconds);
  if (preset === "volume") return volumeNotes(b, seconds);
  if (preset === "ema") return emaNotes(b, position);
  if (preset === "cloud") return cloudPlan(b, position).notes.map((hz, j) => ({ kind: "pure" as const, offset: j * seconds * 0.45, hz, volume: 1, duration: Math.min(0.14, seconds * 0.4) }));
  return [];
}
