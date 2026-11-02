import { describe, expect, it } from "vitest";
import {
  MA_DEMO_CANDLES,
  MA_DEMO_CLOSES,
  MA_DEMO_PEAK_INDEX,
  MA_DEMO_PRICE_RANGE,
  MA_DEMO_RANGE_START,
  MA_PERIODS,
} from "@/data/ma-demo";
import { directionChanges, ema, emaAlpha, emaWeights, firstTurnDown, sma, smaWeights } from "./moving-averages";

const dot = (weights: number[], values: readonly number[]) => weights.reduce((sum, w, i) => sum + w * values[i], 0);

describe("sma", () => {
  it("averages the last period values and is null before that", () => {
    expect(sma([10, 12, 14, 16], 3)).toEqual([null, null, 12, 14]);
  });

  it("with period 1 returns the values themselves", () => {
    expect(sma([5, 7, 9], 1)).toEqual([5, 7, 9]);
  });

  it("rejects invalid periods", () => {
    expect(() => sma([1, 2], 0)).toThrow();
    expect(() => sma([1, 2], 2.5)).toThrow();
  });
});

describe("ema", () => {
  it("uses alpha = 2 / (period + 1)", () => {
    expect(emaAlpha(3)).toBe(0.5);
    expect(emaAlpha(10)).toBeCloseTo(2 / 11, 12);
  });

  it("starts from the SMA seed, then applies the recursion (hand checked)", () => {
    // period 3, alpha 0.5. Seed = (10 + 12 + 14) / 3 = 12.
    // Next: 0.5 * 20 + 0.5 * 12 = 16. Then 0.5 * 10 + 0.5 * 16 = 13.
    expect(ema([10, 12, 14, 20, 10], 3)).toEqual([null, null, 12, 16, 13]);
  });

  it("reacts more than the SMA to a sudden jump", () => {
    const values = [100, 100, 100, 100, 100, 130];
    const last = values.length - 1;
    expect((ema(values, 5)[last] as number) - 100).toBeGreaterThan((sma(values, 5)[last] as number) - 100);
  });
});

describe("weights", () => {
  it("SMA weights are equal over the period and zero before it", () => {
    expect(smaWeights(6, 4)).toEqual([0, 0, 0.25, 0.25, 0.25, 0.25]);
  });

  it("EMA weights give the newest value alpha and shrink going back", () => {
    const w = emaWeights(12, 5);
    const alpha = emaAlpha(5);
    expect(w[11]).toBeCloseTo(alpha, 12);
    expect(w[10]).toBeCloseTo(alpha * (1 - alpha), 12);
    expect(w[11]).toBeGreaterThan(w[10]);
  });

  it("both weight sets sum to 1 and reproduce the averages exactly", () => {
    const values = [...MA_DEMO_CLOSES];
    for (const period of MA_PERIODS) {
      const smaSeries = sma(values, period);
      const emaSeries = ema(values, period);
      for (const count of [period, period + 1, values.length]) {
        const ws = smaWeights(count, period);
        const we = emaWeights(count, period);
        expect(ws.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
        expect(we.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
        expect(dot(ws, values)).toBeCloseTo(smaSeries[count - 1] as number, 6);
        expect(dot(we, values)).toBeCloseTo(emaSeries[count - 1] as number, 6);
      }
    }
  });

  it("are all zero before there is a full period", () => {
    expect(emaWeights(3, 5).every((w) => w === 0)).toBe(true);
    expect(smaWeights(3, 5).every((w) => w === 0)).toBe(true);
  });
});

describe("turns and direction changes", () => {
  it("finds the first fall after an index", () => {
    expect(firstTurnDown([1, 2, 3, 2, 1], 2)).toBe(3);
    expect(firstTurnDown([null, 1, 2, 3], 1)).toBeNull();
  });

  it("counts direction changes and skips flat steps", () => {
    expect(directionChanges([1, 2, 1, 2, 2, 3, 1], 0, 6)).toBe(3);
  });
});

describe("SMA vs EMA demo story", () => {
  it("is deterministic and well formed", () => {
    expect(MA_DEMO_CANDLES).toHaveLength(48);
    for (const c of MA_DEMO_CANDLES) {
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
      expect(c.low).toBeGreaterThanOrEqual(MA_DEMO_PRICE_RANGE.minPriceUsd);
      expect(c.high).toBeLessThanOrEqual(MA_DEMO_PRICE_RANGE.maxPriceUsd);
    }
    // Each candle opens at the previous close.
    for (let i = 1; i < MA_DEMO_CANDLES.length; i += 1) expect(MA_DEMO_CANDLES[i].open).toBe(MA_DEMO_CANDLES[i - 1].close);
  });

  it("peaks where the lesson says it does", () => {
    expect(MA_DEMO_CLOSES.indexOf(Math.max(...MA_DEMO_CLOSES))).toBe(MA_DEMO_PEAK_INDEX);
  });

  it("the EMA turns down before the SMA after the peak, for every period offered", () => {
    for (const period of MA_PERIODS) {
      const emaTurn = firstTurnDown(ema(MA_DEMO_CLOSES, period), MA_DEMO_PEAK_INDEX) as number;
      const smaTurn = firstTurnDown(sma(MA_DEMO_CLOSES, period), MA_DEMO_PEAK_INDEX) as number;
      expect(emaTurn).toBeLessThan(smaTurn);
    }
  });

  it("with the default period the EMA changes direction more often in the sideways range", () => {
    const end = MA_DEMO_CLOSES.length - 1;
    for (const period of [10, 20]) {
      const emaChanges = directionChanges(ema(MA_DEMO_CLOSES, period), MA_DEMO_RANGE_START, end);
      const smaChanges = directionChanges(sma(MA_DEMO_CLOSES, period), MA_DEMO_RANGE_START, end);
      expect(emaChanges).toBeGreaterThan(smaChanges);
    }
  });
});
