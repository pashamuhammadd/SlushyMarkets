import { ema } from "@/lib/simulations/moving-averages";
import { averageRange } from "../indicators";
import { VISIBLE_BARS, type Bar } from "../market";
import type {
  ChartMarker,
  ChartModel,
  LayerSettings,
  ModeOptions,
  ModeToggle,
  Preset,
  ReadoutItem,
  SonicEvent,
  SonificationMode,
} from "../types";
import type { VoiceId } from "../voices";

/**
 * Sonar Bands: hear price moving inside a channel around a moving average.
 *
 * Taken from Slushy's Sonar Bands prototype (v1.1, provisional until Slushy approves it):
 * - channel: midline EMA(10), bands at the midline plus or minus 1.7 x ATR(7)
 * - lower band: deep organ, 165 Hz. Upper band: higher organ, 330 Hz, a little later in the bar
 * - inside the channel, each organ is louder the closer price is to its band:
 *   loudness = (1 - distance / ATR) ^ 2, silent at one ATR away
 * - after a close beyond a band, that band's organ stays extra loud (1.35) until price closes back inside
 * - "Proximity + motion": a rising note pair while price approaches a band, a falling pair while
 *   it moves away (change of at least 0.08 ATR since the last bar); otherwise one steady note
 * - chime when a close breaks outside the channel (up: 880 then 1174.66 Hz, down: 660 then 440 Hz)
 * - soft double knock (260 Hz) when price closes back inside
 * - optional midline note (off by default) whose pitch follows the midline across two octaves
 *
 * One change from the prototype: there the midline pitch was tied to an absolute price of 100,
 * which only works near the start price. Here it uses the same two octave range as the chart,
 * like the prototype's own pitch helper, so it works on every timeframe.
 */

export const BAND_EMA_PERIOD = 10;
export const BAND_ATR_PERIOD = 7;
export const BAND_ATR_MULTIPLIER = 1.7;
/** Extra loudness for a band that price has closed beyond. */
export const OUTSIDE_LOUDNESS = 1.35;
/** Distance change (in ATR) below which a bar counts as steady in motion mode. */
export const MOTION_THRESHOLD_ATR = 0.08;

export const BAND_COLORS = { upper: "#F05DEB", lower: "#44D9A4", midline: "#A78BFA", breakout: "#FFD166", return: "#B79BFF" } as const;

export type BandSide = -1 | 0 | 1;

export type SonarBandsAnalysis = {
  bars: Bar[];
  atr: number[];
  mid: number[];
  upper: number[];
  lower: number[];
  /** 1: closed above the upper band, -1: below the lower band, 0: inside. */
  state: BandSide[];
  /** Direction of a fresh break outside the channel at this bar, else 0. */
  breakout: BandSide[];
  /** Side price came back from when it closed back inside at this bar, else 0. */
  returned: BandSide[];
  /** Change in distance to each band since the previous bar, in ATR. Negative means approaching. */
  motion: { lower: number[]; upper: number[] };
  /** Visible price range, used for the midline pitch. */
  low: number;
  high: number;
};

export function bandState(close: number, lower: number, upper: number): BandSide {
  if (close > upper) return 1;
  if (close < lower) return -1;
  return 0;
}

export function analyzeSonarBands(series: readonly Bar[]): SonarBandsAnalysis {
  const closes = series.map((b) => b.close);
  const mids = ema(closes, BAND_EMA_PERIOD).map((v, i) => v ?? closes[i]);
  const atrs = averageRange(series, BAND_ATR_PERIOD);
  const uppers = mids.map((m, i) => m + BAND_ATR_MULTIPLIER * atrs[i]);
  const lowers = mids.map((m, i) => m - BAND_ATR_MULTIPLIER * atrs[i]);
  const states = closes.map((c, i) => bandState(c, lowers[i], uppers[i]));

  const start = Math.max(0, series.length - VISIBLE_BARS);
  const breakout: BandSide[] = [];
  const returned: BandSide[] = [];
  const motionLower: number[] = [];
  const motionUpper: number[] = [];
  for (let i = start; i < series.length; i += 1) {
    const prev = i > 0 ? i - 1 : i;
    const now = states[i];
    const before = states[prev];
    breakout.push(now !== 0 && now !== before ? now : 0);
    returned.push(now === 0 && before !== 0 ? before : 0);
    const atr = atrs[i] || 1;
    motionLower.push((Math.abs(closes[i] - lowers[i]) - Math.abs(closes[prev] - lowers[prev])) / atr);
    motionUpper.push((Math.abs(closes[i] - uppers[i]) - Math.abs(closes[prev] - uppers[prev])) / atr);
  }

  const bars = series.slice(start).map((b) => ({ ...b }));
  const upper = uppers.slice(start);
  const lower = lowers.slice(start);
  const low = Math.min(...bars.map((b) => b.low), ...lower);
  const high = Math.max(...bars.map((b) => b.high), ...upper);
  return {
    bars,
    atr: atrs.slice(start),
    mid: mids.slice(start),
    upper,
    lower,
    state: states.slice(start),
    breakout,
    returned,
    motion: { lower: motionLower, upper: motionUpper },
    low,
    high,
  };
}

/** Loudness for one band: extra loud beyond it, else (1 - distance / ATR) squared. */
export function bandLoudness(side: "lower" | "upper", index: number, a: SonarBandsAnalysis): number {
  const close = a.bars[index].close;
  const band = a[side][index];
  if ((side === "upper" && close > band) || (side === "lower" && close < band)) return OUTSIDE_LOUDNESS;
  const atr = a.atr[index];
  if (!(atr > 0)) return 0;
  return Math.pow(Math.max(0, 1 - Math.abs(close - band) / atr), 2);
}

const BAND_TONES = { lower: { hz: 165, offsetSec: 0 }, upper: { hz: 330, offsetSec: 0.27 } } as const;

function bandEvents(side: "lower" | "upper", index: number, a: SonarBandsAnalysis, motion: boolean): SonicEvent[] {
  const amp = bandLoudness(side, index, a);
  if (amp <= 0) return [];
  const { hz, offsetSec } = BAND_TONES[side];
  const delta = a.motion[side][index];
  if (!motion || Math.abs(delta) < MOTION_THRESHOLD_ATR) return [{ offsetSec, hz, amp, durationSec: 0.17 }];
  // Approaching: second note three semitones up. Moving away: three semitones down.
  const second = hz * 2 ** ((delta < 0 ? 3 : -3) / 12);
  return [
    { offsetSec, hz, amp, durationSec: 0.075 },
    { offsetSec: offsetSec + 0.095, hz: second, amp, durationSec: 0.075 },
  ];
}

/** Midline pitch across two octaves above 220 Hz, using the visible price range. */
export function midlineHz(value: number, low: number, high: number): number {
  const t = high > low ? Math.min(Math.max((value - low) / (high - low), 0), 1) : 0.5;
  return 220 * 2 ** (2 * t);
}

export function sonarBandsEvents(layerId: string, index: number, a: SonarBandsAnalysis, options: ModeOptions): SonicEvent[] {
  const motion = options.motion ?? true;
  switch (layerId) {
    case "lower":
    case "upper":
      return bandEvents(layerId, index, a, motion);
    case "midline":
      return [{ offsetSec: 0.185, hz: midlineHz(a.mid[index], a.low, a.high), amp: 0.5, durationSec: 0.065 }];
    case "breakout": {
      const dir = a.breakout[index];
      if (dir === 0) return [];
      const [first, second] = dir > 0 ? [880, 1174.66] : [660, 440];
      return [
        { offsetSec: 0, hz: first, amp: 1, durationSec: 0.16 },
        { offsetSec: 0.12, hz: second, amp: 1, durationSec: 0.2 },
      ];
    }
    case "return":
      if (a.returned[index] === 0) return [];
      return [
        { offsetSec: 0.04, hz: 260, amp: 0.55, durationSec: 0.1 },
        { offsetSec: 0.15, hz: 260, amp: 0.35, durationSec: 0.1 },
      ];
    default:
      throw new Error(`Unknown Sonar Bands layer: ${layerId}`);
  }
}

export function sonarBandsChart(a: SonarBandsAnalysis): ChartModel {
  const markers: ChartMarker[] = [];
  a.bars.forEach((bar, i) => {
    if (a.breakout[i] !== 0) markers.push({ index: i, price: bar.close, kind: a.breakout[i] > 0 ? "up" : "down" });
    else if (a.returned[i] !== 0) markers.push({ index: i, price: bar.close, kind: "return" });
  });
  return {
    bars: a.bars,
    lines: [
      { id: "upper", label: "Upper band", color: BAND_COLORS.upper, values: a.upper },
      { id: "midline", label: "Midline EMA 10", color: BAND_COLORS.midline, values: a.mid, dashed: true },
      { id: "lower", label: "Lower band", color: BAND_COLORS.lower, values: a.lower },
    ],
    markers,
    description:
      "Simulated candles inside a channel: the pink upper band and mint lower band sit 1.7 average ranges from the dashed violet midline. Rings mark breakouts, squares mark closes back inside.",
  };
}

function motionWord(delta: number): string {
  if (Math.abs(delta) < MOTION_THRESHOLD_ATR) return "";
  return delta < 0 ? ", approaching" : ", moving away";
}

export function sonarBandsReadout(index: number, a: SonarBandsAnalysis): ReadoutItem[] {
  const close = a.bars[index].close;
  const atr = a.atr[index] || 1;
  const state = a.state[index];
  const lowerGap = (close - a.lower[index]) / atr;
  const upperGap = (a.upper[index] - close) / atr;

  const lowerText =
    state === -1
      ? "Price closed below the lower band. Extra loud until it returns."
      : `Price is ${lowerGap.toFixed(1)} ATR above the lower band${motionWord(a.motion.lower[index])}.`;
  const upperText =
    state === 1
      ? "Price closed above the upper band. Extra loud until it returns."
      : `Price is ${upperGap.toFixed(1)} ATR below the upper band${motionWord(a.motion.upper[index])}.`;

  let channelText = state === 0 ? "Price closed inside the channel." : state > 0 ? "Price is outside, above the channel." : "Price is outside, below the channel.";
  if (a.breakout[index] !== 0) channelText = `Breakout ${a.breakout[index] > 0 ? "above" : "below"} the channel on this bar. Chime.`;
  else if (a.returned[index] !== 0) channelText = "Closed back inside the channel on this bar. Double knock.";

  return [
    { id: "lower", label: "Lower band", color: BAND_COLORS.lower, loudness: bandLoudness("lower", index, a), text: lowerText },
    { id: "upper", label: "Upper band", color: BAND_COLORS.upper, loudness: bandLoudness("upper", index, a), text: upperText },
    { id: "channel", label: "Channel", color: BAND_COLORS.breakout, loudness: null, text: channelText },
  ];
}

export const SONAR_BANDS_TOGGLES: readonly ModeToggle[] = [
  {
    id: "motion",
    label: "Proximity + motion",
    description: "Rising note pairs while price approaches a band, falling pairs while it moves away. Off plays one steady note.",
    defaultValue: true,
  },
];

function settings(voice: VoiceId, extra: Partial<LayerSettings> = {}): LayerSettings {
  return { voice, rate: 2, gain: 0.7, mute: false, solo: false, ...extra };
}

export const SONAR_BANDS_PRESETS: readonly Preset[] = [
  {
    id: "slushy",
    label: "Slushy's Sonar Bands",
    description: "The prototype mix: two organs for the band edges with motion pairs, chimes for breakouts and knocks for returns.",
    layers: {
      lower: settings("organ"),
      upper: settings("organ"),
      midline: settings("tuned-wood", { mute: true }),
      breakout: settings("chime"),
      return: settings("wood"),
    },
    options: { motion: true },
  },
  {
    id: "edges",
    label: "Edges only",
    description: "Only the two organs, one steady note each. Learn how loudness follows the distance to each band.",
    layers: {
      lower: settings("organ"),
      upper: settings("organ"),
      midline: settings("tuned-wood", { mute: true }),
      breakout: settings("chime", { mute: true }),
      return: settings("wood", { mute: true }),
    },
    options: { motion: false },
  },
  {
    id: "events",
    label: "Events only",
    description: "Silence until something happens: a chime when price breaks out, a knock when it closes back inside.",
    layers: {
      lower: settings("organ", { mute: true }),
      upper: settings("organ", { mute: true }),
      midline: settings("tuned-wood", { mute: true }),
      breakout: settings("chime"),
      return: settings("wood"),
    },
    options: { motion: true },
  },
];

export const sonarBandsMode: SonificationMode<SonarBandsAnalysis> = {
  id: "sonar-bands",
  title: "Sonar Bands",
  layers: [
    {
      id: "lower",
      label: "Lower band",
      color: BAND_COLORS.lower,
      describes: "Deep organ. Louder as price nears the lower band, extra loud after a close below it.",
      detail: "165 Hz tone",
      previewHz: 165,
      kind: "continuous",
    },
    {
      id: "upper",
      label: "Upper band",
      color: BAND_COLORS.upper,
      describes: "Higher organ. Louder as price nears the upper band, extra loud after a close above it.",
      detail: "330 Hz tone",
      previewHz: 330,
      kind: "continuous",
    },
    {
      id: "midline",
      label: "Midline",
      color: BAND_COLORS.midline,
      describes: "Optional note that follows the midline EMA: higher when the channel sits higher.",
      detail: "Pitch follows the midline",
      previewHz: 330,
      kind: "continuous",
    },
    {
      id: "breakout",
      label: "Breakout",
      color: BAND_COLORS.breakout,
      describes: "Rising chime for a close above the channel, falling chime for a close below it.",
      detail: "Plays on breakouts",
      previewHz: 880,
      kind: "event",
    },
    {
      id: "return",
      label: "Back inside",
      color: BAND_COLORS.return,
      describes: "Soft double knock when price closes back inside the channel.",
      detail: "Plays on returns",
      previewHz: 260,
      kind: "event",
    },
  ],
  presets: SONAR_BANDS_PRESETS,
  toggles: SONAR_BANDS_TOGGLES,
  analyze: analyzeSonarBands,
  events: sonarBandsEvents,
  chart: sonarBandsChart,
  readout: sonarBandsReadout,
};
