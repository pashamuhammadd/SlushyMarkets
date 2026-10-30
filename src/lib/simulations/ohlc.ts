import { fromQuantityUnits, sortTrades, toQuantityUnits } from "./trades";
import type { Candle, Trade } from "./types";

export type CandleOptions = {
  /** Candle duration in milliseconds, for example 60_000 for one minute candles. */
  candleMs: number;
  /** Start of bucket 0. Trades before the origin are ignored. */
  originMs: number;
};

/**
 * Builds OHLC candles from executed trades.
 *
 * Open is the first trade of the bucket, close is the last, high and low are the extremes.
 * Order inside a bucket follows `compareTrades` (timestamp, then id).
 * Buckets without trades produce no candle; callers place candles by `index`
 * so an empty interval stays visible as a gap instead of an invented flat candle.
 */
export function buildCandles(trades: readonly Trade[], { candleMs, originMs }: CandleOptions): Candle[] {
  if (candleMs <= 0) throw new Error("candleMs must be positive");

  const candles = new Map<number, Candle & { volumeUnits: number }>();

  for (const trade of sortTrades(trades)) {
    if (trade.timestampMs < originMs) continue;
    const index = Math.floor((trade.timestampMs - originMs) / candleMs);
    const existing = candles.get(index);
    const units = toQuantityUnits(trade.quantityBtc);

    if (!existing) {
      const startMs = originMs + index * candleMs;
      candles.set(index, {
        index,
        startMs,
        endMs: startMs + candleMs,
        open: trade.priceUsd,
        high: trade.priceUsd,
        low: trade.priceUsd,
        close: trade.priceUsd,
        volumeBtc: 0,
        volumeUnits: units,
        tradeCount: 1,
      });
      continue;
    }

    existing.high = Math.max(existing.high, trade.priceUsd);
    existing.low = Math.min(existing.low, trade.priceUsd);
    existing.close = trade.priceUsd;
    existing.volumeUnits += units;
    existing.tradeCount += 1;
  }

  return [...candles.values()]
    .sort((a, b) => a.index - b.index)
    .map(({ volumeUnits, ...candle }) => ({ ...candle, volumeBtc: fromQuantityUnits(volumeUnits) }));
}
