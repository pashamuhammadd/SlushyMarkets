import { buildMarket, VISIBLE_BARS } from "./market";
import { analyzeSonarBands, bandLoudness, MOTION_THRESHOLD_ATR, sonarBandsEvents, type SonarBandsAnalysis } from "./modes/sonar-bands";
import type { ChartModel, SonicEvent } from "./types";
import type { VoiceId } from "./voices";
import { sonarBandsChart } from "./modes/sonar-bands";

/**
 * Listening quiz for Sonar Bands. Every clip is a few bars cut from a simulated chart and
 * played with the Sonar Bands sounds. The answer is computed from the same analysis that makes
 * the sound, so a clip can never contradict its own audio. Clips are picked by searching seeds
 * in order, so one quiz set is the same for everyone and replays identically.
 *
 * Only clips with a clear answer are used: one band clearly louder than the other, a single
 * breakout or none at all, motion pairs that all point the same way.
 */

export type QuizKind = "closer" | "breakout" | "motion";

export type QuizChoice = { value: string; label: string };

export type QuizClip = {
  id: string;
  kind: QuizKind;
  seed: number;
  /** First visible bar of the clip. */
  from: number;
  length: number;
  question: string;
  choices: readonly QuizChoice[];
  answer: string;
  explanation: string;
  /** Layers that sound in this clip, and whether the motion pairs are on. */
  layers: readonly QuizLayer[];
  motion: boolean;
};

export type QuizLayer = "lower" | "upper" | "breakout" | "return";

export const QUIZ_VOICES: Record<QuizLayer, VoiceId> = { lower: "speaker-organ", upper: "speaker-organ", breakout: "chime", return: "wood" };

const CLOSER: readonly QuizChoice[] = [
  { value: "lower", label: "The lower band (deep organ)" },
  { value: "upper", label: "The upper band (higher organ)" },
];
const BREAKOUT: readonly QuizChoice[] = [
  { value: "up", label: "Broke out upward" },
  { value: "down", label: "Broke out downward" },
  { value: "none", label: "Stayed inside" },
];
const MOTION: readonly QuizChoice[] = [
  { value: "toward", label: "Moving toward the band" },
  { value: "away", label: "Moving away from the band" },
];

const range = (from: number, length: number) => Array.from({ length }, (_, k) => from + k);

/** "closer": every bar inside the channel, one band audible on every bar, the other silent. */
export function closerAnswer(a: SonarBandsAnalysis, from: number, length: number): "lower" | "upper" | null {
  const bars = range(from, length);
  if (bars.some((i) => a.state[i] !== 0)) return null;
  for (const side of ["lower", "upper"] as const) {
    const other = side === "lower" ? "upper" : "lower";
    if (bars.every((i) => bandLoudness(side, i, a) >= 0.2 && bandLoudness(other, i, a) === 0)) return side;
  }
  return null;
}

/** "breakout": exactly one breakout and no return in the clip, or a clip that stays inside. */
export function breakoutAnswer(a: SonarBandsAnalysis, from: number, length: number): "up" | "down" | "none" | null {
  const bars = range(from, length);
  const breaks = bars.filter((i) => a.breakout[i] !== 0);
  if (bars.some((i) => a.returned[i] !== 0)) return null;
  if (breaks.length === 0) {
    // "Stayed inside" only when price was near a band at some point, so the clip is not trivially silent.
    const near = bars.some((i) => Math.max(bandLoudness("lower", i, a), bandLoudness("upper", i, a)) >= 0.3);
    return bars.every((i) => a.state[i] === 0) && near ? "none" : null;
  }
  // The breakout must not be on the first bar, so the listener hears the organ build up first.
  if (breaks.length !== 1 || breaks[0] === from) return null;
  return a.breakout[breaks[0]] > 0 ? "up" : "down";
}

/** "motion": one band audible and inside on every bar, every bar a motion pair the same way. */
export function motionAnswer(a: SonarBandsAnalysis, from: number, length: number): { side: "lower" | "upper"; answer: "toward" | "away" } | null {
  const bars = range(from, length);
  if (bars.some((i) => a.state[i] !== 0)) return null;
  for (const side of ["lower", "upper"] as const) {
    const other = side === "lower" ? "upper" : "lower";
    if (!bars.every((i) => bandLoudness(side, i, a) >= 0.15 && bandLoudness(other, i, a) === 0)) continue;
    const deltas = bars.map((i) => a.motion[side][i]);
    if (deltas.every((d) => d <= -MOTION_THRESHOLD_ATR)) return { side, answer: "toward" };
    if (deltas.every((d) => d >= MOTION_THRESHOLD_ATR)) return { side, answer: "away" };
  }
  return null;
}

type Want = { kind: QuizKind; answer: string; length: number };

/** The order of a quiz set: two of each kind, mixed. */
const PLAN: readonly Want[] = [
  { kind: "closer", answer: "lower", length: 4 },
  { kind: "breakout", answer: "up", length: 6 },
  { kind: "motion", answer: "toward", length: 3 },
  { kind: "closer", answer: "upper", length: 4 },
  { kind: "breakout", answer: "none", length: 6 },
  { kind: "motion", answer: "away", length: 3 },
];

export const QUIZ_SIZE = PLAN.length;
export const QUIZ_BASE_SEED = 7_100_000;

const cache = new Map<number, SonarBandsAnalysis>();
export function quizAnalysis(seed: number): SonarBandsAnalysis {
  let a = cache.get(seed);
  if (!a) {
    a = analyzeSonarBands(buildMarket(seed, "15m"));
    cache.set(seed, a);
    if (cache.size > 200) cache.delete(cache.keys().next().value as number);
  }
  return a;
}

function makeClip(want: Want, seed: number, from: number, a: SonarBandsAnalysis): QuizClip | null {
  const id = `${seed}-${from}-${want.kind}`;
  const base = { id, kind: want.kind, seed, from, length: want.length };
  if (want.kind === "closer") {
    if (closerAnswer(a, from, want.length) !== want.answer) return null;
    return {
      ...base,
      question: "Only the two band organs play. Which band is price closer to?",
      choices: CLOSER,
      answer: want.answer,
      explanation:
        want.answer === "lower"
          ? "You heard only the deep 165 Hz organ, so price was near the lower band. The upper organ stayed silent because price was more than one ATR away from it."
          : "You heard only the higher 330 Hz organ, so price was near the upper band. The lower organ stayed silent because price was more than one ATR away from it.",
      layers: ["lower", "upper"],
      motion: false,
    };
  }
  if (want.kind === "breakout") {
    if (breakoutAnswer(a, from, want.length) !== want.answer) return null;
    const explanation = {
      up: "A rising chime pair rang, so a close broke above the upper band. The higher organ then stayed extra loud.",
      down: "A falling chime pair rang, so a close broke below the lower band. The deep organ then stayed extra loud.",
      none: "The organs grew louder near a band, but no chime rang, so every close stayed inside the channel.",
    } as const;
    return {
      ...base,
      question: "Listen for chimes. Did price break out of the channel?",
      choices: BREAKOUT,
      answer: want.answer,
      explanation: explanation[want.answer as keyof typeof explanation],
      layers: ["lower", "upper", "breakout", "return"],
      motion: false,
    };
  }
  const m = motionAnswer(a, from, want.length);
  if (!m || m.answer !== want.answer) return null;
  const organ = m.side === "lower" ? "deep" : "higher";
  return {
    ...base,
    question: "Motion pairs are on. Is price moving toward the band you hear, or away from it?",
    choices: MOTION,
    answer: m.answer,
    explanation:
      m.answer === "toward"
        ? `Each note of the ${organ} organ was followed by a higher one: price was getting closer to the ${m.side} band.`
        : `Each note of the ${organ} organ was followed by a lower one: price was moving away from the ${m.side} band.`,
    layers: [m.side],
    motion: true,
  };
}

/** One quiz set. `set` 0 is the default; other numbers give fresh clips. */
export function buildQuiz(set = 0): QuizClip[] {
  const clips: QuizClip[] = [];
  let seed = QUIZ_BASE_SEED + set * 1000;
  for (const want of PLAN) {
    let found: QuizClip | null = null;
    for (let tries = 0; tries < 400 && !found; tries += 1, seed += 1) {
      const a = quizAnalysis(seed);
      // Leave a few bars before the clip so the chart shows some context.
      for (let from = 6; from + want.length <= VISIBLE_BARS && !found; from += 1) found = makeClip(want, seed, from, a);
    }
    if (!found) throw new Error(`No ${want.kind} clip found`);
    clips.push(found);
  }
  return clips;
}

/** Notes of one clip, with offsets from the clip start. */
export function clipNotes(clip: QuizClip, barSeconds: number): { layer: QuizLayer; note: SonicEvent }[] {
  const a = quizAnalysis(clip.seed);
  const out: { layer: QuizLayer; note: SonicEvent }[] = [];
  for (let k = 0; k < clip.length; k += 1) {
    for (const layer of clip.layers) {
      for (const note of sonarBandsEvents(layer, clip.from + k, a, { motion: clip.motion })) {
        if (note.amp > 0) out.push({ layer, note: { ...note, offsetSec: k * barSeconds + note.offsetSec } });
      }
    }
  }
  return out;
}

/** Chart of the clip with a few bars of context before it. */
export const CONTEXT_BARS = 6;

export function clipChart(clip: QuizClip): ChartModel {
  const full = sonarBandsChart(quizAnalysis(clip.seed));
  const start = clip.from - CONTEXT_BARS;
  const end = clip.from + clip.length;
  return {
    bars: full.bars.slice(start, end),
    lines: full.lines.map((l) => ({ ...l, values: l.values.slice(start, end) })),
    markers: full.markers.filter((m) => m.index >= start && m.index < end).map((m) => ({ ...m, index: m.index - start })),
    zones: [{ from: CONTEXT_BARS, to: CONTEXT_BARS + clip.length - 1, color: "rgb(167 139 250 / 0.12)" }],
    description: `${full.description} The shaded part is the clip you heard.`,
  };
}
