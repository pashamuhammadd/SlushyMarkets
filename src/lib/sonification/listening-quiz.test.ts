import { describe, expect, it } from "vitest";
import { breakoutAnswer, buildQuiz, clipChart, clipNotes, closerAnswer, CONTEXT_BARS, motionAnswer, QUIZ_SIZE, quizAnalysis } from "./listening-quiz";

describe("Sonar Bands listening quiz", () => {
  const quiz = buildQuiz();

  it("builds a full set with two clips of each kind, the same every time", () => {
    expect(quiz).toHaveLength(QUIZ_SIZE);
    expect(quiz.map((c) => c.kind)).toEqual(["closer", "breakout", "motion", "closer", "breakout", "motion"]);
    expect(buildQuiz().map((c) => c.id)).toEqual(quiz.map((c) => c.id));
    expect(new Set(quiz.map((c) => c.answer)).size).toBeGreaterThanOrEqual(5);
  });

  it("gives every clip an answer that matches its own audio analysis", () => {
    for (const c of quiz) {
      const a = quizAnalysis(c.seed);
      if (c.kind === "closer") expect(closerAnswer(a, c.from, c.length)).toBe(c.answer);
      if (c.kind === "breakout") expect(breakoutAnswer(a, c.from, c.length)).toBe(c.answer);
      if (c.kind === "motion") expect(motionAnswer(a, c.from, c.length)?.answer).toBe(c.answer);
      expect(c.choices.map((x) => x.value)).toContain(c.answer);
    }
  });

  it("makes the clue audible in each clip", () => {
    const [closer, breakout, motion] = quiz;
    const closerHz = new Set(clipNotes(closer, 0.5).map((n) => n.note.hz));
    expect(closerHz).toEqual(new Set([closer.answer === "lower" ? 165 : 330]));
    expect(clipNotes(breakout, 0.5).some((n) => n.layer === "breakout")).toBe(true);
    const pairs = clipNotes(motion, 0.5);
    expect(pairs).toHaveLength(motion.length * 2);
    expect(pairs[1].note.hz).toBeGreaterThan(pairs[0].note.hz);
    const stayed = quiz[4];
    expect(stayed.answer).toBe("none");
    expect(clipNotes(stayed, 0.5).some((n) => n.layer === "breakout")).toBe(false);
  });

  it("offers fresh sets and a chart of the clip with context", () => {
    expect(buildQuiz(1).map((c) => c.id)).not.toEqual(quiz.map((c) => c.id));
    const chart = clipChart(quiz[1]);
    expect(chart.bars).toHaveLength(CONTEXT_BARS + quiz[1].length);
    expect(chart.markers.some((m) => m.kind === "up")).toBe(true);
  });
});

describe("simulated prices", () => {
  it("never go below the minimum price, for any seed or timeframe", async () => {
    const { buildMarket, MIN_PRICE } = await import("./market");
    for (let seed = 7_100_000; seed < 7_100_060; seed += 1) {
      for (const tf of ["15m", "1h", "4h"] as const) expect(Math.min(...buildMarket(seed, tf).map((b) => b.low))).toBeGreaterThanOrEqual(MIN_PRICE - 1e-9);
    }
  });
});
