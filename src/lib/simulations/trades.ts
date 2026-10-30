import type { Trade } from "./types";

/** Quantities are summed as integer units of 0.0001 BTC so totals never show float artifacts. */
export const QUANTITY_UNITS_PER_BTC = 10_000;

export function toQuantityUnits(quantityBtc: number): number {
  return Math.round(quantityBtc * QUANTITY_UNITS_PER_BTC);
}

export function fromQuantityUnits(units: number): number {
  return units / QUANTITY_UNITS_PER_BTC;
}

/**
 * Deterministic ordering used everywhere: by timestamp, then by id.
 * Trades that share a timestamp therefore always resolve in the same order.
 */
export function compareTrades(a: Trade, b: Trade): number {
  if (a.timestampMs !== b.timestampMs) return a.timestampMs - b.timestampMs;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function sortTrades(trades: readonly Trade[]): Trade[] {
  return [...trades].sort(compareTrades);
}

/** Small seeded PRNG (mulberry32). Same seed, same sequence, on every machine. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
