/**
 * Bollinger / Keltner compression for the original BTC experiment, and its sound mapping,
 * following Slushy's prototype (version sonar-bbkc14-cymbals4-ema14-v1).
 * Bollinger: SMA(14) +/- 2 population SD. Keltner: EMA(14) +/- 1.5 x ATR(14) with Wilder smoothing.
 */

/** [unix seconds, low, high, open, close, volume] */
export type RawCandle = [number, number, number, number, number, number];

export type SqueezeBar = {
  time: number;
  date: string;
  o: number;
  h: number;
  l: number;
  c: number;
  ema14: number;
  bbL: number;
  bbH: number;
  kcL: number;
  kcH: number;
  direction: number;
  squeeze: boolean;
  release: boolean;
  entry: boolean;
  /** Length of the state before this bar. */
  prior: number;
  /** Bars spent in the current state, including this one. */
  age: number;
};

const PERIOD = 14;

export function squeezeBars(raw: readonly RawCandle[]): SqueezeBar[] {
  const out: SqueezeBar[] = [];
  let ema = 0;
  let atr = 0;
  raw.forEach(([time, l, h, o, c], i) => {
    const previous = i > 0 ? raw[i - 1][4] : o;
    const tr = Math.max(h - l, Math.abs(h - previous), Math.abs(l - previous));
    if (i < PERIOD) {
      ema += c / PERIOD;
      atr += tr / PERIOD;
    } else {
      ema += ((c - ema) * 2) / (PERIOD + 1);
      atr += (tr - atr) / PERIOD;
    }
    if (i < PERIOD - 1) return;
    const closes = raw.slice(i - PERIOD + 1, i + 1).map((r) => r[4]);
    const mean = closes.reduce((s, v) => s + v, 0) / PERIOD;
    const sd = Math.sqrt(closes.reduce((s, v) => s + (v - mean) ** 2, 0) / PERIOD);
    const bbL = mean - 2 * sd;
    const bbH = mean + 2 * sd;
    const kcL = ema - 1.5 * atr;
    const kcH = ema + 1.5 * atr;
    const squeeze = bbL >= kcL && bbH <= kcH;
    const p = out.at(-1);
    out.push({
      time,
      date: new Date(time * 1000).toISOString().slice(0, 10),
      o,
      h,
      l,
      c,
      ema14: ema,
      bbL,
      bbH,
      kcL,
      kcH,
      direction: Math.sign(c - previous),
      squeeze,
      release: Boolean(p?.squeeze && !squeeze),
      entry: Boolean(p && !p.squeeze && squeeze),
      prior: p?.age ?? 0,
      age: p && p.squeeze === squeeze ? p.age + 1 : 1,
    });
  });
  return out;
}

export type ExperimentYear = { all: SqueezeBar[]; startIndex: number; days: SqueezeBar[] };

/**
 * The tradable days of a year, after the indicators have warmed up. At least one earlier bar is
 * kept as the preview, so a year whose history starts inside it (SOL 2020) begins a day later,
 * and a year still in progress (SOL 2026) stops at its last candle. Null if the data has gaps.
 */
export function experimentPeriod(raw: readonly RawCandle[], year: number): ExperimentYear | null {
  const all = squeezeBars(raw);
  let startIndex = all.findIndex((b) => b.date.startsWith(`${year}-`));
  if (startIndex < 0) return null;
  if (startIndex === 0) startIndex = 1;
  const days = all.slice(startIndex).filter((b) => b.date.startsWith(`${year}-`));
  if (days.length < 30) return null;
  for (let i = 1; i < days.length; i += 1) if (days[i].time - days[i - 1].time !== 86_400) return null;
  return days.every((b) => b.l <= Math.min(b.o, b.c) && b.h >= Math.max(b.o, b.c) && b.l > 0) ? { all, startIndex, days } : null;
}

/** A complete calendar year starting on 1 January. Null if any day is missing. */
export function experimentYear(raw: readonly RawCandle[], year: number): ExperimentYear | null {
  const period = experimentPeriod(raw, year);
  const expected = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86_400_000;
  return period && period.days.length === expected && period.days[0].date === `${year}-01-01` ? period : null;
}

export const BAR_SECONDS = 0.5;

export const speedLevel = (age: number) => Math.min(5, 1 + Math.floor((age - 1) / 4.5));
export const pulseVolume = (age: number) => 0.25 + 0.85 * Math.min(1, (age - 1) / 18);
export const entryChimes = (age: number) => (age <= 5 ? 1 : age <= 12 ? 2 : age <= 19 ? 3 : age <= 26 ? 4 : 5);
export const releaseClashes = (age: number) => Math.min(4, speedLevel(age));

export type SoundEvent =
  | { kind: "chime" | "drum"; offset: number; hz: number; volume: number }
  | { kind: "cymbal"; offset: number };

/** What one daily bar plays. A pure description, so it can be tested without audio. */
export function barSoundEvents(b: SqueezeBar, seconds: number = BAR_SECONDS): SoundEvent[] {
  if (b.entry) return Array.from({ length: entryChimes(b.prior) }, (_, j) => ({ kind: "chime", offset: j * 0.045, hz: 1200, volume: 0.95 }));
  if (b.release) return Array.from({ length: releaseClashes(b.prior) }, (_, j) => ({ kind: "cymbal", offset: j * 0.09 }));
  const level = speedLevel(b.age);
  if (b.squeeze) return Array.from({ length: level }, (_, j) => ({ kind: "drum", offset: (j * seconds) / level, hz: (b.age + j) % 2 ? 110 : 220, volume: pulseVolume(b.age) }));
  if (b.direction) return Array.from({ length: level }, (_, j) => ({ kind: "chime", offset: (j * seconds) / level, hz: b.direction > 0 ? 1050 : 520, volume: pulseVolume(b.age) }));
  return [];
}

export type DotMeter = { id: string; label: string; value: string; unit: string; note: string; dots: number };

/** Dots out of 20 for a value against a maximum, as in the prototype's dot grids. */
export function dotCount(value: number, max: number): number {
  return value <= 0 || !Number.isFinite(value) ? 0 : Math.min(20, Math.max(1, Math.round((value / max) * 20)));
}

/**
 * The prototype's visual guide: five numbers, each with a 20 dot grid.
 * Gap: how far the Bollinger Bands sit outside the Keltner Channels, as a share of the channel half width.
 */
export function squeezeMeters(b: SqueezeBar, seconds: number = BAR_SECONDS): DotMeter[] {
  const gap = (Math.max(b.bbH - b.kcH, b.kcL - b.bbL) / ((b.kcH - b.kcL) / 2)) * 100;
  const rate = speedLevel(b.age) / seconds;
  const drums = b.squeeze && !b.entry ? rate : 0;
  const chimes = !b.squeeze && !b.release && b.direction ? rate : 0;
  const maxRate = 5 / seconds;
  return [
    { id: "gap", label: "Gap to compression", value: Math.max(0, gap).toFixed(0), unit: "%", note: "20 dots = 100%, 0 while compressed", dots: dotCount(gap, 100) },
    { id: "compressed", label: "Compression candles", value: b.squeeze ? String(b.age) : "0", unit: "bars", note: "20 dots at 19 candles", dots: dotCount(b.squeeze ? b.age : 0, 19) },
    { id: "outside", label: "Outside compression", value: b.squeeze ? "0" : String(b.age), unit: "bars", note: "20 dots at 19 candles", dots: dotCount(b.squeeze ? 0 : b.age, 19) },
    { id: "chimes", label: `${b.direction > 0 ? "High" : "Low"} chime pulses`, value: chimes.toFixed(1), unit: "/sec", note: "20 dots = maximum pulse rate", dots: dotCount(chimes, maxRate) },
    { id: "drums", label: "Drum pulses", value: drums.toFixed(1), unit: "/sec", note: "20 dots = maximum pulse rate", dots: dotCount(drums, maxRate) },
  ];
}
