import { VISIBLE_BARS, type Bar } from "../market";
import type { ChartMarker, ChartModel, LayerSettings, Preset, ReadoutItem, SonicEvent, SonificationMode } from "../types";
import type { VoiceId } from "../voices";

/**
 * Fractals: confirmation and rejection. Taken from the "Fractals · confirm / reject" mode of
 * Slushy's Sound Playground prototype (fractals.html, read on 14 November 2026). Provisional
 * until Slushy approves it.
 *
 * - candidate high: a bar whose high is above the highs of the two bars before it
 *   (candidate low: low below the lows of the two bars before it)
 * - on each later bar, a pending candidate is rejected as soon as a bar reaches its level
 *   (high >= candidate high, or low <= candidate low)
 * - if it survives the next two bars it is confirmed on the second one
 * - cues sound as bars close and describe the past. They do not predict reversals.
 *
 * Sounds (prototype values): candidate soft knock 400 Hz (high) or 250 Hz (low); confirmation a
 * rising chime pair 600 then 800 Hz for a high, a falling pair 440 then 330 Hz for a low;
 * rejection a low 110 Hz thud. Several cues of the same kind in one bar are 0.1 s apart.
 */

export const CONFIRM_BARS = 2;
export const LOOKBACK_BARS = 2;

export const FRACTAL_SOUND = {
  candidate: { highHz: 400, lowHz: 250, amp: 0.35, durationSec: 0.08 },
  confirm: { high: [600, 800], low: [440, 330], amp: 0.9, durationSec: [0.12, 0.14], gapSec: 0.12 },
  reject: { hz: 110, amp: 0.85, durationSec: 0.1 },
  spacingSec: 0.1,
} as const;

export const FRACTAL_COLORS = { candidate: "#B79BFF", high: "#FF6B8B", low: "#44D9A4", reject: "#FFD166" } as const;

export type SwingStage = "candidate" | "confirm" | "reject";
/** 1 = swing high, -1 = swing low. */
export type SwingDirection = 1 | -1;

export type SwingEvent = {
  stage: SwingStage;
  direction: SwingDirection;
  /** Index of the candidate bar, in the same index space as the bars passed in. */
  pivot: number;
  level: number;
};

type Pending = { direction: SwingDirection; level: number; index: number };

/**
 * Swing events per bar, in the order the prototype produces them: first the fate of earlier
 * candidates (reject or confirm), then any new candidate on this bar.
 */
export function annotateSwings(bars: readonly Bar[]): { events: SwingEvent[][]; pending: Pending[][] } {
  let pending: Pending[] = [];
  const events: SwingEvent[][] = [];
  const pendingAfter: Pending[][] = [];
  bars.forEach((b, i) => {
    const here: SwingEvent[] = [];
    pending = pending.filter((p) => {
      const invalid = p.direction === 1 ? b.high >= p.level : b.low <= p.level;
      if (invalid) {
        here.push({ stage: "reject", direction: p.direction, pivot: p.index, level: p.level });
        return false;
      }
      if (i === p.index + CONFIRM_BARS) {
        here.push({ stage: "confirm", direction: p.direction, pivot: p.index, level: p.level });
        return false;
      }
      return true;
    });
    if (i >= LOOKBACK_BARS) {
      for (const direction of [1, -1] as const) {
        const candidate =
          direction === 1
            ? b.high > bars[i - 1].high && b.high > bars[i - 2].high
            : b.low < bars[i - 1].low && b.low < bars[i - 2].low;
        if (candidate) {
          const level = direction === 1 ? b.high : b.low;
          pending.push({ direction, level, index: i });
          here.push({ stage: "candidate", direction, pivot: i, level });
        }
      }
    }
    events.push(here);
    pendingAfter.push([...pending]);
  });
  return { events, pending: pendingAfter };
}

export type FractalsAnalysis = {
  bars: Bar[];
  /** Events on each visible bar. `pivot` is a visible index and can be negative for a warm up candidate. */
  events: SwingEvent[][];
  /** Candidates still waiting at the close of each visible bar. */
  waiting: number[];
};

export function analyzeFractals(series: readonly Bar[]): FractalsAnalysis {
  const start = Math.max(0, series.length - VISIBLE_BARS);
  const { events, pending } = annotateSwings(series);
  return {
    bars: series.slice(start),
    events: events.slice(start).map((list) => list.map((e) => ({ ...e, pivot: e.pivot - start }))),
    waiting: pending.slice(start).map((p) => p.length),
  };
}

const LAYER_STAGE: Record<string, SwingStage> = { candidate: "candidate", confirm: "confirm", reject: "reject" };

export function fractalsEvents(layerId: string, index: number, a: FractalsAnalysis): SonicEvent[] {
  const stage = LAYER_STAGE[layerId];
  if (!stage) return [];
  const out: SonicEvent[] = [];
  a.events[index]
    .filter((e) => e.stage === stage)
    .forEach((e, j) => {
      const at = j * FRACTAL_SOUND.spacingSec;
      if (stage === "candidate") {
        const c = FRACTAL_SOUND.candidate;
        out.push({ offsetSec: at, hz: e.direction === 1 ? c.highHz : c.lowHz, amp: c.amp, durationSec: c.durationSec });
      } else if (stage === "confirm") {
        const c = FRACTAL_SOUND.confirm;
        const [first, second] = e.direction === 1 ? c.high : c.low;
        out.push({ offsetSec: at, hz: first, amp: c.amp, durationSec: c.durationSec[0] });
        out.push({ offsetSec: at + c.gapSec, hz: second, amp: c.amp, durationSec: c.durationSec[1] });
      } else {
        const r = FRACTAL_SOUND.reject;
        out.push({ offsetSec: at, hz: r.hz, amp: r.amp, durationSec: r.durationSec });
      }
    });
  return out;
}

export function fractalsChart(a: FractalsAnalysis): ChartModel {
  const markers: ChartMarker[] = [];
  a.events.forEach((list, i) => {
    for (const e of list) {
      if (e.stage === "candidate") markers.push({ index: i, price: e.level, kind: "candidate", direction: e.direction });
      // A confirmed swing is drawn on its candle, but only appears once the confirming bar is revealed.
      else if (e.stage === "confirm" && e.pivot >= 0)
        markers.push({ index: e.pivot, price: e.level, kind: e.direction === 1 ? "swing-high" : "swing-low", revealAt: i });
      else if (e.stage === "reject") markers.push({ index: i, price: e.level, kind: "reject" });
    }
  });
  return {
    bars: a.bars,
    lines: [],
    markers,
    description:
      "Simulated candles with swing markers: small violet dots for candidate highs and lows, pink triangles above confirmed swing highs, mint triangles below confirmed swing lows, and gold crosses where a candidate was rejected.",
  };
}

const stageWords = (e: SwingEvent) => (e.direction === 1 ? "high" : "low");

export function fractalsReadout(index: number, a: FractalsAnalysis): ReadoutItem[] {
  const list = a.events[index];
  const of = (stage: SwingStage) => list.filter((e) => e.stage === stage);
  const candidates = of("candidate");
  const confirms = of("confirm");
  const rejects = of("reject");
  const level = (e: SwingEvent) => e.level.toFixed(2);
  return [
    {
      id: "candidate",
      label: "Candidates",
      color: FRACTAL_COLORS.candidate,
      loudness: candidates.length ? FRACTAL_SOUND.candidate.amp : 0,
      text: candidates.length
        ? `New candidate ${candidates.map((e) => `${stageWords(e)} at ${level(e)}`).join(" and ")}. It needs ${CONFIRM_BARS} more bars.`
        : `No new candidate. ${a.waiting[index]} waiting.`,
    },
    {
      id: "confirm",
      label: "Confirmations",
      color: FRACTAL_COLORS.low,
      loudness: confirms.length ? FRACTAL_SOUND.confirm.amp : 0,
      text: confirms.length
        ? `Swing ${confirms.map((e) => `${stageWords(e)} at ${level(e)}`).join(" and ")} confirmed after ${CONFIRM_BARS} bars.`
        : "Nothing confirmed on this bar.",
    },
    {
      id: "reject",
      label: "Rejections",
      color: FRACTAL_COLORS.reject,
      loudness: rejects.length ? FRACTAL_SOUND.reject.amp : 0,
      text: rejects.length
        ? `Candidate ${rejects.map((e) => `${stageWords(e)} at ${level(e)}`).join(" and ")} rejected: price reached it again.`
        : "Nothing rejected on this bar.",
    },
  ];
}

function settings(voice: VoiceId, extra: Partial<LayerSettings> = {}): LayerSettings {
  return { voice, rate: 2, gain: 0.7, mute: false, solo: false, ...extra };
}

const quiet = { mute: true };

export const FRACTALS_PRESETS: readonly Preset[] = [
  {
    id: "slushy",
    label: "Slushy's fractals",
    description: "The prototype mix: a soft knock for each candidate, a chime pair when it is confirmed and a low thud when it is rejected.",
    layers: { candidate: settings("tuned-wood"), confirm: settings("chime"), reject: settings("drum") },
  },
  {
    id: "outcomes",
    label: "Outcomes only",
    description: "No candidate knocks. Only hear how each candidate ends: confirmed or rejected.",
    layers: { candidate: settings("tuned-wood", quiet), confirm: settings("chime"), reject: settings("drum") },
  },
  {
    id: "confirmations",
    label: "Confirmations only",
    description: "Only the chime pairs. Rising means a swing high was confirmed, falling means a swing low.",
    layers: { candidate: settings("tuned-wood", quiet), confirm: settings("chime"), reject: settings("drum", quiet) },
  },
];

export const fractalsMode: SonificationMode<FractalsAnalysis> = {
  id: "fractals",
  title: "Fractals: confirm or reject",
  layers: [
    {
      id: "candidate",
      label: "Candidate",
      color: FRACTAL_COLORS.candidate,
      describes: "A soft knock when a bar makes a higher high or lower low than the two bars before it.",
      detail: `${FRACTAL_SOUND.candidate.highHz} Hz for a high, ${FRACTAL_SOUND.candidate.lowHz} Hz for a low`,
      previewHz: FRACTAL_SOUND.candidate.highHz,
      kind: "event",
    },
    {
      id: "confirm",
      label: "Confirmation",
      color: FRACTAL_COLORS.low,
      describes: "A chime pair when a candidate survives two more bars: rising for a high, falling for a low.",
      detail: "600 then 800 Hz, or 440 then 330 Hz",
      previewHz: 600,
      kind: "event",
    },
    {
      id: "reject",
      label: "Rejection",
      color: FRACTAL_COLORS.reject,
      describes: "A low thud when a later bar reaches the candidate level before it is confirmed.",
      detail: `${FRACTAL_SOUND.reject.hz} Hz`,
      previewHz: FRACTAL_SOUND.reject.hz,
      kind: "event",
    },
  ],
  presets: FRACTALS_PRESETS,
  toggles: [],
  analyze: analyzeFractals,
  events: fractalsEvents,
  chart: fractalsChart,
  readout: fractalsReadout,
};
