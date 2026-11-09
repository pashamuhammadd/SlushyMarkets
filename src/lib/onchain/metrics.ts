import { createRng } from "@/lib/simulations/trades";

/**
 * Teaching versions of two common on-chain metrics, as pure functions.
 * Inputs are small invented examples, never live blockchain data.
 */

/** One spent output: what it was worth when it was created, and what it was worth when it was spent. */
export type SpentOutput = { createdUsd: number; spentUsd: number };

/**
 * SOPR (Spent Output Profit Ratio) for a group of outputs spent in the same period:
 * total USD value when spent / total USD value when created.
 * Above 1: on average the spent coins were worth more than when they were created.
 * Below 1: worth less. `null` when there is nothing to divide by.
 */
export function sopr(outputs: readonly SpentOutput[]): number | null {
  const created = outputs.reduce((sum, o) => sum + o.createdUsd, 0);
  const spent = outputs.reduce((sum, o) => sum + o.spentUsd, 0);
  return created > 0 ? spent / created : null;
}

export type SoprZone = "profit" | "loss" | "break-even";

/** Reading of a SOPR value. Values within `tolerance` of 1.0 count as break even. */
export function soprZone(value: number, tolerance = 0.005): SoprZone {
  if (Math.abs(value - 1) <= tolerance) return "break-even";
  return value > 1 ? "profit" : "loss";
}

/** SOPR gauge range. Matches the price sliders: $25,000 to $100,000 gives 0.25 to 4. */
export const SOPR_GAUGE = { min: 0.25, max: 4 } as const;
export const SOPR_GAUGE_TICKS = [0.25, 0.5, 1, 2, 4] as const;

/**
 * Where a SOPR value sits on the gauge, from 0 (left) to 1 (right). The scale is logarithmic,
 * so halving and doubling are the same distance and 1.0 is exactly the middle. A log scale
 * cannot show 0, so 0 and anything below the minimum (or not a number) pin to the left edge.
 */
export function soprGaugePosition(value: number, range: { min: number; max: number } = SOPR_GAUGE): number {
  if (!Number.isFinite(value) && value !== Infinity) return 0;
  if (value <= range.min) return 0;
  if (value >= range.max) return 1;
  return Math.log(value / range.min) / Math.log(range.max / range.min);
}

/** A coin (or output) with the BTC price at the moment it last moved on chain. */
export type Coin = { id: string; label: string; amountBtc: number; lastMovedPriceUsd: number };

/** Market value: every coin priced at today's price. */
export function marketValue(coins: readonly Coin[], priceUsd: number): number {
  return coins.reduce((sum, c) => sum + c.amountBtc * priceUsd, 0);
}

/** Realized value: every coin priced at the price when it last moved. */
export function realizedValue(coins: readonly Coin[]): number {
  return coins.reduce((sum, c) => sum + c.amountBtc * c.lastMovedPriceUsd, 0);
}

/** MVRV = market value / realized value. `null` when realized value is zero. */
export function mvrv(coins: readonly Coin[], priceUsd: number): number | null {
  const realized = realizedValue(coins);
  return realized > 0 ? marketValue(coins, priceUsd) / realized : null;
}

/** Moving a coin on chain resets its last moved price to the current price. Returns new coins. */
export function moveCoin(coins: readonly Coin[], id: string, priceUsd: number): Coin[] {
  return coins.map((c) => (c.id === id ? { ...c, lastMovedPriceUsd: priceUsd } : { ...c }));
}

export type VolumeGrowth =
  | { status: "ok"; percent: number }
  /** The earlier period had no volume, so an ordinary growth percentage is not defined. */
  | { status: "zero-base" }
  /** Negative or non-numeric input, or too few days of data. */
  | { status: "invalid" };

/** ((recent / previous) - 1) x 100. Never returns Infinity or NaN. */
export function volumeGrowthPercent(recentUsd: number, previousUsd: number): VolumeGrowth {
  if (!Number.isFinite(recentUsd) || !Number.isFinite(previousUsd) || recentUsd < 0 || previousUsd < 0) return { status: "invalid" };
  if (previousUsd === 0) return { status: "zero-base" };
  return { status: "ok", percent: (recentUsd / previousUsd - 1) * 100 };
}

export const DEX_GROWTH_WINDOW_DAYS = 7;

/**
 * DEX Volume Growth (7-day): the latest 7 days of USD swap volume against the 7 days before them.
 * `dailyUsd` is oldest first and needs at least 14 days. Only the last 14 are used.
 */
export function dexVolumeGrowth7d(dailyUsd: readonly number[]): VolumeGrowth {
  const n = DEX_GROWTH_WINDOW_DAYS;
  if (dailyUsd.length < 2 * n || dailyUsd.some((v) => !Number.isFinite(v) || v < 0)) return { status: "invalid" };
  const total = (days: readonly number[]) => days.reduce((sum, v) => sum + v, 0);
  return volumeGrowthPercent(total(dailyUsd.slice(-n)), total(dailyUsd.slice(-2 * n, -n)));
}

export type Crossing = { index: number; direction: "up" | "down" };

/**
 * Where a series crosses a level, comparing each value with the one before it.
 * Touching the level exactly does not count until the series ends up on the other side.
 */
export function crossings(series: readonly number[], level = 1): Crossing[] {
  const out: Crossing[] = [];
  let side = 0;
  series.forEach((value, index) => {
    const now = value > level ? 1 : value < level ? -1 : 0;
    if (now === 0) return;
    if (side !== 0 && now !== side) out.push({ index, direction: now > 0 ? "up" : "down" });
    side = now;
  });
  return out;
}

/**
 * Invented daily SOPR values for the timeline demo: a seeded, mean reverting walk around 1.0
 * with calm and nervous spells, so the line crosses 1.0 a few times. Rounded to 3 decimals.
 */
export function syntheticSoprSeries(seed: number, days = 60): number[] {
  const rand = createRng(seed);
  const out: number[] = [];
  let level = 1.02;
  let drift = 0.004;
  for (let day = 0; day < days; day += 1) {
    if (day % 12 === 0) drift = (rand() - 0.5) * 0.035;
    level += drift + (1 - level) * 0.12 + (rand() - 0.5) * 0.03;
    level = Math.min(Math.max(level, 0.86), 1.16);
    out.push(Math.round(level * 1000) / 1000);
  }
  return out;
}

/** Maps a dollar value onto two octaves above 220 Hz, so a higher value sounds higher. */
export function valueToHz(value: number, min: number, max: number): number {
  const t = max > min ? Math.min(Math.max((value - min) / (max - min), 0), 1) : 0.5;
  return 220 * 2 ** (2 * t);
}
