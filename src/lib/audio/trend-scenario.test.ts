import { describe, expect, it } from "vitest";
import {
  buildSeries,
  EXERCISE_CLIPS,
  midiToHz,
  noteAt,
  notesAt,
  SCENARIO,
  STEP_COUNT,
  TIMEFRAMES,
  type TimeframeId,
} from "./trend-scenario";

describe("trend scenario", () => {
  it("is deterministic", () => {
    expect(buildSeries(TIMEFRAMES[2]).values).toEqual(buildSeries(TIMEFRAMES[2]).values);
  });

  it("has a state and a normalized value for every step", () => {
    for (const series of SCENARIO) {
      expect(series.values).toHaveLength(STEP_COUNT);
      expect(series.states).toHaveLength(STEP_COUNT);
      expect(Math.min(...series.values)).toBe(0);
      expect(Math.max(...series.values)).toBe(1);
    }
  });

  it("tells the intended story: bullish daily, bullish then sideways 4H, mixed 15m", () => {
    const [daily, h4, m15] = SCENARIO;
    expect(new Set(daily.states)).toEqual(new Set(["bullish"]));
    expect(h4.states[0]).toBe("bullish");
    expect(h4.states[STEP_COUNT - 1]).toBe("sideways");
    expect(m15.states[STEP_COUNT - 1]).toBe("bearish");
    expect(daily.values[STEP_COUNT - 1]).toBeGreaterThan(daily.values[0]);
  });
});

describe("note mapping", () => {
  it("keeps every timeframe inside its own register, low to high", () => {
    const ranges = SCENARIO.map((series) => {
      const midis = series.values.map((_, step) => noteAt(series, step)?.midi).filter((m): m is number => m !== undefined);
      return { min: Math.min(...midis), max: Math.max(...midis) };
    });
    expect(ranges[0].max).toBeLessThan(ranges[1].min);
    expect(ranges[1].max).toBeLessThan(ranges[2].min);
  });

  it("plays slower timeframes less often", () => {
    const count = (id: TimeframeId) =>
      Array.from({ length: STEP_COUNT }, (_, s) => notesAt(s, new Set([id])).length).reduce((a, b) => a + b, 0);
    expect(count("daily")).toBe(STEP_COUNT / 4);
    expect(count("4h")).toBe(STEP_COUNT / 2);
    expect(count("15m")).toBe(STEP_COUNT);
  });

  it("returns no notes for muted timeframes or out of range steps", () => {
    expect(notesAt(0, new Set())).toEqual([]);
    expect(noteAt(SCENARIO[0], -1)).toBeNull();
    expect(noteAt(SCENARIO[0], STEP_COUNT)).toBeNull();
  });

  it("converts MIDI to frequency", () => {
    expect(midiToHz(69)).toBe(440);
    expect(midiToHz(81)).toBeCloseTo(880);
  });

  it("exercise clips move in the direction of their answer", () => {
    for (const clip of EXERCISE_CLIPS) {
      const delta = clip.midis[clip.midis.length - 1] - clip.midis[0];
      if (clip.answer === "bullish") expect(delta).toBeGreaterThan(0);
      if (clip.answer === "bearish") expect(delta).toBeLessThan(0);
      if (clip.answer === "sideways") expect(Math.abs(delta)).toBeLessThanOrEqual(2);
    }
  });
});
