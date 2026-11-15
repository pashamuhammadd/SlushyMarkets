import { describe, expect, it } from "vitest";
import { buildCandles } from "@/lib/simulations/ohlc";
import { buildMarket } from "../market";
import { activityLevel, analyzePriceVolume, priceVolumeChart, priceVolumeEvents, priceVolumeMode, priceVolumeReadout, PV_SOUND, tradesForBar } from "./price-volume";

describe("Price and volume conversation", () => {
  const series = buildMarket(31, "15m");
  const a = analyzePriceVolume(series);

  it("builds each candle back exactly from its own simulated trades", () => {
    for (const bar of series.slice(-60)) {
      const trades = tradesForBar(bar, 1, 99, 0);
      const [candle] = buildCandles(trades, { candleMs: 15 * 60 * 1000, originMs: 0 });
      expect([candle.open, candle.high, candle.low, candle.close]).toEqual([bar.open, bar.high, bar.low, bar.close]);
      expect(candle.tradeCount).toBe(trades.length);
    }
  });

  it("needs more trades for bigger candles, so activity follows price action", () => {
    const small = tradesForBar({ open: 10, high: 10.2, low: 9.9, close: 10.1 }, 1, 5, 0);
    const big = tradesForBar({ open: 10, high: 13, low: 9.5, close: 12.8 }, 1, 5, 0);
    expect(big.length).toBeGreaterThan(small.length);
    const ranges = a.bars.map((b) => b.high - b.low);
    const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
    const mr = mean(ranges), mt = mean(a.trades);
    const cov = mean(ranges.map((r, i) => (r - mr) * (a.trades[i] - mt)));
    expect(cov).toBeGreaterThan(0);
  });

  it("ranks activity from 1 to 5 against the last 20 bars", () => {
    expect(activityLevel([1, 2, 3, 4, 5], 4)).toBe(5);
    expect(activityLevel([5, 4, 3, 2, 1], 4)).toBe(1);
    expect(a.level.every((l) => l >= 1 && l <= 5)).toBe(true);
    expect(new Set(a.level).size).toBeGreaterThanOrEqual(4);
  });

  it("plays the measured sounds", () => {
    a.bars.forEach((bar, i) => {
      const [price] = priceVolumeEvents("price", i, a);
      expect(price.hz).toBe(bar.close >= bar.open ? 440 : 330);
      const hits = priceVolumeEvents("activity", i, a);
      expect(hits).toHaveLength(a.level[i]);
      expect(hits.map((h) => h.offsetSec)).toEqual(hits.map((_, k) => PV_SOUND.drumStartSec + k * PV_SOUND.drumSpacingSec));
    });
  });

  it("is deterministic and has complete presets, chart and readout", () => {
    expect(analyzePriceVolume(series)).toEqual(a);
    const ids = priceVolumeMode.layers.map((l) => l.id).sort();
    for (const p of priceVolumeMode.presets) expect(Object.keys(p.layers).sort()).toEqual(ids);
    expect(priceVolumeReadout(3, a).map((r) => r.id).sort()).toEqual(ids);
    expect(priceVolumeChart(a).volume?.buyer).toEqual(a.level);
  });
});
