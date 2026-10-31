import { createRng } from "@/lib/simulations/trades";

/**
 * PROVISIONAL SONIFICATION CONCEPT for "Three Trends, One Piano".
 *
 * Only these parts come from Slushy's earlier demo: three timeframes, each in its own
 * piano register (Daily low, 4H middle, 15m high), with bullish and bearish changes.
 * Everything else below (scale, rhythm, tempo, the trend story itself) is a placeholder
 * chosen by the developers and is isolated in this file so it can be replaced once
 * Slushy approves the real mapping. The trend lines are synthetic, not market data.
 */

export type TrendState = "bullish" | "sideways" | "bearish";
export type TimeframeId = "daily" | "4h" | "15m";

export type Timeframe = {
  id: TimeframeId;
  label: string;
  short: string;
  register: string;
  /** MIDI note of the lowest note in this register. */
  baseMidi: number;
  /** A new note every N steps: slower timeframes play longer notes. */
  everySteps: number;
  color: string;
  /** Trend story for this timeframe, as consecutive segments. */
  segments: { state: TrendState; steps: number }[];
  seed: number;
  /** Relative loudness so the high register never dominates. */
  gain: number;
};

export const STEP_COUNT = 48;
export const STEP_SECONDS = 0.3;

export const TIMEFRAMES: Timeframe[] = [
  {
    id: "daily",
    label: "Daily trend",
    short: "Daily",
    register: "Low register",
    baseMidi: 36, // C2
    everySteps: 4,
    color: "#37D5FA",
    segments: [{ state: "bullish", steps: 48 }],
    seed: 11,
    gain: 1,
  },
  {
    id: "4h",
    label: "4H trend",
    short: "4H",
    register: "Middle register",
    baseMidi: 60, // C4
    everySteps: 2,
    color: "#8B5CF6",
    segments: [
      { state: "bullish", steps: 24 },
      { state: "sideways", steps: 24 },
    ],
    seed: 23,
    gain: 0.8,
  },
  {
    id: "15m",
    label: "15m trend",
    short: "15m",
    register: "High register",
    baseMidi: 84, // C6
    everySteps: 1,
    color: "#F05DEB",
    segments: [
      { state: "bullish", steps: 12 },
      { state: "bearish", steps: 12 },
      { state: "sideways", steps: 12 },
      { state: "bearish", steps: 12 },
    ],
    seed: 37,
    gain: 0.55,
  },
];

/** Major pentatonic degrees across one octave plus the top note. Always consonant together. */
export const SCALE_DEGREES = [0, 2, 4, 7, 9, 12] as const;

const SLOPE: Record<TrendState, number> = { bullish: 1, sideways: 0, bearish: -1 };

export type TrendSeries = {
  timeframe: Timeframe;
  /** Normalized price level per step, 0 (lowest) to 1 (highest). */
  values: number[];
  states: TrendState[];
};

export function statesFor(timeframe: Timeframe): TrendState[] {
  return timeframe.segments.flatMap((segment) => Array.from({ length: segment.steps }, () => segment.state));
}

export function buildSeries(timeframe: Timeframe, steps = STEP_COUNT): TrendSeries {
  const rng = createRng(timeframe.seed);
  const states = statesFor(timeframe).slice(0, steps);
  const raw: number[] = [];
  let level = 0;
  for (let i = 0; i < steps; i += 1) {
    level += SLOPE[states[i]] * 1 + (rng() - 0.5) * 1.1;
    raw.push(level);
  }
  const min = Math.min(...raw);
  const max = Math.max(...raw);
  const span = max - min || 1;
  return { timeframe, values: raw.map((v) => (v - min) / span), states };
}

export const SCENARIO: TrendSeries[] = TIMEFRAMES.map((tf) => buildSeries(tf));

export type Note = { timeframeId: TimeframeId; midi: number; durationSteps: number; gain: number };

/** The note a timeframe plays at a step, or null between its notes. Pitch follows price. */
export function noteAt(series: TrendSeries, step: number): Note | null {
  const { timeframe, values } = series;
  if (step < 0 || step >= values.length || step % timeframe.everySteps !== 0) return null;
  const degree = SCALE_DEGREES[Math.round(values[step] * (SCALE_DEGREES.length - 1))];
  return {
    timeframeId: timeframe.id,
    midi: timeframe.baseMidi + degree,
    durationSteps: timeframe.everySteps,
    gain: timeframe.gain,
  };
}

export function notesAt(step: number, enabled: ReadonlySet<TimeframeId>, scenario: TrendSeries[] = SCENARIO): Note[] {
  return scenario.flatMap((series) => {
    if (!enabled.has(series.timeframe.id)) return [];
    const note = noteAt(series, step);
    return note ? [note] : [];
  });
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Short practice clips for the listen and identify exercise, middle register. */
export type ExerciseClip = { id: string; answer: TrendState; midis: number[] };

export const EXERCISE_CLIPS: ExerciseClip[] = [
  { id: "clip-1", answer: "bearish", midis: [72, 69, 71, 67, 69, 64, 62, 60] },
  { id: "clip-2", answer: "bullish", midis: [60, 62, 60, 64, 67, 64, 69, 72] },
  { id: "clip-3", answer: "sideways", midis: [64, 67, 64, 62, 64, 67, 64, 64] },
];
