import { describe, expect, it } from "vitest";
import { RENKO_BOX_SIZES, RENKO_DEMO_CANDLES, RENKO_DEMO_CLOSES, RENKO_DEMO_PRICE_RANGE, RENKO_PHASES } from "@/data/renko-demo";
import { buildRenko, renkoReversals } from "./renko";
import { paddedPriceRange, syntheticCandles } from "./synthetic-candles";

const shape = (closes: number[], box: number) =>
  buildRenko(closes, box).bricks.map((b) => `${b.direction === "up" ? "U" : "D"}${b.open}-${b.close}@${b.sourceIndex}`);

describe("buildRenko", () => {
  it("anchors the grid at the first close rounded down to the box size", () => {
    const r = buildRenko([63_042], 100);
    expect(r.anchor).toBe(63_000);
    expect(r.bricks).toEqual([]);
    expect([r.nextUp, r.nextDown]).toEqual([63_100, 62_900]);
  });

  it("draws nothing for moves smaller than one box", () => {
    expect(buildRenko([1_000, 1_060, 1_020, 1_090, 1_005], 100).bricks).toHaveLength(0);
  });

  it("adds one brick per full box, and several from one close (hand checked)", () => {
    // Anchor 1,000. 1,100 completes one brick; 1,350 completes two more (1,200 and 1,300).
    expect(shape([1_000, 1_100, 1_350], 100)).toEqual(["U1000-1100@1", "U1100-1200@2", "U1200-1300@2"]);
  });

  it("needs two boxes to reverse, and starts the reversal at the far side of the last brick", () => {
    // After up bricks to 1,300 the last brick is 1,200 to 1,300.
    // 1,150 is only 1.5 boxes lower: nothing. 1,100 is two boxes lower: one down brick 1,200 to 1,100.
    const closes = [1_000, 1_300, 1_150];
    expect(buildRenko(closes, 100).bricks).toHaveLength(3);
    expect(buildRenko(closes, 100).nextDown).toBe(1_100);
    expect(shape([...closes, 1_100], 100).at(-1)).toBe("D1200-1100@3");
  });

  it("reverses back up only two boxes above the last down brick", () => {
    // Down bricks 1,000 to 900 to 800. Up reversal needs 1,000 (the top of the last brick plus a box).
    const r = buildRenko([1_000, 800, 950], 100);
    expect(r.bricks.map((b) => b.direction)).toEqual(["down", "down"]);
    expect(r.nextUp).toBe(1_000);
    expect(shape([1_000, 800, 1_000], 100).at(-1)).toBe("U900-1000@2");
  });

  it("keeps every brick exactly one box tall and touching the previous one", () => {
    for (const box of RENKO_BOX_SIZES) {
      const { bricks } = buildRenko(RENKO_DEMO_CLOSES, box);
      bricks.forEach((b, i) => {
        expect(Math.abs(b.close - b.open)).toBe(box);
        expect(b.direction === "up" ? b.close > b.open : b.close < b.open).toBe(true);
        if (i > 0) {
          const prev = bricks[i - 1];
          const prevTop = Math.max(prev.open, prev.close);
          const prevBottom = Math.min(prev.open, prev.close);
          expect(b.open === prevTop || b.open === prevBottom).toBe(true);
          expect(b.sourceIndex).toBeGreaterThanOrEqual(prev.sourceIndex);
        }
      });
    }
  });

  it("rejects a non positive box size", () => {
    expect(() => buildRenko([1, 2], 0)).toThrow();
  });

  it("counts reversals", () => {
    expect(renkoReversals(buildRenko([1_000, 1_200, 1_000, 1_200], 100).bricks)).toBe(2);
  });
});

describe("syntheticCandles", () => {
  it("is deterministic and well formed", () => {
    const opts = { seed: 7, originMs: 0, candleMs: 1_000, closeNoise: 10 };
    const a = syntheticCandles([1_000, 1_010, 1_005], opts);
    expect(syntheticCandles([1_000, 1_010, 1_005], opts)).toEqual(a);
    for (const c of a) {
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
    }
    const range = paddedPriceRange(a, 50, 0);
    expect(range.minPriceUsd % 50).toBe(0);
    expect(range.maxPriceUsd % 50).toBe(0);
  });
});

describe("Renko demo story", () => {
  const count = (box: number, end: number) => buildRenko(RENKO_DEMO_CLOSES.slice(0, end), box).bricks.length;
  const { climb, quiet, spike, slide, finish } = RENKO_PHASES;

  it("fits the chart window and has one candle per phase slot", () => {
    expect(RENKO_DEMO_CANDLES).toHaveLength(finish.end);
    for (const c of RENKO_DEMO_CANDLES) {
      expect(c.low).toBeGreaterThanOrEqual(RENKO_DEMO_PRICE_RANGE.minPriceUsd);
      expect(c.high).toBeLessThanOrEqual(RENKO_DEMO_PRICE_RANGE.maxPriceUsd);
    }
  });

  it("with $100 boxes: the climb builds bricks, the quiet range adds none", () => {
    expect(count(100, climb.end)).toBeGreaterThan(2);
    expect(count(100, quiet.end)).toBe(count(100, climb.end));
    expect(count(200, quiet.end)).toBe(count(200, climb.end));
  });

  it("the spike completes several bricks from a single candle", () => {
    for (const box of [50, 100] as const) {
      const { bricks } = buildRenko(RENKO_DEMO_CLOSES, box);
      const perCandle = [spike.start, spike.start + 1].map((i) => bricks.filter((b) => b.sourceIndex === i).length);
      expect(Math.max(...perCandle)).toBeGreaterThan(1);
    }
  });

  it("the first down brick appears only after a two box drop from the top", () => {
    for (const box of RENKO_BOX_SIZES) {
      const { bricks } = buildRenko(RENKO_DEMO_CLOSES, box);
      const firstDown = bricks.findIndex((b) => b.direction === "down");
      expect(firstDown).toBeGreaterThan(0);
      const lastUp = bricks[firstDown - 1];
      const source = RENKO_DEMO_CLOSES[bricks[firstDown].sourceIndex];
      expect(source).toBeLessThanOrEqual(lastUp.close - 2 * box);
      expect(bricks[firstDown].sourceIndex).toBeGreaterThanOrEqual(slide.start);
      // No earlier close in the slide reached two boxes below the top.
      for (let i = lastUp.sourceIndex + 1; i < bricks[firstDown].sourceIndex; i += 1) {
        expect(RENKO_DEMO_CLOSES[i]).toBeGreaterThan(lastUp.close - 2 * box);
      }
    }
  });

  it("in the choppy finish, small boxes flip a lot and larger boxes stay still", () => {
    const flips = (box: number) => {
      const before = buildRenko(RENKO_DEMO_CLOSES.slice(0, slide.end), box).bricks.length;
      return renkoReversals(buildRenko(RENKO_DEMO_CLOSES, box).bricks.slice(Math.max(before - 1, 0)));
    };
    expect(flips(50)).toBeGreaterThan(5);
    expect(count(100, finish.end)).toBe(count(100, slide.end));
    expect(count(200, finish.end)).toBe(count(200, slide.end));
  });
});
