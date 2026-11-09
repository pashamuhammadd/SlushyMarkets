import { describe, expect, it } from "vitest";
import {
  LAST_MOVED_IS_NOT_PAID,
  MVRV_COMPLETION,
  MVRV_QUIZ,
  MVRV_START_PRICE,
  PRICE_SLIDER,
  SOPR_BUCKET_ROUNDS,
  SOPR_COMPLETION,
  SOPR_DEFAULTS,
  SOPR_QUIZ,
  SOPR_TIMELINE_SEED,
  SPEND_IS_NOT_A_SALE,
  TWO_COINS,
} from "@/data/lessons/on-chain-metrics";
import { SOPR_GAUGE, crossings, dexVolumeGrowth7d, marketValue, moveCoin, mvrv, realizedValue, sopr, soprGaugePosition, soprZone, syntheticSoprSeries, valueToHz, volumeGrowthPercent } from "./metrics";

describe("SOPR", () => {
  it("divides the value when spent by the value when created", () => {
    expect(sopr([{ createdUsd: SOPR_DEFAULTS.createdUsd, spentUsd: SOPR_DEFAULTS.spentUsd }])).toBeCloseTo(1.875, 10);
    expect(sopr([{ createdUsd: 40_000, spentUsd: 30_000 }])).toBe(0.75);
    expect(sopr([])).toBeNull();
    expect(sopr([{ createdUsd: 0, spentUsd: 10 }])).toBeNull();
  });

  it("adds outputs before dividing (aggregate SOPR, not an average of ratios)", () => {
    // Ratios 2.0 and 0.8 average 1.4, but the group SOPR is 800 / 700.
    expect(sopr(SOPR_BUCKET_ROUNDS[0].outputs)).toBeCloseTo(800 / 700, 10);
  });

  it("gives the bucket rounds one higher, one lower and one equal answer", () => {
    expect(SOPR_BUCKET_ROUNDS.map((r) => soprZone(sopr(r.outputs) ?? 1))).toEqual(["profit", "loss", "break-even"]);
  });

  it("treats values next to 1.0 as break even", () => {
    expect(soprZone(1.004)).toBe("break-even");
    expect(soprZone(1.01)).toBe("profit");
    expect(soprZone(0.99)).toBe("loss");
  });
});

describe("SOPR gauge", () => {
  it("covers exactly what the sliders can produce", () => {
    expect(SOPR_GAUGE.min).toBe(PRICE_SLIDER.min / PRICE_SLIDER.max);
    expect(SOPR_GAUGE.max).toBe(PRICE_SLIDER.max / PRICE_SLIDER.min);
  });

  it.each([
    [0, 0],
    [0.5, 0.25],
    [1, 0.5],
    [2, 0.75],
    [3, (Math.log2(3) + 2) / 4],
    [4, 1],
  ])("places %d at %d", (value, position) => {
    expect(soprGaugePosition(value)).toBeCloseTo(position, 10);
  });

  it("no longer stops at 2.0 and keeps odd input on the gauge", () => {
    expect(soprGaugePosition(3)).toBeGreaterThan(soprGaugePosition(2));
    expect(soprGaugePosition(0.25)).toBe(0);
    expect(soprGaugePosition(99)).toBe(1);
    expect(soprGaugePosition(-1)).toBe(0);
    expect(soprGaugePosition(Number.NaN)).toBe(0);
  });
});

describe("DEX Volume Growth (7-day)", () => {
  const week = (v: number) => Array<number>(7).fill(v);

  it("handles positive, negative and zero growth", () => {
    expect(volumeGrowthPercent(120, 100)).toEqual({ status: "ok", percent: expect.closeTo(20, 10) });
    expect(volumeGrowthPercent(75, 100)).toEqual({ status: "ok", percent: -25 });
    expect(volumeGrowthPercent(100, 100)).toEqual({ status: "ok", percent: 0 });
    expect(volumeGrowthPercent(0, 100)).toEqual({ status: "ok", percent: -100 });
  });

  it("does not produce Infinity or NaN on a zero base", () => {
    expect(volumeGrowthPercent(50, 0)).toEqual({ status: "zero-base" });
    expect(volumeGrowthPercent(0, 0)).toEqual({ status: "zero-base" });
  });

  it("rejects invalid input", () => {
    expect(volumeGrowthPercent(-1, 10)).toEqual({ status: "invalid" });
    expect(volumeGrowthPercent(Number.NaN, 10)).toEqual({ status: "invalid" });
    expect(dexVolumeGrowth7d(week(5))).toEqual({ status: "invalid" });
  });

  it("compares the latest 7 days with the 7 before and ignores older days", () => {
    const result = dexVolumeGrowth7d([999, ...week(10), ...week(15)]);
    expect(result).toEqual({ status: "ok", percent: expect.closeTo(50, 10) });
    expect(dexVolumeGrowth7d([...week(0), ...week(15)])).toEqual({ status: "zero-base" });
  });
});

describe("MVRV", () => {
  it("reproduces the two coin story", () => {
    expect(marketValue(TWO_COINS, MVRV_START_PRICE)).toBe(100_000);
    expect(realizedValue(TWO_COINS)).toBe(100_000);
    expect(mvrv(TWO_COINS, MVRV_START_PRICE)).toBe(1);
    expect(mvrv(TWO_COINS, 75_000)).toBe(1.5);
    const moved = moveCoin(TWO_COINS, "a", 75_000);
    expect(realizedValue(moved)).toBe(135_000);
    expect(mvrv(moved, 75_000)).toBeCloseTo(150_000 / 135_000, 10);
  });

  it("does not mutate the original coins", () => {
    moveCoin(TWO_COINS, "a", 99_000);
    expect(TWO_COINS[0].lastMovedPriceUsd).toBe(40_000);
  });

  it("returns null without realized value", () => {
    expect(mvrv([], 50_000)).toBeNull();
  });
});

describe("timeline", () => {
  it("is deterministic, stays in range and crosses 1.0 a few times", () => {
    const series = syntheticSoprSeries(SOPR_TIMELINE_SEED);
    expect(series).toEqual(syntheticSoprSeries(SOPR_TIMELINE_SEED));
    expect(series).toHaveLength(60);
    for (const v of series) {
      expect(v).toBeGreaterThanOrEqual(0.86);
      expect(v).toBeLessThanOrEqual(1.16);
    }
    const n = crossings(series).length;
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(8);
  });

  it("finds crossings and ignores touching the level", () => {
    expect(crossings([0.9, 1.1, 1.2, 0.95])).toEqual([
      { index: 1, direction: "up" },
      { index: 3, direction: "down" },
    ]);
    expect(crossings([1.1, 1, 1.05])).toEqual([]);
    expect(crossings([1.1, 1, 0.9])).toEqual([{ index: 2, direction: "down" }]);
  });
});

describe("pitch mapping", () => {
  it("spans two octaves and clamps", () => {
    expect(valueToHz(0, 0, 100)).toBe(220);
    expect(valueToHz(100, 0, 100)).toBe(880);
    expect(valueToHz(500, 0, 100)).toBe(880);
    expect(valueToHz(5, 5, 5)).toBeCloseTo(440, 10);
  });
});

describe("lesson copy corrections", () => {
  it("completion messages match the on-chain lesson", () => {
    for (const message of [SOPR_COMPLETION, MVRV_COMPLETION]) {
      expect(message).toMatch(/On-Chain Metrics/);
      expect(message).not.toMatch(/candle|volume/i);
    }
    expect(SOPR_COMPLETION).toMatch(/SOPR/);
    expect(MVRV_COMPLETION).toMatch(/MVRV/);
  });

  it("keeps Slushy's wording", () => {
    expect(SPEND_IS_NOT_A_SALE).toContain("does not necessarily mean someone sold");
    expect(LAST_MOVED_IS_NOT_PAID).toContain("not necessarily the price their owners actually paid");
  });
});

describe("quizzes", () => {
  it("have one valid correct option and no em or en dashes", () => {
    for (const q of [...SOPR_QUIZ, ...MVRV_QUIZ]) {
      expect(q.options.map((o) => o.id)).toContain(q.correct);
      expect(JSON.stringify(q)).not.toMatch(/[\u2013\u2014]/);
    }
  });
});
