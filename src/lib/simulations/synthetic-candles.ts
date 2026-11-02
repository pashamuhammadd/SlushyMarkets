import { createRng } from "./trades";
import type { Candle } from "./types";

export type SyntheticCandleOptions = {
  seed: number;
  originMs: number;
  candleMs: number;
  /** Total width of the seeded noise added to each target close, in dollars. */
  closeNoise: number;
  /** Where the first candle opens, relative to the first target. */
  firstOpenOffset?: number;
};

/**
 * Builds deterministic, invented OHLC candles that follow a list of target closes.
 * Each candle opens at the previous close; high and low add a seeded wick.
 * Same seed and targets give the same candles on every build and browser.
 * For teaching only: this is never market data.
 */
export function syntheticCandles(targets: readonly number[], options: SyntheticCandleOptions): Candle[] {
  const { seed, originMs, candleMs, closeNoise, firstOpenOffset = -40 } = options;
  const rng = createRng(seed);
  const candles: Candle[] = [];
  let previousClose = targets[0] + firstOpenOffset;
  targets.forEach((target, index) => {
    const open = previousClose;
    const close = Math.round(target + (rng() - 0.5) * closeNoise);
    const high = Math.round(Math.max(open, close) + 15 + rng() * 55);
    const low = Math.round(Math.min(open, close) - 15 - rng() * 55);
    const startMs = originMs + index * candleMs;
    candles.push({ index, startMs, endMs: startMs + candleMs, open, high, low, close, volumeBtc: 0, tradeCount: 0 });
    previousClose = close;
  });
  return candles;
}

/** Fixed chart window around the candles, padded and rounded to `step` so axes never jump. */
export function paddedPriceRange(candles: readonly Candle[], step = 250, pad = 50) {
  return {
    minPriceUsd: Math.floor((Math.min(...candles.map((c) => c.low)) - pad) / step) * step,
    maxPriceUsd: Math.ceil((Math.max(...candles.map((c) => c.high)) + pad) / step) * step,
  };
}
