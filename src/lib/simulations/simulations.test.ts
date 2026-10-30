import { describe, expect, it } from "vitest";
import { DEMO_BAND_USD, DEMO_CANDLE_MS, DEMO_ORIGIN_MS, DEMO_PRICE_RANGE, DEMO_TRADES } from "@/data/demo-trades";
import { buildCandles } from "./ohlc";
import { compareTrades, createRng } from "./trades";
import type { Trade } from "./types";
import { bandIndexFor, buildVolumeProfile } from "./volume-profile";

const t = (id: string, timestampMs: number, priceUsd: number, quantityBtc: number): Trade => ({
  id,
  timestampMs,
  priceUsd,
  quantityBtc,
});

describe("createRng", () => {
  it("is deterministic for a seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("compareTrades", () => {
  it("breaks timestamp ties by id", () => {
    const sorted = [t("b", 5, 1, 1), t("a", 5, 2, 1), t("c", 1, 3, 1)].sort(compareTrades);
    expect(sorted.map((x) => x.id)).toEqual(["c", "a", "b"]);
  });
});

describe("buildCandles", () => {
  const trades = [
    t("1", 0, 100, 0.1),
    t("2", 10_000, 105, 0.2),
    t("3", 20_000, 98, 0.3),
    t("4", 59_999, 101, 0.4),
    t("5", 60_000, 110, 1),
    // a gap: nothing in bucket 2
    t("6", 180_000, 90, 0.5),
  ];

  it("derives OHLC from first, max, min and last trade", () => {
    const [first] = buildCandles(trades, { candleMs: 60_000, originMs: 0 });
    expect(first).toMatchObject({ index: 0, open: 100, high: 105, low: 98, close: 101, tradeCount: 4 });
  });

  it("sums volume without float artifacts", () => {
    const [first] = buildCandles(trades, { candleMs: 60_000, originMs: 0 });
    expect(first.volumeBtc).toBe(1);
  });

  it("keeps empty intervals as gaps instead of inventing candles", () => {
    const candles = buildCandles(trades, { candleMs: 60_000, originMs: 0 });
    expect(candles.map((c) => c.index)).toEqual([0, 1, 3]);
  });

  it("is independent of input order", () => {
    const shuffled = [...trades].reverse();
    expect(buildCandles(shuffled, { candleMs: 60_000, originMs: 0 })).toEqual(
      buildCandles(trades, { candleMs: 60_000, originMs: 0 }),
    );
  });

  it("returns nothing for no trades", () => {
    expect(buildCandles([], { candleMs: 60_000, originMs: 0 })).toEqual([]);
  });
});

describe("buildVolumeProfile", () => {
  it("assigns a price on a band edge to the upper band", () => {
    expect(bandIndexFor(125, 25)).toBe(5);
    expect(bandIndexFor(124.99, 25)).toBe(4);
  });

  it("sums executed quantity per band and finds the point of control", () => {
    const profile = buildVolumeProfile([t("1", 0, 101, 0.1), t("2", 1, 110, 0.2), t("3", 2, 130, 0.25)], {
      bandUsd: 25,
      minPriceUsd: 100,
      maxPriceUsd: 149,
    });
    expect(profile.bands.map((b) => b.volumeBtc)).toEqual([0.3, 0.25]);
    expect(profile.totalVolumeBtc).toBe(0.55);
    expect(profile.pocBandIndex).toBe(0);
  });

  it("keeps empty bands and has no point of control before trades", () => {
    const profile = buildVolumeProfile([], { bandUsd: 10, minPriceUsd: 0, maxPriceUsd: 29 });
    expect(profile.bands).toHaveLength(3);
    expect(profile.pocBandIndex).toBeNull();
  });
});

describe("demo fixture", () => {
  it("is stable and well formed", () => {
    expect(DEMO_TRADES.length).toBe(168);
    const ids = new Set(DEMO_TRADES.map((x) => x.id));
    expect(ids.size).toBe(DEMO_TRADES.length);
    for (const trade of DEMO_TRADES) {
      expect(trade.quantityBtc).toBeGreaterThan(0);
      expect(Number.isInteger(trade.priceUsd)).toBe(true);
    }
  });

  it("produces one candle per minute and a profile whose total matches candle volume", () => {
    const candles = buildCandles(DEMO_TRADES, { candleMs: DEMO_CANDLE_MS, originMs: DEMO_ORIGIN_MS });
    const profile = buildVolumeProfile(DEMO_TRADES, { bandUsd: DEMO_BAND_USD, ...DEMO_PRICE_RANGE });
    expect(candles).toHaveLength(12);
    const candleTotal = candles.reduce((sum, c) => sum + Math.round(c.volumeBtc * 10_000), 0) / 10_000;
    expect(profile.totalVolumeBtc).toBe(candleTotal);
  });

  it("stays consistent for every playback prefix", () => {
    for (let n = 0; n <= DEMO_TRADES.length; n += 7) {
      const prefix = DEMO_TRADES.slice(0, n);
      const candles = buildCandles(prefix, { candleMs: DEMO_CANDLE_MS, originMs: DEMO_ORIGIN_MS });
      const profile = buildVolumeProfile(prefix, { bandUsd: DEMO_BAND_USD, ...DEMO_PRICE_RANGE });
      expect(candles.reduce((s, c) => s + c.tradeCount, 0)).toBe(n);
      expect(profile.bands.reduce((s, b) => s + b.tradeCount, 0)).toBe(n);
    }
  });
});
